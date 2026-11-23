---
name: synthetic-ticket-generation
description: "Generate realistic labeled synthetic PHIRE tickets with separate train and test phrasing banks and recurring groups."
---

# synthetic-ticket-generation

**Purpose:** Provide safe, realistic data for training, testing and the public demo.

**Used by:** ERP Functional Analyst, ERP QA Developer, NLP Specialist, Data Engineer

**Inputs:** Module vocabulary, taxonomy, export format.

## Steps

1. Pick module by weight, then issue area by module-specific mix.
2. Fill a template from phrasing bank A (train) or B (test) with real PeopleSoft vocabulary and fictional details.
3. Add openers, closers and references to earlier issue numbers.
4. Fill structured columns consistently (status vs. closed date, due date by priority, CR for technical/enhancement).
5. Create recurring groups with fixed key details across both sets.
6. Use a fixed seed; write train, test and demo files to data/synthetic/.

## Output

`phire_train`, `phire_test` (.xlsx/.csv) and `phire_demo_export.xlsx`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/synthetic-dataset-plan.md`
- `docs/data-handling.md`
