# spaCy reference notes

Notes from the official spaCy documentation. Versions: **spaCy 3.8.18**, **en_core_web_sm 3.8.0**.

## Pipelines and en_core_web_sm
- `nlp = spacy.load("en_core_web_sm")` loads a small English CPU pipeline with components
  `tok2vec, tagger, parser, attribute_ruler, lemmatizer, ner` (check with `nlp.pipe_names`).
- Install the model as a package (pip wheel from the spaCy models release), pinned to the spaCy minor version.
- The NER is trained on OntoNotes 5 labels: PERSON, NORP, FAC, ORG, GPE, LOC, PRODUCT, EVENT, WORK_OF_ART, LAW,
  LANGUAGE, DATE, TIME, PERCENT, MONEY, QUANTITY, ORDINAL, CARDINAL.
- Process many texts with `nlp.pipe(texts, batch_size=...)`; it is much faster than calling `nlp()` in a loop.
- Sources: https://spacy.io/models/en, https://spacy.io/usage/processing-pipelines

## Named entities
- `doc.ents` is a tuple of `Span`s; each has `.text`, `.label_`, `.start_char`, `.end_char` and `.ent_id_`.
- Entity spans never overlap.
- Source: https://spacy.io/usage/linguistic-features (Named Entities)

## EntityRuler
- Rule-based entities: `ruler = nlp.add_pipe("entity_ruler", before="ner")`, then `ruler.add_patterns([...])`.
- Patterns are dicts `{"label": "PS_PAGE", "pattern": "Job Data"}` (phrase) or a list of token dicts
  `[{"LOWER": "job"}, {"LOWER": "data"}]` (token pattern; supports `TEXT`/`LOWER` with `{"REGEX": ...}`, `ORTH`, etc.).
- Adding the ruler **before** `ner` means the statistical NER respects the rule entities. Adding it after
  only fills gaps unless `overwrite_ents` is set.
- An optional `"id"` on a pattern becomes `ent.ent_id_`; this project sets `id: "ruler"` to tell rule
  entities from model entities.
- Sources: https://spacy.io/api/entityruler, https://spacy.io/usage/rule-based-matching (EntityRuler)

## Noun chunks, dependency parse, lemmas
- `doc.noun_chunks` yields base noun phrases (needs the parser). `chunk.root` is the head noun;
  `root.dep_`, `root.head` and `root.children` give the dependency structure.
- Opinion words: adjective modifiers (`amod`) of the noun, or `acomp` / `neg` children of the verb whose
  subject (`nsubj`) is the noun.
- `token.lemma_` is the base form (lemmatizer component); `token.is_stop`, `token.is_alpha`, `token.pos_` help filtering.
- Sources: https://spacy.io/usage/linguistic-features, https://spacy.io/api/doc, https://spacy.io/api/token

## displaCy
- `spacy.displacy.render(doc, style="ent")` draws entity highlights; the app draws the same idea in React
  from character offsets exported at build time (spaCy cannot run in the browser).
- Source: https://spacy.io/usage/visualizers

## In this project
- `pipeline/patterns.py` holds the PeopleSoft patterns; `pipeline/build_nlp.py` runs the pipeline at build time.
- Measured effect: without the ruler, en_core_web_sm leaves most PeopleSoft objects unlabelled or calls them ORG/PERSON.
