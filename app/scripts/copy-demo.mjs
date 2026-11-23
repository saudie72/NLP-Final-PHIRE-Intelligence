// Prepares the synthetic demo for the "Load demo data" button:
//  - public/demo/phire_demo_export.xlsx  (the file itself, for anyone who wants to download it)
//  - public/demo/phire_demo_export.json  ({ headers, rows }), which the button loads. Plain JSON avoids networks
//    and browser settings that block .xlsx downloads, and skips Excel parsing for the demo.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";

const src = new URL("../../data/synthetic/phire_demo_export.xlsx", import.meta.url);
mkdirSync(new URL("../public/demo/", import.meta.url), { recursive: true });
copyFileSync(src, new URL("../public/demo/phire_demo_export.xlsx", import.meta.url));
const wb = XLSX.read(readFileSync(src), { type: "buffer", cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0].map(String);
const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true })
  .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v])));
writeFileSync(new URL("../public/demo/phire_demo_export.json", import.meta.url), JSON.stringify({ headers, rows }));
console.log(`prepared synthetic demo: ${rows.length} rows (xlsx + json) in public/demo/`);
