// Serves app/dist with the exact headers from netlify.toml, so tests run under the production CSP.
// Also routes /api/chat to the real Netlify Function (netlify/functions/chat.mjs).
// Usage: node tests/serve-with-headers.mjs [port]            chat "not configured" (no key)
//        FAKE_CHAT=1 node tests/serve-with-headers.mjs [port] chat on, answered by a fake client (no API spend)
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { handle } from "../netlify/functions/chat.mjs";

const port = Number(process.argv[2] || 4174);
const dist = new URL("../dist/", import.meta.url).pathname;
const toml = readFileSync(new URL("../../netlify.toml", import.meta.url), "utf8");
const block = toml.split('for = "/*"')[1].split("[[headers]]")[0];
const headers = Object.fromEntries([...block.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"(.*)"\s*$/gm)].map((m) => [m[1], m[2]]));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

const fake = process.env.FAKE_CHAT === "1";
const env = fake ? { ANTHROPIC_API_KEY: "fake", APP_PASSWORD: "demo" } : {};
const fakeClient = () => ({ beta: { messages: { stream: (p) => {
  const text = `**Observations:** the ticket is ${p.messages[0].content.match(/Issue: (\S+)/)?.[1]}.\n\n- Check the setup first.\n\n**Sources:** test`;
  return { async *[Symbol.asyncIterator]() { for (const ch of text.match(/.{1,6}/gs)) yield { type: "content_block_delta", delta: { type: "text_delta", text: ch } }; },
    finalMessage: async () => ({ stop_reason: "end_turn" }) };
} } } });

async function api(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const r = await handle(new Request(`http://localhost${req.url}`, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined }), env, fakeClient);
  res.writeHead(r.status, { ...Object.fromEntries(r.headers), ...headers });
  if (r.body) for await (const c of r.body) res.write(c);
  res.end();
}

createServer((req, res) => {
  if (req.url.startsWith("/api/chat")) return void api(req, res);
  let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, "index.html");
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", ...headers });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`serving dist with netlify.toml headers on http://localhost:${port}`));
