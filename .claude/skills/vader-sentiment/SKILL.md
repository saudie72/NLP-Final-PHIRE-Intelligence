---
name: vader-sentiment
description: "Score ticket sentiment with NLTK's VADER and judge whether it means anything for priority."
---

# vader-sentiment

**Purpose:** Score ticket sentiment with NLTK's VADER and judge whether it means anything for priority.

**Used by:** ERP Manager, NLP Specialist, NLTK Expert

## Steps

1. `SentimentIntensityAnalyzer().polarity_scores(text)` → neg/neu/pos/compound.
2. Label with VADER's thresholds: compound ≤ −0.05 negative, ≥ 0.05 positive.
3. List the lexicon words that drove the score; flag PeopleSoft words VADER misreads (pay, security, save).
4. Compare with PHIRE priority (precision/recall), never replace it.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `pipeline/nltk_core.py`
- `reports/nlp-language-evaluation.md`
