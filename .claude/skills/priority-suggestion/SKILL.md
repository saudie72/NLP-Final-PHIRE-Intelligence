---
name: priority-suggestion
description: "Suggest H / M / L priority from cue phrases and issue area, and flag disagreements with the recorded PHIRE priority."
---

# priority-suggestion

**Purpose:** Give managers a second opinion on urgency.

**Used by:** ERP Manager, ERP Business Analyst, NLP Specialist

**Inputs:** Ticket text, predicted issue area, recorded Priority.

## Steps

1. High cues: payroll at risk, pay period end, production down, multiple departments, separation access removal, year-end.
2. Low cues: question/how-to, cosmetic change, audit listing with no deadline.
3. Otherwise Medium.
4. Flag tickets where suggested and recorded priority differ by two levels (H vs L).

## Output

`{ suggested, reasons[], disagrees }`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/ticket-taxonomy.md`
