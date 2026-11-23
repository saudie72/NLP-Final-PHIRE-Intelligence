#!/usr/bin/env node
/**
 * Step 10: call one of the project's agents from code with the Claude Agent SDK.
 *
 * Reads a SYNTHETIC PHIRE export (CSV) from data/synthetic/, picks the top open tickets by priority and
 * aging, and asks one agent (default: the Orchestrator) to assess them. The agent's instructions, model and
 * personality come from .claude/agents/<agent>.md, so the script uses the same team as Claude Code.
 *
 * Safety (see docs/data-handling.md):
 *   - Refuses any input file outside data/synthetic/ (real PHIRE exports must never be sent to an API).
 *   - Refuses files whose user IDs are not SYNUSERnnnn placeholders.
 *   - The agent may only read files (Read, Grep, Glob); it cannot run commands or write anything.
 *   - --dry-run prints exactly what would be sent, without calling the API or needing a key.
 *
 * Usage:
 *   node sdk/ask-agent.mjs --check-agents   (load and verify all agents; no API call)
 *   node sdk/ask-agent.mjs --dry-run
 *   node sdk/ask-agent.mjs [--agent orchestrator] [--file data/synthetic/phire_test.csv] [--top 5]
 * Needs ANTHROPIC_API_KEY for a real run (never commit it; .env files are git-ignored).
 */
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "@anthropic-ai/claude-agent-sdk";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SYNTHETIC_DIR = join(ROOT, "data", "synthetic");
const PRIORITY_RANK = { H: 0, M: 1, L: 2 };
const CLOSED = /^(9|10|11)-/;

function parseArgs(argv) {
  const args = { agent: "orchestrator", file: "data/synthetic/phire_test.csv", top: 5, dryRun: false, check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--check-agents") args.check = true;
    else if (a === "--agent") args.agent = argv[++i];
    else if (a === "--file") args.file = argv[++i];
    else if (a === "--top") args.top = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!/^[a-z-]+$/.test(args.agent)) throw new Error("--agent must be an agent id such as orchestrator");
  if (!Number.isInteger(args.top) || args.top < 1 || args.top > 20) throw new Error("--top must be 1-20");
  return args;
}

/** Only files inside data/synthetic/ may be read; symlinks are resolved first. */
function checkSynthetic(file) {
  const real = realpathSync(resolve(ROOT, file));
  const base = realpathSync(SYNTHETIC_DIR) + sep;
  if (!real.startsWith(base)) {
    throw new Error(`Refusing ${file}: only files in data/synthetic/ may be sent to the API (docs/data-handling.md).`);
  }
  if (!real.endsWith(".csv")) throw new Error("Use the CSV version of a synthetic export (for example phire_test.csv).");
  return real;
}

/** Minimal RFC 4180 CSV parser (quoted fields, embedded commas and newlines). */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

/** Extra guard: every user ID in the text must be a SYNUSER placeholder. */
function checkPlaceholders(tickets) {
  for (const t of tickets) {
    const ids = `${t.Title} ${t.Description}`.match(/\b(?:user ID|user|account|Disable|lock|Give|setup)\s+([A-Z]{5,12}\d*)\b/gi) || [];
    for (const m of ids) {
      const id = m.split(/\s+/).pop();
      if (/^[A-Z]{5,12}\d*$/.test(id) && !id.startsWith("SYNUSER") && id === id.toUpperCase()) {
        throw new Error(`Refusing: ticket ${t["Issue Num"]} has a user ID (${id}) that is not a SYNUSER placeholder.`);
      }
    }
  }
}

/** Load an agent file: YAML front matter (model) + body (system prompt). */
function loadAgent(id) {
  const text = readFileSync(join(ROOT, ".claude", "agents", `${id}.md`), "utf8");
  const end = text.indexOf("\n---", 4);
  const front = text.slice(4, end);
  const model = (front.match(/^model:\s*(\S+)/m) || [])[1] || "sonnet";
  return { model, prompt: text.slice(end + 4).trim() };
}

