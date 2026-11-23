---
name: app-testing
description: "Functional, regression and browser tests of upload, column mapping, analysis, dashboard, filters and export."
---

# app-testing

**Purpose:** Make sure the application works for real users.

**Used by:** Front-End Developer, Back-End Developer, QA Tester

**Inputs:** The app and the synthetic demo file.

## Steps

1. Unit-test parsing, mapping, engine and export functions.
2. Browser-test the main flow with Playwright: upload demo file, confirm mapping, see dashboard, open a ticket, export.
3. Edge cases: missing columns, empty rows, text dates, 0 rows, very long descriptions, a non-PHIRE spreadsheet.
4. Re-run the full suite before every deployment.

## Output

Test results and a short report.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/phire-export-format.md`
