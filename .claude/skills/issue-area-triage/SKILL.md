---
name: issue-area-triage
description: "Classify a ticket's issue area as Functional, Technical, Security or Administration using the project taxonomy and tie-break rules."
---

# issue-area-triage

**Purpose:** Separate the kind of work a ticket needs from the module it is about.

**Used by:** ERP Functional Analyst, ERP Developer, PeopleSoft Administrator, ERP QA Developer, NLP Specialist

**Inputs:** Ticket Title, Description and Issue Type.

## Steps

1. Check for security cues (role, access, not authorized, lock, separated) -> Security.
2. Batch process never starts or finishes (Queued, server down, not posted), refresh, migrate, patch, slow -> Administration.
3. Program error message, new report/query/interface, PeopleCode/AE/SQR/SQL -> Technical.
4. Setup, values, how-to, wrong amounts with no error, mass updates -> Functional.
5. Apply the tie-break rules in docs/ticket-taxonomy.md when cues conflict.

## Output

Issue area plus the rule that decided it.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/ticket-taxonomy.md`
