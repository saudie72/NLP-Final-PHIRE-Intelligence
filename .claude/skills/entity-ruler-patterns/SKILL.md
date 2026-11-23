---
name: entity-ruler-patterns
description: "Write spaCy EntityRuler patterns that label PeopleSoft modules, pages, processes, tools, programs, environments and IDs."
---

# entity-ruler-patterns

**Purpose:** Write spaCy EntityRuler patterns that label PeopleSoft modules, pages, processes, tools, programs, environments and IDs.

**Used by:** ERP Functional Analyst, ERP Developer, spaCy Expert

## Steps

1. Take terms from the research docs (never from real tickets).
2. Write token patterns with `LOWER` for case-insensitive phrases and `TEXT: {REGEX: ...}` for codes and IDs.
3. `nlp.add_pipe('entity_ruler', before='ner')` so rules win; give patterns `id: 'ruler'` to tell rule entities from model ones.
4. Measure coverage (share of tickets with a PeopleSoft entity) and add missing terms.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `pipeline/patterns.py`
- `docs/peoplesoft-modules.md`
- `docs/peoplesoft-technical.md`
