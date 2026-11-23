---
name: peoplesoft-module-identification
description: "Decide which PeopleSoft module a ticket concerns from page, process and business vocabulary. Use when labeling or reviewing module classification."
---

# peoplesoft-module-identification

**Purpose:** Give each ticket the right module code using PeopleSoft knowledge.

**Used by:** ERP Functional Analyst, ERP Developer, NLP Specialist

**Inputs:** Ticket Title and Description.

## Steps

1. Look for named pages, components and processes first (strongest signal).
2. Then module vocabulary (TRC, paycheck, voucher, ChartField...) from docs/peoplesoft-modules.md.
3. Watch the TL / AM / PY boundary: time entry and schedules -> TL; balances and leave -> AM; checks, deductions, taxes -> PY.
4. Security-only requests go to SEC and scheduler/environment requests to PT only if the site uses those codes (to confirm).
5. Record the cue words that decided the label.

## Output

Module code plus the deciding cue words.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/peoplesoft-modules.md`
- `docs/ticket-taxonomy.md`
