---
name: erp-test-scenarios
description: "Write PeopleSoft test scenarios that reproduce and validate a reported issue: setup data, steps, expected result."
---

# erp-test-scenarios

**Purpose:** Turn a ticket into a repeatable ERP test.

**Used by:** ERP Functional Analyst, ERP Developer, ERP QA Developer

**Inputs:** A ticket and its module/issue area.

## Steps

1. State the precondition data (employee, workgroup, voucher, role... all fictional).
2. Write numbered navigation steps using the module's real menu path.
3. State the expected result and what would show the defect.
4. Add a regression check for the neighboring process (for example pay calc after a TL fix).

## Output

A scenario table: ID, precondition, steps, expected result.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/peoplesoft-modules.md`
- `docs/peoplesoft-technical.md`
