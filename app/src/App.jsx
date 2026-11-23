import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyMapping, autoMap } from "./lib/columns.js";
import { exportReport, readWorkbook } from "./lib/excel.js";
import { PORTFOLIOS, filterPortfolio } from "./lib/stats.js";
import { Dashboard } from "./components/Dashboard.jsx";
import { Recurring } from "./components/Recurring.jsx";
import { Resources } from "./components/Resources.jsx";
import { Mapping, Start } from "./components/Start.jsx";
import { TicketDrawer, Tickets } from "./components/Tickets.jsx";
import { Icon } from "./components/ui.jsx";
import { Language } from "./components/Language.jsx";

const PAGES = ["start", "dashboard", "tickets", "recurring", "language", "resources"];
const pageFromHash = () => (PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : "start");
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};

export default function App() {
  const [model, setModel] = useState(null);
  const [page, setPage] = useState(pageFromHash);
  const [theme, setTheme] = useState(() => store.get("theme"));
  const [file, setFile] = useState(null);           // { name, wb, sheet, headers, rows }
  const [mapping, setMapping] = useState({});
  const [result, setResult] = useState(null);       // { tickets, recurring }
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [portfolio, setPortfolio] = useState(() => PORTFOLIOS.find((p) => p.id === store.get("portfolio")) || PORTFOLIOS[0]);
  const [filters, setFilters] = useState({});
  const [focus, setFocus] = useState(null);
  const [openId, setOpenId] = useState(null);
  const worker = useRef(null);
  const [modelError, setModelError] = useState(false);
  const [lang, setLang] = useState(null);           // build-time NLTK + spaCy results
  const [nltkText, setNltkText] = useState(null);

  const loadModel = useCallback(() => {
    setModelError(false);
    fetch("/model/model.json", { cache: "no-cache" })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(setModel)
      .catch(() => setModelError(true));
  }, []);

  useEffect(() => {
    fetch("/nlp/language.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then(setLang).catch(() => setLang(null));
    loadModel();
    const onHash = () => setPage(pageFromHash());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme; else delete document.documentElement.dataset.theme;
    store.set("theme", theme);
  }, [theme]);

  const go = useCallback((p, opts = {}) => {
    if (p === "tickets") setFilters(opts);
    if (p === "recurring") setFocus(opts.focus || null);
    if (p === "language") setNltkText(opts.text || null);
    location.hash = p;
    setPage(p);
    window.scrollTo(0, 0);
  }, []);

  const loadFile = async (blob, name) => {
    setError(null);
    try {
      const wb = await readWorkbook(await blob.arrayBuffer());
      const sheet = wb.sheetNames[0];
      const { headers, rows } = wb.sheet(sheet);
      if (!rows.length) throw new Error("That sheet has no rows.");
      setFile({ name, wb, sheet, headers, rows });
      setMapping({ ...autoMap(headers), ...(store.get(`map:${headers.join("|")}`) || {}) });
      setResult(null);
      go("start");
    } catch (e) {
      setError(`Could not read ${name}: ${e.message}`);
    }
  };
  // Demo: load plain JSON (no .xlsx download, no Excel parsing) and go straight to the analysis.
  const loadDemo = async () => {
    setError(null);
    try {
      const r = await fetch("/demo/phire_demo_export.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const { headers, rows } = await r.json();
      const demo = { name: "phire_demo_export.xlsx (synthetic)", wb: null, sheet: "sheet1", headers, rows };
      const map = autoMap(headers);
      setFile(demo);
      setMapping(map);
      setResult(null);
      runAnalysis(demo, map);
    } catch (e) {
      setError(`The demo data could not be loaded (${e.message}). Check your connection and try again.`);
    }
  };
  const chooseSheet = (sheet) => {
    const { headers, rows } = file.wb.sheet(sheet);
    setFile({ ...file, sheet, headers, rows });
    setMapping(autoMap(headers));
  };

  // Run the analysis in a Web Worker; if the worker can't start, errors, or stays silent, run it on the page instead.
  const runAnalysis = async (f = file, map = mapping) => {
    setError(null);
    const m = model;
    if (!m) return setError("The NLP model is still loading. Wait a moment and try again.");
    const { tickets } = applyMapping(f.rows, map);
    if (!tickets.length) return setError("No rows had a title or description to analyze.");
    store.set(`map:${f.headers.join("|")}`, map);
    setProgress(0.05);
    go("start");
    const slim = tickets.map(({ _row, ...t }) => t);
    const finish = (res) => {
      const rows = res.tickets.map((t, i) => ({ ...t, _row: tickets[i]._row }));
      setResult({ tickets: rows, recurring: res.recurring });
      setProgress(null);
      go("dashboard");
    };
    const onPage = async (reason) => {
      worker.current?.terminate();
      worker.current = null;
      console.info(`Analysis running on the page (${reason}).`);
      try {
        const { analyze } = await import("./engine/analyze.js");
        await new Promise((r) => setTimeout(r, 30)); // let the progress screen paint
        finish(analyze(m, slim));
      } catch (e) {
        setProgress(null);
        setError(`Analysis failed: ${e.message}`);
      }
    };
    let w;
    try {
      w = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    } catch {
      return onPage("worker not available");
    }
    worker.current?.terminate();
    worker.current = w;
    let settled = false;
    const silent = setTimeout(() => { if (!settled) { settled = true; onPage("worker did not respond"); } }, 15000);
    w.onerror = (e) => { e.preventDefault?.(); if (!settled) { settled = true; clearTimeout(silent); onPage("worker error"); } };
    w.onmessage = (e) => {
      if (settled) return;
      if (e.data.type === "progress") setProgress(e.data.value);
      if (e.data.type === "error") { settled = true; clearTimeout(silent); onPage(`worker: ${e.data.message}`); }
      if (e.data.type === "done") { settled = true; clearTimeout(silent); w.terminate(); finish(e.data.result); }
    };
    w.postMessage({ tickets: slim, model: m });
  };
  const analyze = () => runAnalysis(file, mapping);

  const view = useMemo(() => (result ? filterPortfolio(result.tickets, portfolio) : []), [result, portfolio]);
  const byId = useMemo(() => new Map((result?.tickets || []).map((t) => [t.id, t])), [result]);
  const viewRecurring = useMemo(() => {
    if (!result) return [];
    const ids = new Set(view.map((t) => t.id));
    return result.recurring.filter((g) => g.ticketIds.some((id) => ids.has(id)));
  }, [result, view]);
  const open = openId ? byId.get(openId) : null;

  const nav = [
    ["start", "Upload & map", Icon.upload, null],
    ["dashboard", "Dashboard", Icon.dash, null],
    ["tickets", "Tickets", Icon.list, result ? view.length : null],
    ["recurring", "Recurring issues", Icon.repeat, result ? viewRecurring.length : null],
    ["language", "Language · NLTK + spaCy", Icon.text, null],
    ["resources", "Resources", Icon.book, null],
  ];
  const needsData = page === "dashboard" || page === "tickets" || page === "recurring";
  const titles = { dashboard: "Support overview", tickets: "Tickets", recurring: "Recurring issues", resources: "Resources" };

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <a className="brand" href="#start" onClick={() => go("start")}>
          <span className="brand-mark">PHI</span>
          <span><b>Ticket Intelligence</b><small>PeopleSoft · PHIRE</small></span>
        </a>
        <div className="nav">
          {nav.map(([id, label, I, count]) => (
            <button key={id} onClick={() => go(id)} aria-current={page === id ? "page" : undefined}
              disabled={!result && ["dashboard", "tickets", "recurring"].includes(id)} title={label}>
              <I /><span>{label}</span>{count != null && <em className="count">{count}</em>}
            </button>
          ))}
        </div>
        <div className="rail-foot">
          <div className="privacy"><Icon.lock /><span>Analysis runs in this browser. Files are never uploaded.</span></div>
        </div>
      </nav>

      <main className="workspace">
        {modelError && (
          <div className="warnmsg row" role="alert" style={{ justifyContent: "space-between" }}>
            <span>The NLP model could not be downloaded, so analysis can't run yet.</span>
            <button className="btn" onClick={loadModel}>Try again</button>
          </div>
        )}
        {error && file && (
          <div className="warnmsg row" role="alert" style={{ justifyContent: "space-between" }}>
            <span>{error}</span>
            <button className="btn" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        <div className="appbar">
          <div className="theme-switch" role="radiogroup" aria-label="Color theme">
            {[["light", "Light", Icon.sun], ["dark", "Dark", Icon.moon], [null, "System", Icon.monitor]].map(([value, label, I]) => (
              <button key={label} role="radio" aria-checked={theme === value} data-testid={`theme-${label.toLowerCase()}`}
                title={value ? `${label} theme` : "Follow the device setting"} onClick={() => setTheme(value)}>
                <I /><span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        {page === "start" && progress != null && (
          <div className="panel" role="status" style={{ display: "grid", gap: 12 }}>
            <h2>Analyzing {file?.rows.length} tickets…</h2>
            <div className="progress"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <p className="faint">Vectorizing, classifying, comparing every pair of tickets and clustering. This stays on your device.</p>
          </div>
        )}
        {page === "start" && progress == null && (file
          ? <Mapping fileName={file.name} sheetNames={file.wb?.sheetNames || [file.sheet]} sheet={file.sheet} onSheet={chooseSheet} headers={file.headers}
              rows={file.rows} mapping={mapping} setMapping={setMapping} onAnalyze={analyze} onCancel={() => { setFile(null); setError(null); }} />
          : <Start metrics={model?.metrics} onFile={(f) => loadFile(f, f.name)} onDemo={loadDemo} busy={!model} loading={!model && !modelError} error={error} />)}

        {needsData && !result && page !== "start" && (
          <div className="panel"><p>Load a PHIRE export or the demo data first.</p><button className="btn primary" style={{ marginTop: 10 }} onClick={() => go("start")}>Go to upload</button></div>
        )}

        {result && needsData && (
          <>
            <div className="topbar">
              <div className="file">
                <span className="eyebrow">{file?.name}</span>
                <h1>{titles[page]}</h1>
                <div className="chips" role="group" aria-label="Module portfolio">
                  {PORTFOLIOS.map((p) => (
                    <button key={p.id} className="chip" aria-pressed={portfolio.id === p.id}
                      onClick={() => { setPortfolio(p); store.set("portfolio", p.id); }}>{p.label}</button>
                  ))}
                </div>
              </div>
              <div className="actions">
                <button className="btn primary" data-testid="export"
                  onClick={() => exportReport({ tickets: result.tickets, recurring: result.recurring, headers: file.headers, fileName: file.name.replace(/ \(synthetic\)$/, ""), model })}>
                  <Icon.download />Export Excel report
                </button>
              </div>
            </div>
            {page === "dashboard" && <Dashboard tickets={view} recurring={viewRecurring} go={go} openTicket={setOpenId} />}
            {page === "tickets" && <Tickets tickets={view} filters={filters} setFilters={setFilters} openTicket={setOpenId} />}
            {page === "recurring" && <Recurring recurring={viewRecurring} byId={byId} focus={focus} openTicket={setOpenId} />}
          </>
        )}
        <footer className="footer">
          <span>PHIRE Ticket Intelligence · NLP final project · synthetic demo data</span>
          <a href="#resources" onClick={(e) => { e.preventDefault(); go("resources"); }}>Resources &amp; links</a>
          <a href="https://github.com/saudie72/NLP-Final-PHIRE-Intelligence" target="_blank" rel="noopener noreferrer">GitHub</a>
        </footer>
        {page === "language" && (
          <>
            <div className="topbar"><div className="file"><span className="eyebrow">Build-time pipeline + live NLTK</span><h1>Language analysis</h1></div></div>
            <Language data={lang} initialText={nltkText} go={go} />
          </>
        )}
        {page === "resources" && <Resources model={model ? { ...model, vocabSize: model.vocab.length.toLocaleString() } : null} />}
      </main>
      {open && <TicketDrawer ticket={open} byId={byId} lang={lang} onClose={() => setOpenId(null)} openTicket={setOpenId} go={go} />}
    </div>
  );
}
