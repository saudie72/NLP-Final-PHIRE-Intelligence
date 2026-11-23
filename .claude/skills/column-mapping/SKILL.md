---
name: column-mapping
description: "Map spreadsheet headers to the app's ticket fields, including renamed, missing or extra PHIRE flex-field columns. Use when headers don't match exactly."
---

# column-mapping

**Purpose:** Let users load exports whose headers differ from the standard 16 columns without editing the file.

**Used by:** Data Engineer, Front-End Developer

**Inputs:** The header row of the uploaded sheet.

## Steps

1. Normalize headers: lowercase, trim, collapse spaces, drop punctuation.
2. Auto-match against known names and synonyms (for example `issue number`, `ticket id` -> id; `short description` -> title).
3. Require at least Title or Description; everything else is optional.
4. Show the proposed mapping for the user to confirm or change.
5. Remember the confirmed mapping in the browser for next time (try/catch around storage).

## Output

A mapping object `{ appField: header }` plus a list of unmapped headers.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/phire-export-format.md`
