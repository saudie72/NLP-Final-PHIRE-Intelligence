---
name: keyword-extraction
description: "Extract keywords per ticket (top TF-IDF terms) and contrastive keywords per module or cluster."
---

# keyword-extraction

**Purpose:** Show at a glance what each ticket and each group of tickets is about.

**Used by:** NLP Specialist, Back-End Developer

**Inputs:** TF-IDF vectors for the uploaded tickets.

## Steps

1. Per ticket: top 5 TF-IDF terms, excluding masked tokens and stop words.
2. Per group: mean TF-IDF in the group minus mean TF-IDF overall; take the top 5.
3. Prefer bigrams when both words of the bigram are in the top list.

## Output

Keyword lists per ticket and per group.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/nlp-methods.md`
