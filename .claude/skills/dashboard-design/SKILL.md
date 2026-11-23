---
name: dashboard-design
description: "Choose and lay out dashboard charts and tables for ERP support managers."
---

# dashboard-design

**Purpose:** Show volume, mix, aging and recurring problems at a glance.

**Used by:** Product Manager, ERP Manager, Front-End Developer

**Inputs:** Analyzed tickets.

## Steps

1. Summary first: total, open, overdue, recurring issues, possible duplicates.
2. Tickets by module and issue area (heat map); volume by month; open aging buckets.
3. Recurring issues table with keywords; priority disagreements list.
4. Every chart filters the ticket table.
5. Provide a module-portfolio filter (for example PY + TL + AM) so an ERP Manager sees only the modules they oversee.

## Output

Dashboard specification.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/ticket-taxonomy.md`
