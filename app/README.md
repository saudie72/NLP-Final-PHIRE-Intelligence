# PHIRE Ticket Intelligence: web app

React (Vite) app that analyzes a PHIRE Excel export **entirely in the browser**.

| Path | What it is |
|---|---|
| `src/engine/` | NLP engine: TF-IDF (`text.js`), classifiers (`classify.js`), similarity + clustering (`similarity.js`), pipeline (`analyze.js`) |
| `src/lib/` | Column mapping (`columns.js`), Excel in/out with SheetJS (`excel.js`), dashboard aggregations (`stats.js`) |
| `src/components/` | Pages: Start + column mapping, Dashboard, Tickets + detail drawer, Recurring issues, Resources |
| `src/components/Chat.jsx` | "Ask the expert" tab in the ticket drawer |
| `netlify/functions/chat.mjs` | Netlify Function behind `/api/chat`: builds the expert's prompt and streams Claude's answer; the key stays server-side |
| `scripts/build-experts.mjs` | Bundles agent instructions + knowledge folders into `netlify/lib/experts-data.mjs` at build time (kept outside `netlify/functions/`, where every file becomes a function) |
| `src/worker.js` | Runs the analysis in a Web Worker so the page stays responsive |
| `public/model/model.json` | Model exported by `nlp/train.py` |
| `tests/` | Parity, unit and browser tests |

## Run

```bash
npm ci
```

```bash
npm run dev
```

`npm run build` writes `dist/`. Both `dev` and `build` first copy the synthetic demo export into `public/demo/`.

## Tests

```bash
npm test
```

```bash
npm run build && node tests/serve-with-headers.mjs 4174
```

```bash
node tests/e2e.mjs http://localhost:4174 test-results
```

| Suite | What it checks | Result |
|---|---|---|
| `tests/parity.test.js` | JS engine vs scikit-learn: probabilities (within 0.001), top-5 neighbours, identical clusters | 4/4 |
| `tests/unit.test.js` | column auto-mapping, renamed headers, required fields, dates, aging, analysis output, priority rules | 13/13 |
| `../pipeline/tests/` (pytest) | NLTK tokenizer, stopwords, VADER labels, urgency terms, collocations; spaCy EntityRuler, model entities, noun chunks; pipeline outputs | 14/14 |
| `tests/chat.test.js` | chat function with a fake client: not-configured, password, input limits, prompt contents, streaming, refusals | 6/6 |
| `tests/e2e-chat.mjs` | chat UI against the real function with a fake client: assigned expert, consent, password, streamed answer, same-origin only | 7/7 |
| `tests/e2e.mjs` | full flow in Chromium on desktop (light, dark) and phone, under the production CSP: demo load, 16/16 columns mapped, analysis, portfolio filter, search, drawer, recurring issues, Excel export, Resources, no horizontal scroll, no console errors, **no requests to other origins** | 68/68 |

## Turn on "Ask the expert" (optional, costs money)

In Netlify: **Site configuration → Environment variables → Add a variable**

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your Anthropic API key (platform.claude.com → API keys); tick **Contains secret values** |
| `APP_PASSWORD` | optional; anyone using the chat must type it |

Then **Deploys → Trigger deploy**. Each answer uses Claude Sonnet (`claude-sonnet-5-5`, low effort, up to 1,500
output tokens) and is billed to that key. Without the key the chat tab says it is not switched on and the rest of the
app works as before.
