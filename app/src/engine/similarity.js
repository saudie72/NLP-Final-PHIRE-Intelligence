import { dot } from "./text.js";

/** Pairwise cosine similarity (vectors are L2-normalised, so cosine = dot product). */
export function similarityMatrix(vectors) {
  const n = vectors.length;
  const S = Array.from({ length: n }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = dot(vectors[i], vectors[j]);
      S[i][j] = s;
      S[j][i] = s;
    }
    S[i][i] = -1;
  }
  return S;
}

/** Top-k most similar tickets for row i, labelled duplicate / related / similar by threshold. */
export function neighbours(S, i, k, thresholds) {
  const idx = Array.from(S[i].keys()).filter((j) => j !== i);
  idx.sort((a, b) => S[i][b] - S[i][a] || a - b);
  return idx.slice(0, k).map((j) => ({
    index: j,
    score: S[i][j],
    kind: S[i][j] >= thresholds.duplicate ? "duplicate" : S[i][j] >= thresholds.related ? "related" : "similar",
  }));
}

const REF = /\bIN\d{4,}\b/gi;
/** Explicit references to other issue numbers written in the text. */
export function references(text) {
  return [...new Set((text.match(REF) || []).map((s) => s.toUpperCase()))];
}

/**
 * Agglomerative clustering, average linkage on cosine similarity, merging while the best average
 * similarity is above `threshold` (scikit-learn: distance_threshold = 1 - threshold).
 * Returns an array of cluster ids (0..k-1) in first-seen order.
 */
export function cluster(S, threshold) {
  const n = S.length;
  const sim = S.map((row) => Float64Array.from(row));
  const size = new Array(n).fill(1);
  const alive = new Array(n).fill(true);
  const members = Array.from({ length: n }, (_, i) => [i]);
  const bestOf = (i) => {
    let b = -1, bs = -Infinity;
    for (let j = 0; j < n; j++) if (j !== i && alive[j] && sim[i][j] > bs) { bs = sim[i][j]; b = j; }
    return [b, bs];
  };
  const best = Array.from({ length: n }, (_, i) => bestOf(i));

  for (;;) {
    let a = -1, bs = -Infinity;
    for (let i = 0; i < n; i++) if (alive[i] && best[i][0] >= 0 && best[i][1] > bs) { bs = best[i][1]; a = i; }
    if (a < 0 || !(bs > threshold)) break;
    const b = best[a][0];
    // merge b into a with the average-linkage (Lance-Williams) update
    for (let k = 0; k < n; k++) {
      if (!alive[k] || k === a || k === b) continue;
      const v = (size[a] * sim[a][k] + size[b] * sim[b][k]) / (size[a] + size[b]);
      sim[a][k] = v;
      sim[k][a] = v;
    }
    size[a] += size[b];
    members[a].push(...members[b]);
    alive[b] = false;
    for (let k = 0; k < n; k++) {
      if (!alive[k]) continue;
      if (k === a || best[k][0] === a || best[k][0] === b) best[k] = bestOf(k);
      else if (sim[k][a] > best[k][1]) best[k] = [a, sim[k][a]];
    }
  }

  const labels = new Array(n);
  let next = 0;
  const seen = new Map();
  for (let i = 0; i < n; i++) {
    const root = members.findIndex((m, r) => alive[r] && m.includes(i));
    if (!seen.has(root)) seen.set(root, next++);
    labels[i] = seen.get(root);
  }
  return labels;
}
