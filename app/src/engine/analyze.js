import { classify } from "./classify.js";
import { cluster, neighbours, references, similarityMatrix } from "./similarity.js";
import { isMaskToken, vectorize } from "./text.js";

const CLOSED = /^(9|10|11)-|closed|cancel|migrated to production/i;

export function suggestPriority(model, title, description) {
  const t = `${title} ${description}`.toLowerCase();
  const hit = (cues) => cues.find((c) => t.includes(c));
  const high = hit(model.priority.high);
  if (high) return { level: "H", reason: high };
  const low = hit(model.priority.low);
  if (low) return { level: "L", reason: low };
  return { level: "M", reason: null };
}

function keywordsFor(model, vec, k = 5) {
  return [...vec]
    .map(([i, w]) => [model.vocab[i], w])
    .filter(([t]) => !isMaskToken(t))
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([t]) => t);
}

function groupKeywords(model, vecs, memberIdx, overall, k = 4) {
  const mean = new Map();
  for (const i of memberIdx) for (const [f, w] of vecs[i]) mean.set(f, (mean.get(f) || 0) + w / memberIdx.length);
  return [...mean]
    .map(([f, w]) => [model.vocab[f], w - (overall.get(f) || 0)])
    .filter(([t]) => !isMaskToken(t))
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([t]) => t);
}

/**
 * Analyse tickets entirely in the browser.
 * tickets: [{ id, title, description, module?, priority?, status?, openDate?, ... }]
 */
export function analyze(model, tickets, { onProgress } = {}) {
  const th = model.thresholds;
  const vecs = tickets.map((t) => vectorize(model, t.title, t.description));
  onProgress?.(0.3);
  const S = similarityMatrix(vecs);
  onProgress?.(0.6);
  const clusters = cluster(S, th.cluster);
  onProgress?.(0.85);

  const overall = new Map();
  for (const v of vecs) for (const [f, w] of v) overall.set(f, (overall.get(f) || 0) + w / vecs.length);

  const idIndex = new Map(tickets.map((t, i) => [String(t.id || "").toUpperCase(), i]));
  const results = tickets.map((t, i) => {
    const mod = classify(model.classifiers.module, vecs[i], model);
    const area = classify(model.classifiers.issueArea, vecs[i], model);
    const pr = suggestPriority(model, t.title, t.description);
    const refs = references(`${t.title} ${t.description}`).filter((r) => r !== String(t.id).toUpperCase());
    return {
      ...t,
      predictedModule: mod.label,
      moduleConfidence: mod.confidence,
      moduleWords: mod.topWords,
      issueArea: area.label,
      areaConfidence: area.confidence,
      areaWords: area.topWords,
      needsReview: mod.confidence < th.lowConfidence || area.confidence < th.lowConfidence,
      moduleMismatch: Boolean(t.module) && t.module !== mod.label,
      suggestedPriority: pr.level,
      priorityReason: pr.reason,
      priorityDisagrees: Boolean(t.priority) && t.priority !== pr.level,
      keywords: keywordsFor(model, vecs[i]),
      similar: neighbours(S, i, 5, th).map((n) => ({ ...n, id: tickets[n.index].id, title: tickets[n.index].title })),
      references: refs.map((r) => ({ id: r, inFile: idIndex.has(r) })),
      cluster: clusters[i],
      open: !CLOSED.test(t.status || ""),
    };
  });

  // recurring issues: clusters with 3+ tickets
  const byCluster = new Map();
  results.forEach((r, i) => {
    if (!byCluster.has(r.cluster)) byCluster.set(r.cluster, []);
    byCluster.get(r.cluster).push(i);
  });
  const recurring = [...byCluster.values()]
    .filter((m) => m.length >= 3)
    .map((m, k) => {
      const rows = m.map((i) => results[i]);
      const count = (key) => Object.entries(rows.reduce((a, r) => ((a[r[key]] = (a[r[key]] || 0) + 1), a), {}))
        .sort((a, b) => b[1] - a[1])[0][0];
      const dates = rows.map((r) => r.openDate).filter(Boolean).sort();
      return {
        id: `R${k + 1}`,
        size: m.length,
        ticketIds: rows.map((r) => r.id),
        keywords: groupKeywords(model, vecs, m, overall),
        module: count("predictedModule"),
        issueArea: count("issueArea"),
        first: dates[0] || null,
        last: dates[dates.length - 1] || null,
        open: rows.filter((r) => r.open).length,
      };
    })
    .sort((a, b) => b.size - a.size)
    .map((g, k) => ({ ...g, id: `R${k + 1}` }));
  const recurringOf = new Map();
  recurring.forEach((g) => g.ticketIds.forEach((id) => recurringOf.set(id, g.id)));
  results.forEach((r) => (r.recurringIssue = recurringOf.get(r.id) || null));
  onProgress?.(1);
  return { tickets: results, recurring };
}
