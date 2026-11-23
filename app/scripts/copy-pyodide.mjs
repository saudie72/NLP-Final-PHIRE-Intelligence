// Self-hosts Pyodide (Python in WebAssembly) for the in-browser NLTK box, so no script or data comes from a CDN
// and the site's CSP stays 'self'. Core files come from the pinned npm package; the three wheels NLTK needs
// (nltk, regex, sqlite3) are downloaded once from the official Pyodide release and checked against the
// SHA-256 hashes in pyodide-lock.json. Output: public/pyodide/ (git-ignored).
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const pkg = new URL("../node_modules/pyodide/", import.meta.url);
const out = new URL("../public/pyodide/", import.meta.url);
const VERSION = JSON.parse(readFileSync(new URL("package.json", pkg))).version;
const CDN = `https://cdn.jsdelivr.net/pyodide/v${VERSION}/full/`;
const CORE = ["pyodide.mjs", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
const NEEDED = ["nltk"];

mkdirSync(out, { recursive: true });
for (const f of CORE) copyFileSync(new URL(f, pkg), new URL(f, out));

const lock = JSON.parse(readFileSync(new URL("pyodide-lock.json", pkg)));
const wanted = new Set();
const walk = (n) => { n = n.toLowerCase(); if (wanted.has(n)) return; wanted.add(n); lock.packages[n].depends.forEach(walk); };
NEEDED.forEach(walk);

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
for (const name of wanted) {
  const { file_name, sha256 } = lock.packages[name];
  const dest = new URL(file_name, out);
  if (existsSync(dest) && sha(readFileSync(dest)) === sha256) continue;
  const res = await fetch(CDN + file_name);
  if (!res.ok) throw new Error(`Download failed for ${file_name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha(buf) !== sha256) throw new Error(`Checksum mismatch for ${file_name}`);
  writeFileSync(dest, buf);
}
console.log(`self-hosted Pyodide ${VERSION}: core + ${[...wanted].join(", ")} in public/pyodide/`);
