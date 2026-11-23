import { useEffect, useRef } from "react";
import { MODULE_NAMES } from "../lib/stats.js";
import { Area, Mod } from "./ui.jsx";

export function Recurring({ recurring, byId, focus, openTicket }) {
  const refs = useRef({});
  useEffect(() => { if (focus) refs.current[focus]?.scrollIntoView({ block: "center" }); }, [focus]);
  if (recurring.length === 0) return <p className="muted">No clusters of three or more similar tickets in this view.</p>;
  return (
    <div className="grid g2">
      {recurring.map((g) => (
        <section key={g.id} ref={(el) => (refs.current[g.id] = el)} className="panel"
          style={focus === g.id ? { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-soft)" } : undefined}>
          <div className="panel-head">
            <div style={{ display: "grid", gap: 6 }}>
              <span className="eyebrow">{g.id} · {g.size} tickets · {g.open} open</span>
              <h2>{g.keywords.slice(0, 3).join(" · ")}</h2>
            </div>
            <div className="row"><Mod value={g.module} title={MODULE_NAMES[g.module]} /><Area value={g.issueArea} /></div>
          </div>
          <p className="faint" style={{ fontSize: ".8rem", marginBottom: 8 }}>{g.first ? `First opened ${g.first} · latest ${g.last}` : ""}</p>
          <div className="list">
            {g.ticketIds.map((id) => {
              const t = byId.get(id);
              return t ? (
                <button key={id} className="list-item" onClick={() => openTicket(id)} style={{ gridTemplateColumns: "auto 1fr auto", display: "grid", gap: 10 }}>
                  <span className="mono faint">{id}</span><span>{t.title}</span><span className="faint" style={{ fontSize: ".78rem" }}>{t.openDate}</span>
                </button>
              ) : null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
