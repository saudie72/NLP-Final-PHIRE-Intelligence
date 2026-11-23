// "Ask the expert" chat: a Netlify Function that keeps the Anthropic API key on the server.
//
// GET  /api/chat -> { configured, passwordRequired, model, experts }
// POST /api/chat -> streams the expert's answer as plain text
//      body: { expert, password?, ticket: {...}, similar: [...], messages: [{ role, content }] }
//
// Environment variables (set in Netlify, never in the repository):
//   ANTHROPIC_API_KEY  required to turn chat on; without it the app keeps working and chat shows "not configured"
//   APP_PASSWORD       optional; when set, every chat request must send it
//
// Data handling: only the ticket the user is chatting about (plus titles of similar tickets) is sent, and only
// after the user starts a chat and confirms the notice in the app. See docs/data-handling.md.
import { createHash, timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import EXPERTS from "../lib/experts-data.mjs";

export const config = { path: "/api/chat" };

export const MODEL = "claude-sonnet-5-5";
const MAX_TOKENS = 1500;
const MAX_TURNS = 16;
const MAX_MESSAGE_CHARS = 2000;
const MAX_FIELD_CHARS = 4000;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const clip = (v, n = MAX_FIELD_CHARS) => (v == null ? "" : String(v).slice(0, n));

function passwordOk(given, expected) {
  if (!expected) return true;
  const h = (s) => createHash("sha256").update(String(s ?? "")).digest();
  return timingSafeEqual(h(given), h(expected));
}

const CHAT_RULES = `
## Chat rules
- You are answering inside the PHIRE Ticket Intelligence web app, in a chat about ONE ticket shown below.
- You cannot run tools or call other agents here. Your knowledge-folder files, if any, are included below.
- Keep answers short (under 250 words unless asked for more). Use the ticket's own details.
- Keep **Observations** (what the ticket says) separate from **Hypotheses** (what to check). Never claim a root cause.
- End with **Sources:** the knowledge files or general PeopleSoft knowledge you relied on.
- Data rule: the app is for synthetic or approved data. If the ticket appears to contain real personal data
  (names, employee IDs, pay amounts tied to a person, medical details), say so and do not repeat it.`;

const TEAM_RULES = `
## Whole-team chat
In this chat you cannot start other agents. Answer as the coordinator of the team, giving each relevant
specialist's view in a labelled line (Ray, ERP Functional Analyst; Kwame, ERP Developer; Dana, PeopleSoft
Administrator; Gloria, ERP Manager; Priya, ERP Business Analyst), then one combined recommendation.`;

/** System prompt: agent instructions + knowledge files + chat rules. Identical for every ticket, so it caches well. */
export function buildSystem(expertId) {
  const e = EXPERTS[expertId];
  const knowledge = e.knowledge.length
    ? e.knowledge.map((k) => `### ${k.file}\n\n${k.text}`).join("\n\n")
    : "Your knowledge folder has no documents yet (README only).";
  return `${e.prompt}\n\n## Your knowledge folder\n\n${knowledge}\n${CHAT_RULES}${expertId === "orchestrator" ? `\n${TEAM_RULES}` : ""}`;
}

/** The ticket under discussion, placed first in the conversation. */
export function buildTicketContext(ticket = {}, similar = []) {
  const lines = [
    "Ticket under discussion (from a PHIRE export):",
    `- Issue: ${clip(ticket.id, 40)} | PHIRE module: ${clip(ticket.module, 10) || "not given"} | priority: ${clip(ticket.priority, 5) || "not given"} | status: ${clip(ticket.status, 60) || "not given"} | type: ${clip(ticket.issueType, 60) || "not given"}`,
    `- Title: ${clip(ticket.title, 300)}`,
    `- Description: ${clip(ticket.description)}`,
    `- AI classification: module ${clip(ticket.predictedModule, 10)} (${Math.round((Number(ticket.moduleConfidence) || 0) * 100)}%), issue area ${clip(ticket.issueArea, 20)} (${Math.round((Number(ticket.areaConfidence) || 0) * 100)}%), suggested priority ${clip(ticket.suggestedPriority, 5)}`,
  ];
  const sim = (Array.isArray(similar) ? similar : []).slice(0, 5);
  if (sim.length) {
    lines.push("- Most similar tickets in the same file:");
    for (const s of sim) lines.push(`  - ${clip(s.id, 40)} "${clip(s.title, 200)}" (${clip(s.kind, 12)}, cosine ${Number(s.score || 0).toFixed(2)})${s.resolutionCode ? `, resolved: ${clip(s.resolutionCode, 80)}` : ""}`);
  }
  return lines.join("\n");
}

/** Validate and build the Messages API request. Returns { error } or { params }. */
export function buildRequest(body) {
  if (!body || typeof body !== "object") return { error: "Invalid request body." };
  if (!EXPERTS[body.expert]) return { error: "Unknown expert." };
  const msgs = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return { error: "The last message must be from the user." };
  for (const [i, m] of msgs.entries()) {
    if (!["user", "assistant"].includes(m?.role) || typeof m.content !== "string" || !m.content.trim()) return { error: "Invalid message." };
    if (m.content.length > MAX_MESSAGE_CHARS) return { error: `Messages are limited to ${MAX_MESSAGE_CHARS} characters.` };
    if (i > 0 && msgs[i - 1].role === m.role) return { error: "Messages must alternate between user and assistant." };
  }
  if (msgs[0].role !== "user") msgs.shift();
  const [first, ...rest] = msgs;
  const messages = [
    { role: "user", content: `${buildTicketContext(body.ticket, body.similar)}\n\nQuestion: ${first.content}` },
    ...rest.map((m) => ({ role: m.role, content: m.content })),
  ];
  return {
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text", text: buildSystem(body.expert), cache_control: { type: "ephemeral" } }],
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    },
  };
}

/** Request handler; the client factory is injectable for tests. */
export async function handle(req, env = process.env, makeClient = (apiKey) => new Anthropic({ apiKey })) {
  const configured = Boolean(env.ANTHROPIC_API_KEY);
  if (req.method === "GET") {
    return json(200, {
      configured, passwordRequired: Boolean(env.APP_PASSWORD), model: MODEL,
      experts: Object.values(EXPERTS).map(({ id, name, role }) => ({ id, name, role })),
    });
  }
  if (req.method !== "POST") return json(405, { error: "Method not allowed." });
  if (!configured) return json(503, { error: "Chat is not configured on this site (no ANTHROPIC_API_KEY)." });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON." }); }
  if (!passwordOk(body?.password, env.APP_PASSWORD)) return json(401, { error: "Wrong or missing app password." });
  const { error, params } = buildRequest(body);
  if (error) return json(400, { error });

  const client = makeClient(env.ANTHROPIC_API_KEY);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.beta.messages.stream(params);
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(encoder.encode(event.delta.text));
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(encoder.encode("\n\n_The model declined to answer this question._"));
        if (final.stop_reason === "max_tokens") controller.enqueue(encoder.encode("\n\n_(Answer cut short. Ask me to continue.)_"));
      } catch (err) {
        const msg = err instanceof Anthropic.AuthenticationError ? "The API key on this site is invalid."
          : err instanceof Anthropic.RateLimitError ? "Too many requests right now. Try again in a minute."
          : err instanceof Anthropic.APIError ? `The AI service returned an error (${err.status ?? "network"}).`
          : "Something went wrong while answering.";
        controller.enqueue(encoder.encode(`\n\n_${msg}_`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export default (req) => handle(req);
