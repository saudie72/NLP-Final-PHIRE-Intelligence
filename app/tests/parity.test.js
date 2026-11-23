// Parity: the browser engine must give the same answers as scikit-learn (nlp/train.py).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classify } from "../src/engine/classify.js";
import { cluster, similarityMatrix } from "../src/engine/similarity.js";
import { vectorize } from "../src/engine/text.js";

const model = JSON.parse(readFileSync(new URL("../public/model/model.json", import.meta.url)));
const fixture = JSON.parse(readFileSync(new URL("../../nlp/parity_fixture.json", import.meta.url)));
const csv = readFileSync(new URL("../../data/synthetic/phire_test.csv", import.meta.url), "utf8");

function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const [h, ...b] = rows.filter((r) => r.length > 1);
  return b.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const test = parseCsv(csv);

describe("classifier parity with scikit-learn", () => {
  for (const label of ["module", "issueArea"]) {
    it(`${label}: probabilities match within 1e-3 on 25 test tickets`, () => {
      let maxDiff = 0;
      for (const t of fixture.tickets) {
        const p = classify(model.classifiers[label], vectorize(model, t.title, t.description), model).probabilities;
        for (const [c, expected] of Object.entries(t[label])) maxDiff = Math.max(maxDiff, Math.abs(p[c] - expected));
      }
      expect(maxDiff).toBeLessThan(1e-3);
    });
  }
});

describe("similarity and clustering parity", () => {
  const vecs = test.map((r) => vectorize(model, r.Title, r.Description));
  const S = similarityMatrix(vecs);
  it("top-5 neighbours match scikit-learn for 25 tickets", () => {
    let same = 0, total = 0;
    fixture.neighbours.forEach((expected, i) => {
      const got = Array.from(S[i].keys()).filter((j) => j !== i).sort((a, b) => S[i][b] - S[i][a] || a - b).slice(0, 5);
      same += got.filter((j) => expected.includes(j)).length; total += 5;
    });
    expect(same / total).toBeGreaterThanOrEqual(0.98);
  });
  it("clusters are identical to scikit-learn's (same partition of 250 tickets)", () => {
    const js = cluster(S, fixture.clusterThreshold);
    const py = fixture.testClusters;
    const key = (labels) => {
      const groups = new Map();
      labels.forEach((l, i) => groups.set(l, [...(groups.get(l) || []), i]));
      return [...groups.values()].map((g) => g.join(",")).sort().join("|");
    };
    expect(key(js)).toBe(key(py));
  });
});
