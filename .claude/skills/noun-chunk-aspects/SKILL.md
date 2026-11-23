---
name: noun-chunk-aspects
description: "Find ticket aspects with spaCy noun chunks and the dependency parse, scored with NLTK VADER."
---

# noun-chunk-aspects

**Purpose:** Find ticket aspects with spaCy noun chunks and the dependency parse, scored with NLTK VADER.

**Used by:** spaCy Expert

## Steps

1. Iterate `doc.noun_chunks`; skip pronouns, stop words and boilerplate chunks.
2. Lemmatise the chunk; collect opinion words from `amod` children and `acomp`/`neg` of the head verb.
3. Score the chunk's sentence with VADER; aggregate per aspect (mentions, mean compound).

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `pipeline/build_nlp.py`
