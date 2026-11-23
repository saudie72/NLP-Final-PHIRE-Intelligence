---
name: similar-ticket-search
description: "Find related and possible duplicate tickets with cosine similarity, plus explicit references to earlier issue numbers in the text."
---

# similar-ticket-search

**Purpose:** Help analysts spot duplicates and reuse earlier resolutions.

**Used by:** NLP Specialist, Back-End Developer

**Inputs:** TF-IDF vectors and ticket text.

## Steps

1. Compute cosine similarity between all ticket pairs in the file.
2. For each ticket keep the top 5 matches with scores.
3. Label pairs above the duplicate threshold 'possible duplicate' and pairs above the related threshold 'related' (thresholds tuned on recurring groups).
4. Detect `IN` + digits references with a regular expression and always show them as links.

## Output

Per ticket: list of `{ id, score, kind }`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/nlp-methods.md`
