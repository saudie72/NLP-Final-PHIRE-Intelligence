---
name: data-handling-review
description: "Check that no real ticket data is committed, sent or stored, and that ticket processing stays in the browser."
---

# data-handling-review

**Purpose:** Enforce the project's confidentiality rules.

**Used by:** Software Architect, Data Engineer, Security Reviewer, Pyodide Engineer, Netlify Engineer

**Inputs:** The repository, the built app and its network behavior.

## Steps

1. Search the repo for spreadsheets outside data/synthetic/ and for real-looking names or ticket numbers.
2. Confirm .gitignore still blocks spreadsheets and .env files.
3. Load the app with the demo file and confirm no request carries ticket content.
4. Confirm the CSP restricts connect-src to 'self'.

## Output

Checklist with pass/fail and findings.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/data-handling.md`
