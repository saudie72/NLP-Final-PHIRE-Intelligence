// Unit tests (QA Tester): column mapping, date handling, and the full analysis on the synthetic test file.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyze } from "../src/engine/analyze.js";
import { applyMapping, autoMap, mappingProblems, toISODate } from "../src/lib/columns.js";

const PHIRE = ["Module", "Priority", "Issue Type", "Issue Num", "Title", "Description", "Status", "Assigned To", "Opened By",
  "Open Date", "Closed Date", "Aging", "Resolution Code", "CR", "Due Date", "Developer"];

describe("column mapping", () => {
  it("maps all 16 PHIRE headers automatically", () => {
    expect(Object.keys(autoMap(PHIRE))).toHaveLength(16);
  });
  it("tolerates renamed headers and case/spacing", () => {
    const m = autoMap(["ticket id", "SHORT DESCRIPTION", "Detailed Description", "Application", "Created Date"]);
    expect(m).toMatchObject({ id: "ticket id", title: "SHORT DESCRIPTION", description: "Detailed Description", module: "Application", openDate: "Created Date" });
  });
  it("requires Title or Description", () => {
    expect(mappingProblems({ id: "x" })).toHaveLength(1);
    expect(mappingProblems({ description: "d" })).toHaveLength(0);
  });
  it("skips empty rows and gives rows without an ID a stable one", () => {
    const { tickets } = applyMapping([{ T: "", D: "" }, { T: "Hello", D: "" }], { title: "T", description: "D" });
    expect(tickets).toHaveLength(1);
    expect(tickets[0].id).toBe("ROW-3");
  });
  it("recomputes aging and warns when the file disagrees", () => {
    const { tickets, warnings } = applyMapping([{ I: "IN1", T: "x", O: "11/01/2026", A: 99 }],
      { id: "I", title: "T", openDate: "O", aging: "A" }, new Date(Date.UTC(2026, 10, 11)));
    expect(tickets[0].aging).toBe(10);
    expect(warnings).toHaveLength(1);
  });
});

describe("dates", () => {
  it.each([
    ["11/16/2026", "2026-11-16"], ["2026-11-16", "2026-11-16"], [46342, "2026-11-16"], ["", null], ["not a date", null],
  ])("%s -> %s", (input, out) => expect(toISODate(input)).toBe(out));
});

describe("analysis on the synthetic test file", () => {
  const model = JSON.parse(readFileSync(new URL("../public/model/model.json", import.meta.url)));
  const lines = readFileSync(new URL("../../nlp/parity_fixture.json", import.meta.url), "utf8");
  const fx = JSON.parse(lines).tickets.map((t, i) => ({ id: `T${i}`, title: t.title, description: t.description, priority: "M" }));
  const { tickets, recurring } = analyze(model, fx);
  it("returns a prediction, keywords and 5 neighbours for every ticket", () => {
    for (const t of tickets) {
      expect(model.classifiers.module.classes).toContain(t.predictedModule);
      expect(["Functional", "Technical", "Security", "Administration"]).toContain(t.issueArea);
      expect(t.similar).toHaveLength(5);
      expect(t.keywords.every((k) => !/ref\b|^\d+$/.test(k))).toBe(true);
    }
  });
  it("recurring issues only contain 3 or more tickets", () => {
    expect(recurring.every((g) => g.size >= 3)).toBe(true);
  });
  it("suggests H for a separation access-removal ticket", () => {
    const r = analyze(model, [{ id: "X1", title: "Terminate user access", description: "Disable SYNUSER0101; last day was 11/19/2026." },
      { id: "X2", title: "Other", description: "Question on vacation setup" }]);
    expect(r.tickets[0].suggestedPriority).toBe("H");
    expect(r.tickets[0].issueArea).toBe("Security");
    expect(r.tickets[1].suggestedPriority).toBe("L");
  });
});

import { matchesQuery } from "../src/lib/search.js";
describe("ticket search", () => {
  const t = { id: "IN001013", title: "How to process pay period end", description: "Guidance needed", keywords: ["pay period"],
    issueArea: "Functional", module: "TL", predictedModule: "TL", status: "10-Closed", priority: "M", suggestedPriority: "L",
    open: false, similar: [], recurringIssue: null };
  it.each([
    ["functional", true], ["Functional", true], ["time and labor", true], ["tl", true], ["closed", true],
    ["functional pay", true], ["functional security", false], ["in001013", true], ["low", true], ["", true], ["payroll", false],
  ])("%s -> %s", (q, expected) => expect(matchesQuery(t, q)).toBe(expected));
});
