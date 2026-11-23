// Ticket search: every word typed must appear somewhere in the ticket, including the labels the app shows
// (issue area, module code and name, status, priorities, issue type, recurring issue, people, CR).
import { MODULE_NAMES } from "./stats.js";

const PRIORITY_WORDS = { H: "high", M: "medium", L: "low" };

export function searchText(t) {
  return [
    t.id, t.title, t.description, t.keywords?.join(" "),
    t.issueArea, t.module, MODULE_NAMES[t.module], t.predictedModule, MODULE_NAMES[t.predictedModule],
    t.status, t.issueType, t.resolutionCode, t.cr, t.assignedTo, t.openedBy, t.developer,
    t.priority && `priority ${t.priority} ${PRIORITY_WORDS[t.priority] || ""}`,
    t.suggestedPriority && `suggested ${t.suggestedPriority} ${PRIORITY_WORDS[t.suggestedPriority] || ""}`,
    t.recurringIssue && `recurring ${t.recurringIssue}`,
    t.open ? "open" : "closed",
    t.needsReview || t.moduleMismatch ? "review" : "",
    t.similar?.some((s) => s.kind === "duplicate") ? "duplicate" : "",
  ].filter(Boolean).join(" ").toLowerCase();
}

export function matchesQuery(t, query) {
  const words = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const text = t._search ?? searchText(t);
  return words.every((w) => text.includes(w));
}
