---
name: phire-export-parsing
description: "Read a PHIRE Excel export into clean ticket records: find the header row, normalize dates and text, recompute Aging. Use when loading any PHIRE .xlsx."
---

# phire-export-parsing

**Purpose:** Turn a PHIRE export into a list of ticket objects the rest of the app can trust.

**Used by:** Data Engineer, Back-End Developer, QA Tester

**Inputs:** An .xlsx file (first sheet by default) and an optional column mapping.

## Steps

1. Read the selected sheet; take the first non-empty row as headers.
2. Apply the column mapping (see the column-mapping skill).
3. Convert Open Date, Closed Date and Due Date from Excel serials, Date objects or mm/dd/yyyy text to ISO dates.
4. Keep Description line breaks for display; build a collapsed-whitespace copy for NLP.
5. Recompute Aging = (Closed Date or today) - Open Date and flag rows where it differs from the file.
6. Skip fully empty rows; report rows missing both Title and Description as errors.
7. Keep unknown columns and pass them through unchanged.

## Output

`{ tickets: [...], warnings: [...], errors: [...] }`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/phire-export-format.md`
