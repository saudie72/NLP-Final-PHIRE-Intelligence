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

const PAGES = ["start", "dashboard", "tickets", "recurring", "resources"];
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

  useEffect(() => {
    fetch("/model/model.json").then((r) => r.json()).then(setModel).catch(() => setError("The NLP model could not be loaded. Refresh the page to try again."));
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
  const loadDemo = async () => {
    const r = await fetch("/demo/phire_demo_export.xlsx");
    if (!r.ok) return setError("The demo file is missing from this build.");
    loadFile(await r.blob(), "phire_demo_export.xlsx (synthetic)");
  };
  const chooseSheet = (sheet) => {
    const { headers, rows } = file.wb.sheet(sheet);
    setFile({ ...file, sheet, headers, rows });
    setMapping(autoMap(headers));
  };

  const analyze = () => {
    const { tickets } = applyMapping(file.rows, mapping);
    if (!tickets.length) return setError("No rows had a title or description to analyze.");
    store.set(`map:${file.headers.join("|")}`, mapping);
    setProgress(0.05);
    worker.current?.terminate();
    const w = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (e) => {
      if (e.data.type === "progress") setProgress(e.data.value);
      if (e.data.type === "error") { setProgress(null); setError(`Analysis failed: ${e.data.message}`); }
      if (e.data.type === "done") {
        const rows = e.data.result.tickets.map((t, i) => ({ ...t, _row: tickets[i]._row }));
        setResult({ tickets: rows, recurring: e.data.result.recurring });
        setProgress(null);
        w.terminate();
        go("dashboard");
      }
    };
    w.postMessage({ tickets: tickets.map(({ _row, ...t }) => t), model });
  };

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
          ? <Mapping fileName={file.name} sheetNames={file.wb.sheetNames} sheet={file.sheet} onSheet={chooseSheet} headers={file.headers}
              rows={file.rows} mapping={mapping} setMapping={setMapping} onAnalyze={analyze} onCancel={() => { setFile(null); setError(null); }} />
          : <Start metrics={model?.metrics} onFile={(f) => loadFile(f, f.name)} onDemo={loadDemo} busy={!model} error={error} />)}

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
        {page === "resources" && <Resources model={model ? { ...model, vocabSize: model.vocab.length.toLocaleString() } : null} />}
      </main>
      {open && <TicketDrawer ticket={open} byId={byId} onClose={() => setOpenId(null)} openTicket={setOpenId} go={go} />}
    </div>
  );
}
