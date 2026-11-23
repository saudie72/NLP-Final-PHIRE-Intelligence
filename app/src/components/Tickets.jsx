import { useEffect, useMemo, useRef, useState } from "react";
import { AREAS, MODULE_NAMES, moduleOf, today } from "../lib/stats.js";
import { Area, ConfidenceBar, Icon, Mod, Prio, areaColor } from "./ui.jsx";

const PAGE = 50;

export function Tickets({ tickets, filters, setFilters, openTicket }) {
  const [page, setPage] = useState(0);
  const f = { q: "", module: "", area: "", open: "", flag: "", ...filters };
  const set = (patch) => { setPage(0); setFilters({ ...f, ...patch }); };
  const mods = useMemo(() => [...new Set(tickets.map(moduleOf))].sort(), [tickets]);
  const t0 = today();

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return tickets.filter((t) =>
      (!q || `${t.id} ${t.title} ${t.description} ${t.keywords.join(" ")}`.toLowerCase().includes(q)) &&
      (!f.module || moduleOf(t) === f.module) &&
      (!f.area || t.issueArea === f.area) &&
      (!f.open || (f.open === "open" ? t.open : f.open === "closed" ? !t.open : t.open && t.dueDate && t.dueDate < t0)) &&
      (!f.flag || (f.flag === "review" ? t.needsReview || t.moduleMismatch
        : f.flag === "duplicate" ? t.similar.some((s) => s.kind === "duplicate")
        : f.flag === "priority" ? t.priorityDisagrees : t.recurringIssue)));
  }, [tickets, f.q, f.module, f.area, f.open, f.flag, t0]);
  const shown = rows.slice(page * PAGE, (page + 1) * PAGE);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="filters">
        <label className="field" style={{ flex: "1 1 220px" }}>Search
          <input id="q" className="input" placeholder="ID, words in title or description…" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        </label>
        <label className="field">Module
          <select id="f-module" className="input" value={f.module} onChange={(e) => set({ module: e.target.value })}>
            <option value="">All</option>{mods.map((m) => <option key={m} value={m}>{m} · {MODULE_NAMES[m] || m}</option>)}
          </select>
        </label>
        <label className="field">Issue area
          <select id="f-area" className="input" value={f.area} onChange={(e) => set({ area: e.target.value })}>
            <option value="">All</option>{AREAS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="field">Status
          <select id="f-open" className="input" value={f.open} onChange={(e) => set({ open: e.target.value })}>
            <option value="">All</option><option value="open">Open</option><option value="overdue">Overdue</option><option value="closed">Closed</option>
          </select>
        </label>
        <label className="field">Show only
          <select id="f-flag" className="input" value={f.flag} onChange={(e) => set({ flag: e.target.value })}>
            <option value="">Everything</option><option value="review">Needs review</option><option value="duplicate">Possible duplicates</option>
            <option value="priority">Priority disagreements</option><option value="recurring">In a recurring issue</option>
          </select>
        </label>
        {Object.values(filters).some(Boolean) && <button className="btn" onClick={() => setFilters({})}>Clear filters</button>}
      </div>
      <p className="faint" style={{ fontSize: ".82rem" }} aria-live="polite">{rows.length} of {tickets.length} tickets</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Ticket</th><th>Title</th><th>PHIRE module</th><th>AI module</th><th>Issue area</th><th title="PHIRE priority → suggested">Priority</th><th>Status</th><th className="num">Age</th></tr>
          </thead>
          <tbody>
            {shown.map((t) => (
              <tr key={t.id} onClick={() => openTicket(t.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && openTicket(t.id)}>
                <td className="mono">{t.id}</td>
                <td className="title"><b>{t.title}</b>
                  <span className="row" style={{ marginTop: 4, gap: 6 }}>
                    {t.recurringIssue && <span className="flag">Recurring {t.recurringIssue}</span>}
                    {t.similar.some((s) => s.kind === "duplicate") && <span className="flag">Possible duplicate</span>}
                    {(t.needsReview || t.moduleMismatch) && <span className="flag">Review</span>}
                  </span>
                </td>
                <td><Mod value={t.module} title={MODULE_NAMES[t.module]} /></td>
                <td><Mod value={t.predictedModule} title={`${Math.round(t.moduleConfidence * 100)}% confidence`} /></td>
                <td><Area value={t.issueArea} /></td>
                <td style={{ whiteSpace: "nowrap" }}><Prio value={t.priority} />{t.priorityDisagrees && <> <span className="faint">→</span> <Prio value={t.suggestedPriority} /></>}</td>
                <td className="muted" style={{ whiteSpace: "nowrap", fontSize: ".82rem" }}>{t.status || "—"}</td>
                <td className="num">{t.aging ?? "—"}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={8} className="muted" style={{ padding: 24 }}>No tickets match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > PAGE && (
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="faint">Page {page + 1} of {Math.ceil(rows.length / PAGE)}</span>
          <button className="btn" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

export function TicketDrawer({ ticket: t, byId, onClose, openTicket, go }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [t.id, onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Ticket ${t.id}`}>
        <button ref={closeRef} className="btn close" onClick={onClose} aria-label="Close"><Icon.x /></button>
        <div style={{ display: "grid", gap: 8, paddingRight: 48 }}>
          <span className="eyebrow mono">{t.id}{t.cr ? ` · ${t.cr}` : ""}</span>
          <h2 style={{ fontSize: "1.25rem" }}>{t.title}</h2>
          <div className="row" style={{ fontSize: ".84rem" }}>
            <Mod value={t.module} /><span className="muted">{t.issueType}</span>
            <span className="muted">· {t.status}</span>
            {t.openDate && <span className="faint">· opened {t.openDate}</span>}
          </div>
        </div>
        {t.description && <div className="desc">{t.description}</div>}

        <section style={{ display: "grid", gap: 10 }}>
          <span className="eyebrow">AI classification</span>
          <ConfidenceBar label={`Module ${t.predictedModule}`} value={t.moduleConfidence} color="var(--ink-2)" />
          <ConfidenceBar label={t.issueArea} value={t.areaConfidence} color={areaColor(t.issueArea)} />
          <p className="muted" style={{ fontSize: ".84rem" }}>
            Deciding words: {[...new Set([...t.moduleWords, ...t.areaWords])].map((w) => <span key={w} className="kw" style={{ marginRight: 4 }}>{w}</span>)}
          </p>
          {t.moduleMismatch && <p className="warnmsg">PHIRE says <b>{t.module}</b>; the model suggests <b>{t.predictedModule}</b> ({MODULE_NAMES[t.predictedModule]}). Worth a second look.</p>}
          {t.needsReview && !t.moduleMismatch && <p className="warnmsg">Low confidence: the wording fits more than one category. A person should confirm.</p>}
        </section>

        <section style={{ display: "grid", gap: 8 }}>
          <span className="eyebrow">Priority</span>
          <div className="row" style={{ fontSize: ".9rem" }}>
            PHIRE <Prio value={t.priority} /> <span className="faint">·</span> suggested <Prio value={t.suggestedPriority} />
            <span className="muted">{t.priorityReason ? `cue: “${t.priorityReason}”` : "no urgency or low-priority cues found"}</span>
          </div>
        </section>

        <section style={{ display: "grid", gap: 8 }}>
          <span className="eyebrow">Keywords</span>
          <div className="row">{t.keywords.map((k) => <span key={k} className="kw">{k}</span>)}</div>
        </section>

        {t.recurringIssue && (
          <section className="row">
            <span className="flag">Part of recurring issue {t.recurringIssue}</span>
            <button className="btn" onClick={() => { onClose(); go("recurring", { focus: t.recurringIssue }); }}>View the cluster</button>
          </section>
        )}

        <section>
          <span className="eyebrow">Most similar tickets in this file</span>
          <div style={{ marginTop: 6 }}>
            {t.similar.map((s) => {
              const o = byId.get(s.id);
              return (
                <div key={s.id} className="sim">
                  <span className={`kind ${s.kind}`}>{s.kind}</span>
                  <button className="list-item" style={{ padding: 0, border: 0 }} onClick={() => openTicket(s.id)}>
                    <span className="mono faint">{s.id}</span> <span>{s.title}</span>
                    {o && <span className="row faint" style={{ fontSize: ".76rem" }}><Mod value={o.predictedModule} /><Area value={o.issueArea} />{o.resolutionCode && <span>resolved: {o.resolutionCode}</span>}</span>}
                  </button>
                  <span className="num mono faint">{s.score.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {t.references.length > 0 && (
          <section style={{ display: "grid", gap: 6 }}>
            <span className="eyebrow">Earlier tickets referenced in the text</span>
            <div className="row">
              {t.references.map((r) => r.inFile
                ? <button key={r.id} className="chip" onClick={() => openTicket(r.id)}>{r.id}</button>
                : <span key={r.id} className="chip" title="Not in this file">{r.id} · not in file</span>)}
            </div>
          </section>
        )}
        <p className="faint" style={{ fontSize: ".78rem" }}>Suggestions come from an NLP model trained on synthetic tickets. They are observations to review, not a diagnosis.</p>
      </aside>
    </>
  );
}
