---
name: spacy-entity-extraction
description: "Extract named entities with spaCy en_core_web_sm and report the model's errors on PeopleSoft text."
---

# spacy-entity-extraction

**Purpose:** Extract named entities with spaCy en_core_web_sm and report the model's errors on PeopleSoft text.

**Used by:** NLP Specialist, spaCy Expert

## Steps

1. `spacy.load('en_core_web_sm')`; process tickets with `nlp.pipe(texts, batch_size=64)`.
2. Read `doc.ents` (`text`, `label_`, `start_char`, `end_char`, `ent_id_`).
3. Run the model without the ruler too and record what it calls PeopleSoft objects.
4. List errors (pages as PERSON, codes as GPE) in the evaluation report.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `pipeline/build_nlp.py`
- `knowledge/spacy-expert/`
