---
name: nltk-text-analysis
description: "Tokenize, remove stopwords, count words (FreqDist) and find key phrases (bigram collocations) with NLTK."
---

# nltk-text-analysis

**Purpose:** Tokenize, remove stopwords, count words (FreqDist) and find key phrases (bigram collocations) with NLTK.

**Used by:** NLP Specialist, NLTK Expert

## Steps

1. Tokenize with `RegexpTokenizer` (works in Pyodide without the punkt download); lowercase.
2. Remove `stopwords.words('english')` plus the ticket-boilerplate list in `nltk_core.DOMAIN_STOPWORDS`.
3. Count with `FreqDist`; find bigrams with `BigramCollocationFinder.from_documents` + `apply_freq_filter(3)` ranked by `likelihood_ratio`.
4. Use the same `pipeline/nltk_core.py` at build time and in the browser.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `pipeline/nltk_core.py`
- `knowledge/nltk-expert/`