function pickTickets(all, n) {
  return all
    .filter((t) => !CLOSED.test(t.Status))
    .sort((a, b) => PRIORITY_RANK[a.Priority] - PRIORITY_RANK[b.Priority] || Number(b.Aging) - Number(a.Aging))
    .slice(0, n);
}

function buildPrompt(tickets, file) {
  const blocks = tickets.map((t) =>
    [`### ${t["Issue Num"]} (Module ${t.Module}, Priority ${t.Priority}, ${t.Status}, ${t.Aging} days open)`,
     `Title: ${t.Title}`, `Description: ${t.Description.replace(/\s+/g, " ").trim()}`].join("\n"));
  return [
    `These are the ${tickets.length} highest-priority open tickets from the SYNTHETIC PHIRE export ${file}.`,
    "Assess them for the support manager: for each ticket give Module / Issue area / Suggested priority, one",
    "Observation and one Hypothesis to check. Then list which tickets to escalate first and why.",
    "Keep the answer under 400 words and end with Sources.",
    "", ...blocks,
  ].join("\n");
}

/** --check-agents: load every agent file the way a real run would and verify it, without calling the API. */
function checkAgents() {
  const dir = join(ROOT, ".claude", "agents");
  const ids = readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort();
  let failures = 0;
  console.log(`SDK import: query is a ${typeof query}`);
  for (const id of ids) {
    const { model, prompt } = loadAgent(id);
    const checks = {
      model: ["opus", "sonnet", "haiku"].includes(model),
      title: /^# .+/m.test(prompt),
      name: /\*\*Your name is \w+\.\*\*/.test(prompt),
      knowledgeFirst: prompt.includes(`knowledge/${id}/**`),
      dataRules: prompt.includes("## Data-handling rules"),
      noFrontMatter: !prompt.startsWith("---") && !/^name:/m.test(prompt.split("\n")[0]),
    };
    const ok = Object.values(checks).every(Boolean);
    if (!ok) failures++;
    const who = (prompt.match(/\*\*Your name is (\w+)\.\*\*/) || [])[1] || "?";
    console.log(`${ok ? "PASS" : "FAIL"}  ${id.padEnd(24)} ${who.padEnd(8)} model=${model.padEnd(7)} prompt=${prompt.length} chars` +
      (ok ? "" : `  failed: ${Object.keys(checks).filter((k) => !checks[k]).join(", ")}`));
  }
  console.log(`\n${ids.length - failures}/${ids.length} agents load correctly`);
  if (failures) process.exitCode = 1;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.check) return checkAgents();
  const file = checkSynthetic(args.file);
  const tickets = pickTickets(parseCsv(readFileSync(file, "utf8")), args.top);
  checkPlaceholders(tickets);
  const agent = loadAgent(args.agent);
  const prompt = buildPrompt(tickets, relative(ROOT, file));

  console.log(`Agent: ${args.agent} (model: ${agent.model})   File: ${relative(ROOT, file)}   Tickets: ${tickets.length}\n`);
  if (args.dryRun) {
    console.log("--- prompt that would be sent ---\n" + prompt + "\n--- end (dry run: nothing sent) ---");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY for a real run, or use --dry-run.");

  for await (const message of query({
    prompt,
    options: {
      cwd: ROOT,
      model: agent.model,
      systemPrompt: agent.prompt,
      settingSources: [],                         // don't load local settings or hooks
      allowedTools: ["Read", "Grep", "Glob"],     // read-only: knowledge folder and docs
      disallowedTools: ["Bash", "Write", "Edit", "NotebookEdit", "WebFetch", "WebSearch", "Agent"],
      maxTurns: 15,
    },
  })) {
    if (message.type === "result") {
      if (message.subtype === "success" && !message.is_error) {
        console.log(message.result);
        console.log(`\n(${message.num_turns} turns, $${message.total_cost_usd.toFixed(4)})`);
      } else {
        console.error(`Run ended early: ${message.subtype}`, message.is_error ? message.result ?? "" : "");
        process.exitCode = 1;
      }
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
