// Excel in and out with SheetJS, entirely in the browser (nothing is uploaded).
import * as XLSX from "xlsx";

export async function readWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
  return {
    sheetNames: wb.SheetNames,
    sheet(name) {
      const ws = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
      const headers = (XLSX.utils.sheet_to_json(ws, { header: 1, range: 0 })[0] || []).map(String);
      return { headers, rows };
    },
  };
}

const pct = (x) => Math.round(x * 100);

/** Original columns in original order + AI columns; recurring issues; run information. */
export function exportReport({ tickets, recurring, headers, fileName, model }) {
  const analyzed = tickets.map((t) => {
    const original = Object.fromEntries(headers.map((h) => [h, t._row?.[h] ?? ""]));
    return {
      ...original,
      "AI Module": t.predictedModule,
      "AI Module Confidence %": pct(t.moduleConfidence),
      "AI Module Differs From PHIRE": t.moduleMismatch ? "Yes" : "",
      "AI Issue Area": t.issueArea,
      "AI Issue Area Confidence %": pct(t.areaConfidence),
      "Needs Review": t.needsReview ? "Yes" : "",
      "AI Keywords": t.keywords.join(", "),
      "AI Suggested Priority": t.suggestedPriority,
      "Priority Disagrees": t.priorityDisagrees ? "Yes" : "",
      "Recurring Issue": t.recurringIssue || "",
      "Similar Tickets": t.similar.slice(0, 3).map((s) => `${s.id} (${s.kind}, ${s.score.toFixed(2)})`).join("; "),
      "Referenced Tickets": t.references.map((r) => r.id).join(", "),
    };
  });
  const rec = recurring.map((g) => ({
    "Recurring Issue": g.id, Tickets: g.size, "Open Tickets": g.open, Module: g.module, "Issue Area": g.issueArea,
    Keywords: g.keywords.join(", "), "First Opened": g.first || "", "Last Opened": g.last || "", "Ticket IDs": g.ticketIds.join(", "),
  }));
  const info = [
    { Item: "Source file", Value: fileName },
    { Item: "Analyzed", Value: new Date().toISOString() },
    { Item: "Tickets", Value: tickets.length },
    { Item: "Model version", Value: model.version },
    { Item: "Module model", Value: model.metrics.moduleModel },
    { Item: "Issue area model", Value: model.metrics.areaModel },
    { Item: "Duplicate / related / cluster thresholds", Value: `${model.thresholds.duplicate} / ${model.thresholds.related} / ${model.thresholds.cluster}` },
    { Item: "Note", Value: "AI columns are suggestions from an NLP model trained on synthetic data. Review before acting." },
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(analyzed);
  ws["!cols"] = Object.keys(analyzed[0] || {}).map((k) => ({ wch: /Description/i.test(k) ? 60 : /Title|Keywords|Similar/i.test(k) ? 36 : 14 }));
  XLSX.utils.book_append_sheet(wb, ws, "Analyzed Tickets");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rec.length ? rec : [{ "Recurring Issue": "none found" }]), "Recurring Issues");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(info), "Run Info");
  const base = (fileName || "phire-export").replace(/\.[^.]+$/, "");
  XLSX.writeFile(wb, `${base}-analyzed.xlsx`);
}
