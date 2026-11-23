// Column mapping for PHIRE exports (docs/phire-export-format.md).
// App field -> label, whether required, and header synonyms (normalised: lowercase, alphanumerics only).

export const FIELDS = [
  { key: "id", label: "Ticket ID", synonyms: ["issuenum", "issuenumber", "issueno", "ticketid", "ticket", "ticketnumber", "id", "incident", "number"] },
  { key: "title", label: "Title", synonyms: ["title", "shortdescription", "summary", "subject"] },
  { key: "description", label: "Description", synonyms: ["description", "detaileddescription", "details", "longdescription", "notes"] },
  { key: "module", label: "Module", synonyms: ["module", "application", "product", "productarea"] },
  { key: "priority", label: "Priority", synonyms: ["priority", "severity", "urgency"] },
  { key: "issueType", label: "Issue type", synonyms: ["issuetype", "tickettype", "type", "category"] },
  { key: "status", label: "Status", synonyms: ["status", "state"] },
  { key: "assignedTo", label: "Assigned to", synonyms: ["assignedto", "assignee", "owner", "assignedgroup"] },
  { key: "openedBy", label: "Opened by", synonyms: ["openedby", "requester", "requestedby", "reportedby", "createdby"] },
  { key: "openDate", label: "Open date", synonyms: ["opendate", "opened", "createddate", "created", "datecreated", "reporteddate"] },
  { key: "closedDate", label: "Closed date", synonyms: ["closeddate", "closed", "resolveddate", "dateclosed"] },
  { key: "aging", label: "Aging (days)", synonyms: ["aging", "age", "daysopen"] },
  { key: "resolutionCode", label: "Resolution code", synonyms: ["resolutioncode", "resolution", "closurecode"] },
  { key: "cr", label: "Change request", synonyms: ["cr", "changerequest", "crnumber"] },
  { key: "dueDate", label: "Due date", synonyms: ["duedate", "due", "targetdate"] },
  { key: "developer", label: "Developer", synonyms: ["developer", "dev", "technicalowner"] },
];

const norm = (h) => String(h ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Propose a mapping { fieldKey: headerName } from the sheet's headers. */
export function autoMap(headers) {
  const mapping = {};
  const used = new Set();
  for (const f of FIELDS) {
    const hit = headers.find((h) => !used.has(h) && f.synonyms.includes(norm(h)));
    if (hit) { mapping[f.key] = hit; used.add(hit); }
  }
  return mapping;
}

export function mappingProblems(mapping) {
  const problems = [];
  if (!mapping.title && !mapping.description) problems.push("Map at least Title or Description: the analysis reads ticket text.");
  return problems;
}

const DAY = 86400000;
export function toISODate(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date && !isNaN(v)) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())).toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + v * DAY).toISOString().slice(0, 10);
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(Date.UTC(y, Number(m[1]) - 1, Number(m[2]))).toISOString().slice(0, 10);
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Turn sheet rows into ticket objects using the mapping; keep the original row for export. */
export function applyMapping(rows, mapping, today = new Date()) {
  const todayISO = toISODate(today);
  const warnings = [];
  const tickets = [];
  rows.forEach((row, n) => {
    const get = (k) => (mapping[k] ? row[mapping[k]] : undefined);
    const title = String(get("title") ?? "").trim();
    const description = String(get("description") ?? "").trim();
    if (!title && !description) return;
    const openDate = toISODate(get("openDate"));
    const closedDate = toISODate(get("closedDate"));
    const end = closedDate || todayISO;
    const aging = openDate ? Math.round((Date.parse(end) - Date.parse(openDate)) / DAY) : null;
    const fileAging = get("aging");
    const id = String(get("id") ?? "").trim() || `ROW-${n + 2}`;
    if (fileAging !== undefined && fileAging !== "" && aging !== null && Math.abs(Number(fileAging) - aging) > 1 && !closedDate) {
      warnings.push(`${id}: Aging in the file (${fileAging}) differs from the recalculated value (${aging}).`);
    }
    tickets.push({
      id, title, description,
      module: String(get("module") ?? "").trim().toUpperCase() || null,
      priority: String(get("priority") ?? "").trim().toUpperCase().slice(0, 1) || null,
      issueType: String(get("issueType") ?? "").trim() || null,
      status: String(get("status") ?? "").trim() || null,
      assignedTo: String(get("assignedTo") ?? "").trim() || null,
      openedBy: String(get("openedBy") ?? "").trim() || null,
      openDate, closedDate, aging,
      dueDate: toISODate(get("dueDate")),
      resolutionCode: String(get("resolutionCode") ?? "").trim() || null,
      cr: String(get("cr") ?? "").trim() || null,
      developer: String(get("developer") ?? "").trim() || null,
      _row: row,
    });
  });
  return { tickets, warnings };
}
