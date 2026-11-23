---
name: business-process-mapping
description: "Map a ticket or feature to the end-to-end business process and organizational workflow it affects: departments, hand-offs, approvals and deadlines."
---

# business-process-mapping

**Purpose:** Show where in the business a problem sits and who it touches.

**Used by:** Product Manager, ERP Manager, ERP Business Analyst

**Inputs:** A ticket, recurring issue or feature request.

## Steps

1. Name the end-to-end process (hire-to-pay, time-to-pay, procure-to-pay, record-to-report, benefits enrollment, access provisioning).
2. List the steps and the department or role that owns each step.
3. Mark the step where the issue occurs and the steps downstream that it delays or breaks.
4. Note the business deadlines that apply (pay confirmation, month-end close, open enrollment, year-end).
5. Keep it at business level; hand module and setup detail to erp-functional-analyst.

## Output

A short process map (table of steps, owners, deadlines) with the affected step marked.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/peoplesoft-modules.md`
- `docs/phire-overview.md`
