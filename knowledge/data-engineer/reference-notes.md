# Data Engineer reference notes

## SheetJS
- `XLSX.read(data, { type: "array", cellDates: true })` parses a workbook in the browser; `cellDates` returns
  Date objects for date cells.
- `XLSX.utils.sheet_to_json(ws, { defval: "", raw: true })` → row objects; `{ header: 1 }` → arrays (first row = headers).
- `XLSX.writeFile(wb, name)` downloads a workbook; `json_to_sheet` writes text cells as strings (no formulas).
- Sources: https://docs.sheetjs.com/docs/api/parse-options, https://docs.sheetjs.com/docs/api/utilities/array,
  https://docs.sheetjs.com/docs/api/write-options

## Data rules
- Only `data/synthetic/` is committed; the demo is shipped as JSON (`public/demo/phire_demo_export.json`) so
  networks that block .xlsx downloads don't break it.
- The NLTK/spaCy pipeline reads `data/synthetic/phire_test.csv` (the demo tickets).
