// Serves app/dist with the exact headers from netlify.toml, so tests run under the production CSP.
// Usage: node tests/serve-with-headers.mjs [port]
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const port = Number(process.argv[2] || 4174);
const dist = new URL("../dist/", import.meta.url).pathname;
const toml = readFileSync(new URL("../../netlify.toml", import.meta.url), "utf8");
const block = toml.split('for = "/*"')[1].split("[[headers]]")[0];
const headers = Object.fromEntries([...block.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"(.*)"\s*$/gm)].map((m) => [m[1], m[2]]));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".woff": "font/woff", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };

createServer((req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(dist, p);
  if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) file = join(dist, "index.html");
  res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", ...headers });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`serving dist with netlify.toml headers on http://localhost:${port}`));
