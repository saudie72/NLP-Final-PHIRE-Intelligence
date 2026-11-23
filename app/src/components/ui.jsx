import { useEffect, useRef, useState } from "react";

// Small shared UI pieces: icons, pills, and hand-built SVG charts drawn from theme tokens.

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
export const Icon = {
  dash: () => <svg viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  list: () => <svg viewBox="0 0 24 24" {...P}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>,
  repeat: () => <svg viewBox="0 0 24 24" {...P}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>,
  upload: () => <svg viewBox="0 0 24 24" {...P}><path d="M12 15V3M7 8l5-5 5 5" /><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" /></svg>,
  book: () => <svg viewBox="0 0 24 24" {...P}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" /><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" /></svg>,
  lock: () => <svg viewBox="0 0 24 24" {...P}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  download: () => <svg viewBox="0 0 24 24" {...P}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" /></svg>,
  x: () => <svg viewBox="0 0 24 24" {...P}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  spark: () => <svg viewBox="0 0 24 24" {...P}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>,
};

export const Area = ({ value }) => <span className={`area ${value}`}>{value}</span>;
export const Mod = ({ value, title }) => value ? <span className="mod" title={title}>{value}</span> : <span className="faint">—</span>;
export const Prio = ({ value, title }) => value ? <span className={`prio ${value}`} title={title}>{value}</span> : <span className="faint">—</span>;

const AREA_VAR = { Functional: "--functional", Technical: "--technical", Security: "--security", Administration: "--administration" };
export const areaColor = (a) => `var(${AREA_VAR[a] || "--ink-3"})`;

/** Horizontal bars with labels and values. */
export function Bars({ data, color = () => "var(--accent)", onPick }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-row" key={d.label} onClick={() => onPick?.(d)} style={{ cursor: onPick ? "pointer" : "default" }}>
          <span>{d.label}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: color(d) }} /></div>
          <span className="num">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Paired monthly columns: opened vs closed. */
function useWidth(fallback) {
  const ref = useRef(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function Monthly({ data }) {
  const [ref, W] = useWidth(640);
  const H = W < 500 ? 180 : 230, pad = { l: 28, r: 6, t: 14, b: 26 };
  const max = Math.max(1, ...data.flatMap((d) => [d.opened, d.closed]));
  const nice = Math.ceil(max / 5) * 5 || 5;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const slot = iw / data.length, bw = Math.min(16, slot / 3);
  const y = (v) => pad.t + ih - (v / nice) * ih;
  const ticks = [0, nice / 2, nice];
  const month = (k) => new Date(`${k}-01T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Tickets opened and closed per month">
        <g className="grid">{ticks.map((t) => <line key={t} x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />)}</g>
        {ticks.map((t) => <text key={t} x={pad.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>)}
        {data.map((d, i) => {
          const x = pad.l + slot * i + slot / 2;
          return (
            <g key={d.key}>
              <rect x={x - bw - 1} y={y(d.opened)} width={bw} height={ih + pad.t - y(d.opened)} rx="3" fill="var(--accent)"><title>{`${d.key}: ${d.opened} opened`}</title></rect>
              <rect x={x + 1} y={y(d.closed)} width={bw} height={ih + pad.t - y(d.closed)} rx="3" fill="var(--ink-3)" opacity=".55"><title>{`${d.key}: ${d.closed} closed`}</title></rect>
              <text x={x} y={H - 8} textAnchor="middle">{W < 500 ? month(d.key).slice(0, 1) : month(d.key)}</text>
            </g>
          );
        })}
      </svg>
      <div className="legend"><span><i style={{ background: "var(--accent)" }} />Opened</span><span><i style={{ background: "var(--ink-3)", opacity: .55 }} />Closed</span></div>
    </div>
  );
}

const SHORT = { Functional: "Func", Technical: "Tech", Security: "Sec", Administration: "Admin" };

/** Module x issue-area heat map; cell opacity scales with count. */
export function Heatmap({ data, areas, onPick }) {
  return (
    <div className="heat" style={{ gridTemplateColumns: `52px repeat(${areas.length}, minmax(0, 1fr))` }}>
      <span />
      {areas.map((a) => <span key={a} className="collabel" title={a}><span className="long">{a}</span><span className="short">{SHORT[a] || a}</span></span>)}
      {data.mods.map((m, r) => [
        <span key={m} className="rowlabel">{m}</span>,
        ...areas.map((a, c) => {
          const v = data.cells[r][c];
          const alpha = v ? 0.12 + 0.78 * (v / data.max) : 0;
          return (
            <button key={m + a} className="cell" onClick={() => onPick?.(m, a)} title={`${m} · ${a}: ${v}`}
              style={{ background: v ? `color-mix(in srgb, ${areaColor(a)} ${Math.round(alpha * 100)}%, transparent)` : "var(--panel-2)",
                color: alpha > 0.55 ? "#fff" : "var(--ink-2)" }}>
              {v || ""}
            </button>
          );
        }),
      ])}
    </div>
  );
}

export function ConfidenceBar({ label, value, color }) {
  return (
    <div className="conf">
      <span>{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.round(value * 100)}%`, background: color }} /></div>
      <span className="num">{Math.round(value * 100)}%</span>
    </div>
  );
}
