---
name: usability-review
description: "Review a screen or flow of the app against Nielsen's 10 usability heuristics and WCAG 2.2, and report findings with severity and a suggested fix."
---

# usability-review

**Purpose:** Find usability and accessibility problems in a screen or flow before users do, and turn them into small, buildable fixes.

**Used by:** UX Designer

**Inputs:** A flow to review (for example upload, column mapping, dashboard, ticket detail, export) and synthetic data to run it with.

## Steps

1. Name the user and the task (for example "support analyst uploads an export and finds recurring issues").
2. Walk the flow step by step on a synthetic file; note what the user sees, what they must decide and what feedback they get.
3. Check each step against Nielsen's 10 heuristics (visibility of system status, match with the real world, user control and freedom, consistency, error prevention, recognition over recall, flexibility, minimalist design, error recovery, help).
4. Check the WCAG 2.2 basics: keyboard operation and visible focus, text and chart contrast, text alternatives, labels on form fields, no information by color alone, target size, and reflow at phone width.
5. Rate each finding: High (blocks the task), Medium (slows or confuses), Low (polish). Record the step, the heuristic or WCAG criterion, and the evidence.
6. Propose the smallest fix per finding and hand the list to the Front-End Developer; hand test cases to the QA Tester.

## Output

A findings table (step, finding, heuristic or WCAG criterion, severity, suggested fix) and a short list of what already works.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).
- Report what was observed; label guesses about why users struggle as hypotheses to test.
- Do not propose designs that send ticket text off the device.

## References

- `knowledge/ux-designer/reference-notes.md`
- `docs/data-handling.md`
