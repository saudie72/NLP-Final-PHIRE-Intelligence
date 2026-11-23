---
name: uat-support
description: "Support user acceptance testing: prepare UAT scripts from acceptance criteria, set up test data, guide business testers and triage UAT defects."
---

# uat-support

**Purpose:** Make sure business users can confirm the change meets their needs before production.

**Used by:** ERP Functional Analyst, ERP QA Developer

**Inputs:** User stories with acceptance criteria and the test environment.

## Steps

1. Write UAT scripts in business language from each acceptance criterion.
2. Prepare fictional test data and confirm the test environment is ready (with peoplesoft-admin).
3. Walk business testers through the scripts and record pass/fail.
4. Triage failures: configuration (fix directly), defect (erp-developer), misunderstood requirement (erp-business-analyst).
5. Record UAT sign-off.

## Output

UAT scripts, results log and sign-off record.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/peoplesoft-modules.md`
- `docs/ticket-taxonomy.md`
