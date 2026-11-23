import { AREAS, MODULE_NAMES, agingBuckets, areaCounts, heatmap, kpis, monthly } from "../lib/stats.js";
import { Area, Bars, Heatmap, Mod, Monthly, Prio, areaColor } from "./ui.jsx";

export function Dashboard({ tickets, recurring, go, openTicket }) {
  const k = kpis(tickets, recurring);
  const ids = new Set(tickets.map((t) => t.id));
  const rec = recurring.filter((g) => g.ticketIds.some((id) => ids.has(id))).slice(0, 6);
  const disagree = tickets.filter((t) => t.priorityDisagrees && t.open)
    .sort((a, b) => "HML".indexOf(a.suggestedPriority) - "HML".indexOf(b.suggestedPriority)).slice(0, 6);
  const tiles = [
    { label: "Tickets", value: k.total, sub: "in this view", to: {} },
    { label: "Open", value: k.open, sub: `${k.total ? Math.round((k.open / k.total) * 100) : 0}% of tickets`, to: { open: "open" } },
    { label: "Overdue", value: k.overdue, sub: "open, past due date", to: { open: "overdue" }, alert: k.overdue > 0 },
    { label: "Recurring issues", value: k.recurring, sub: "clusters of 3+ tickets", page: "recurring", alert: k.recurring > 0 },
    { label: "Possible duplicates", value: k.duplicates, sub: "cosine ≥ duplicate threshold", to: { flag: "duplicate" } },
    { label: "Needs review", value: k.review, sub: "low confidence or module differs", to: { flag: "review" } },
  ];
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="kpis">
        {tiles.map((t) => (
          <div key={t.label} className={`kpi ${t.alert ? "alert" : ""}`}>
            <button onClick={() => (t.page ? go(t.page) : go("tickets", t.to))} aria-label={`${t.label}: ${t.value}`}>
              <span className="eyebrow">{t.label}</span>
              <b style={{ display: "block", marginTop: 6 }}>{t.value}</b>
              <span className="sub">{t.sub}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="grid g3">
        <section className="panel">
          <div className="panel-head"><h2>Module × issue area</h2><span className="faint" style={{ fontSize: ".8rem" }}>select a cell to see its tickets</span></div>
          <Heatmap data={heatmap(tickets)} areas={AREAS} onPick={(m, a) => go("tickets", { module: m, area: a })} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Issue area</h2><span className="faint" style={{ fontSize: ".8rem" }}>predicted</span></div>
          <Bars data={areaCounts(tickets)} color={(d) => areaColor(d.label)} onPick={(d) => go("tickets", { area: d.label })} />
          <div className="panel-head" style={{ marginTop: 22 }}><h2>Open ticket aging</h2></div>
          <Bars data={agingBuckets(tickets)} color={(d) => (d.label.startsWith("180") || d.label.startsWith("91") ? "var(--bad)" : "var(--ink-3)")} />
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>Ticket volume, last 12 months</h2></div>
        <Monthly data={monthly(tickets)} />
      </section>

      <div className="grid g2">
        <section className="panel">
          <div className="panel-head"><h2>Top recurring issues</h2><button className="btn" onClick={() => go("recurring")}>All recurring issues</button></div>
          {rec.length === 0 && <p className="muted">No clusters of three or more similar tickets in this view.</p>}
          <div className="list">
            {rec.map((g) => (
              <button key={g.id} className="list-item" onClick={() => go("recurring", { focus: g.id })}>
                <div className="row"><span className="mono faint">{g.id}</span><b>{g.keywords.slice(0, 3).join(" · ")}</b></div>
                <div className="row faint" style={{ fontSize: ".8rem" }}>
                  <Mod value={g.module} title={MODULE_NAMES[g.module]} /><Area value={g.issueArea} />
                  <span>{g.size} tickets · {g.open} open</span>
                  {g.first && <span>{g.first} → {g.last}</span>}
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2>Priority disagreements</h2><span className="faint" style={{ fontSize: ".8rem" }}>open tickets · PHIRE vs suggested</span></div>
          {disagree.length === 0 && <p className="muted">Recorded and suggested priorities agree for every open ticket.</p>}
          <div className="list">
            {disagree.map((t) => (
              <button key={t.id} className="list-item" onClick={() => openTicket(t.id)}>
                <div className="row"><span className="mono faint">{t.id}</span><b style={{ fontWeight: 500 }}>{t.title}</b></div>
                <div className="row faint" style={{ fontSize: ".8rem" }}>
                  PHIRE <Prio value={t.priority} /> → suggested <Prio value={t.suggestedPriority} />
                  {t.priorityReason && <span>because “{t.priorityReason}”</span>}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
