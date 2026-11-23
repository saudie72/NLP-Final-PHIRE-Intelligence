// Aggregations for the dashboard.

export const AREAS = ["Functional", "Technical", "Security", "Administration"];
export const MODULE_NAMES = {
  HR: "Core HR", PY: "Payroll", TL: "Time and Labor", AM: "Absence Mgmt", BN: "Benefits", RC: "Recruiting",
  EP: "ePerformance", GL: "General Ledger", AP: "Accounts Payable", PO: "Purchasing", EX: "Expenses",
  PC: "Project Costing", SEC: "Security", PT: "PeopleTools",
};
export const PORTFOLIOS = [
  { id: "all", label: "All modules", modules: null },
  { id: "pay", label: "Payroll · Time · Absence", modules: ["PY", "TL", "AM"] },
  { id: "hr", label: "HR · Benefits · Recruiting", modules: ["HR", "BN", "RC", "EP"] },
  { id: "fin", label: "GL · AP · Purchasing", modules: ["GL", "AP", "PO", "EX", "PC"] },
  { id: "tech", label: "Security · PeopleTools", modules: ["SEC", "PT"] },
];

export const moduleOf = (t) => t.module || t.predictedModule;

export function filterPortfolio(tickets, portfolio) {
  if (!portfolio?.modules) return tickets;
  return tickets.filter((t) => portfolio.modules.includes(moduleOf(t)));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function kpis(tickets, recurring) {
  const t0 = today();
  const open = tickets.filter((t) => t.open);
  const ids = new Set(tickets.map((t) => t.id));
  return {
    total: tickets.length,
    open: open.length,
    overdue: open.filter((t) => t.dueDate && t.dueDate < t0).length,
    recurring: recurring.filter((g) => g.ticketIds.some((id) => ids.has(id))).length,
    duplicates: tickets.filter((t) => t.similar.some((s) => s.kind === "duplicate" && ids.has(s.id))).length,
    disagreements: tickets.filter((t) => t.priorityDisagrees).length,
    review: tickets.filter((t) => t.needsReview || t.moduleMismatch).length,
  };
}

export function heatmap(tickets) {
  const mods = [...new Set(tickets.map(moduleOf))].sort((a, b) => count(tickets, b) - count(tickets, a));
  const cells = mods.map((m) => AREAS.map((a) => tickets.filter((t) => moduleOf(t) === m && t.issueArea === a).length));
  return { mods, cells, max: Math.max(1, ...cells.flat()) };
}
const count = (tickets, m) => tickets.filter((t) => moduleOf(t) === m).length;

export function monthly(tickets, months = 12) {
  const end = new Date();
  const keys = [];
  for (let k = months - 1; k >= 0; k--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - k, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys.map((key) => ({
    key,
    opened: tickets.filter((t) => t.openDate?.startsWith(key)).length,
    closed: tickets.filter((t) => t.closedDate?.startsWith(key)).length,
  }));
}

export function agingBuckets(tickets) {
  const b = [["0–7 d", 0, 7], ["8–30 d", 8, 30], ["31–90 d", 31, 90], ["91–180 d", 91, 180], ["180+ d", 181, Infinity]];
  const open = tickets.filter((t) => t.open && t.aging != null);
  return b.map(([label, lo, hi]) => ({ label, value: open.filter((t) => t.aging >= lo && t.aging <= hi).length }));
}

export function areaCounts(tickets) {
  return AREAS.map((a) => ({ label: a, value: tickets.filter((t) => t.issueArea === a).length }));
}
