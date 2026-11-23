---
name: excel-report-export
description: "Write the original ticket rows plus AI-generated columns to a downloadable Excel workbook."
---

# excel-report-export

**Purpose:** Give users the analysis in the format they already use.

**Used by:** Data Engineer, Back-End Developer, QA Tester

**Inputs:** Parsed tickets and analysis results.

## Steps

1. Sheet 1: original columns in original order plus Predicted Module, Module Confidence, Issue Area, Keywords, Suggested Priority, Similar Tickets, Recurring Issue.
2. Sheet 2: recurring issues summary. Sheet 3: run information (model version, date, thresholds).
3. Generate in the browser and trigger a download; nothing is uploaded.

## Output

An .xlsx file.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/phire-export-format.md`
