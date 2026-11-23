import { useRef, useState } from "react";
import { FIELDS, mappingProblems } from "../lib/columns.js";
import { Icon } from "./ui.jsx";

export function Start({ metrics, onFile, onDemo, busy, loading, error }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const drop = (e) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };
  return (
    <div className="start">
      <section className={`drop ${over ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)} onDrop={drop} aria-label="Upload a PHIRE export">
        <span className="eyebrow">PeopleSoft HCM 9.2 · FSCM 9.2</span>
        <h1>Turn a PHIRE export into a clear picture of your support work.</h1>
        <p className="muted" style={{ maxWidth: "54ch" }}>
          Drop an Excel export of PHIRE issues. Each ticket is classified by module and issue area, matched with
          similar and duplicate tickets, grouped into recurring issues, and checked against its recorded priority.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={() => input.current?.click()} disabled={busy}><Icon.upload />Choose an .xlsx file</button>
          <button className="btn" onClick={onDemo} disabled={busy} data-testid="demo"><Icon.spark />{loading ? "Loading the model…" : "Load demo data (250 synthetic tickets)"}</button>
        </div>
        <input ref={input} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {error && <p className="warnmsg" role="alert">{error}</p>}
        <p className="faint" style={{ fontSize: ".82rem", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 16, display: "inline-flex" }}><Icon.lock /></span>
          Processed in your browser. The file is never uploaded. Use synthetic or approved data on this public site.
        </p>
      </section>
      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <span className="eyebrow">How it works</span>
          <ol className="steps" style={{ marginTop: 12 }}>
            <li><div><b>Map your columns.</b> <span className="muted">PHIRE headers are matched automatically; rename-tolerant.</span></div></li>
            <li><div><b>NLP analysis.</b> <span className="muted">TF-IDF features feed a module classifier and an issue-area classifier.</span></div></li>
            <li><div><b>Similarity &amp; clustering.</b> <span className="muted">Cosine similarity finds related tickets; clustering finds recurring issues.</span></div></li>
            <li><div><b>Review &amp; export.</b> <span className="muted">Dashboard by module portfolio, then an Excel report with AI columns.</span></div></li>
          </ol>
        </div>
        {metrics && (
          <div>
            <span className="eyebrow">Held-out test results (synthetic)</span>
            <div className="metric-strip" style={{ marginTop: 10 }}>
              <div><b>{Math.round(metrics.moduleAccuracy * 100)}%</b><span>module accuracy</span></div>
              <div><b>{Math.round(metrics.areaAccuracy * 100)}%</b><span>issue-area accuracy</span></div>
              <div><b>{Math.round(metrics.similarP5 * 100)}%</b><span>similar-ticket precision@5</span></div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function Mapping({ fileName, sheetNames, sheet, onSheet, headers, rows, mapping, setMapping, onAnalyze, onCancel }) {
  const problems = mappingProblems(mapping);
  const mapped = new Set(Object.values(mapping));
  const extra = headers.filter((h) => !mapped.has(h));
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="topbar">
        <div className="file"><span className="eyebrow">Step 1 of 2 · Map columns</span><h1>{fileName}</h1>
          <p className="muted">{rows.length} rows · {headers.length} columns{sheetNames.length > 1 ? ` · sheet "${sheet}"` : ""}</p></div>
        <div className="actions">
          {sheetNames.length > 1 && (
            <label className="field">Sheet
              <select id="sheet" className="input" value={sheet} onChange={(e) => onSheet(e.target.value)}>
                {sheetNames.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
          <button className="btn" onClick={onCancel}>Choose another file</button>
          <button className="btn primary" onClick={onAnalyze} disabled={problems.length > 0} data-testid="analyze">Analyze {rows.length} tickets</button>
        </div>
      </div>
      {problems.map((p) => <p key={p} className="warnmsg" role="alert">{p}</p>)}
      <div className="table-wrap">
        <table className="maptable">
          <thead><tr><th>App field</th><th>Column in your file</th><th>Example value</th><th /></tr></thead>
          <tbody>
            {FIELDS.map((f) => {
              const col = mapping[f.key] || "";
              const ex = col ? String(rows.find((r) => r[col] !== "")?.[col] ?? "") : "";
              return (
                <tr key={f.key}>
                  <td><b>{f.label}</b>{(f.key === "title" || f.key === "description") && <span className="faint"> · text</span>}</td>
                  <td>
                    <select id={`map-${f.key}`} className="input" value={col} aria-label={`Column for ${f.label}`}
                      onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value || undefined })}>
                      <option value="">— not in file —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                  <td className="muted" style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ex instanceof Date ? ex.toISOString().slice(0, 10) : ex.slice(0, 90)}
                  </td>
                  <td>{col && <span className="ok">✓ mapped</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {extra.length > 0 && <p className="faint">Kept as-is in the Excel report: {extra.join(", ")}</p>}
    </div>
  );
}
