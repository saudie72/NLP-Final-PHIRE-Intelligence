---
name: recurring-issue-clustering
description: "Group tickets into recurring issues with agglomerative clustering and describe each cluster (size, dates, module, keywords)."
---

# recurring-issue-clustering

**Purpose:** Surface problems that keep coming back so they can be fixed for good.

**Used by:** ERP Manager, ERP Business Analyst, NLP Specialist

**Inputs:** TF-IDF vectors and ticket dates/modules.

## Steps

1. Agglomerative clustering, average linkage, cosine distance, cut at a tuned similarity threshold.
2. Keep clusters with 3 or more tickets as recurring issues.
3. Name each cluster with its contrastive keywords; report size, first/last open date, main module and issue area.

## Output

List of recurring issues with member ticket IDs.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/nlp-methods.md`
