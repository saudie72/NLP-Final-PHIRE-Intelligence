---
name: functional-specification
description: "Write PeopleSoft functional specifications: business rules, affected pages and setup tables, configuration changes, data and reporting requirements. Use after business requirements are agreed."
---

# functional-specification

**Purpose:** Turn business requirements into a precise description of what PeopleSoft (or the app) must do.

**Used by:** ERP Functional Analyst, ERP Developer

**Inputs:** Agreed stakeholder requirements and the affected module.

## Steps

1. Restate the requirement and the affected business process step.
2. List the pages, components, setup tables and configuration values involved, with navigation paths.
3. Write the business rules and calculations, including edge cases (retro, effective dating, multiple jobs).
4. State whether the change is configuration only or needs development; if development, hand to erp-developer.
5. Define data, report and interface requirements.
6. Link each spec item to its user story and acceptance criteria.

## Output

A functional specification document.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/peoplesoft-modules.md`
- `docs/ticket-taxonomy.md`
