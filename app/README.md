# PHIRE Ticket Intelligence: web app

React (Vite) app that analyzes a PHIRE Excel export **entirely in the browser**.

| Path | What it is |
|---|---|
| `src/engine/` | NLP engine: TF-IDF (`text.js`), classifiers (`classify.js`), similarity + clustering (`similarity.js`), pipeline (`analyze.js`) |
| `src/lib/` | Column mapping (`columns.js`), Excel in/out with SheetJS (`excel.js`), dashboard aggregations (`stats.js`) |
| `src/components/` | Pages: Start + column mapping, Dashboard, Tickets + detail drawer, Recurring issues, Resources |
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
| `tests/e2e.mjs` | full flow in Chromium on desktop (light, dark) and phone, under the production CSP: demo load, 16/16 columns mapped, analysis, portfolio filter, search, drawer, recurring issues, Excel export, Resources, no horizontal scroll, no console errors, **no requests to other origins** | 39/39 |
