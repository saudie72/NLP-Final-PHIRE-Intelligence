---
name: ticket-classification
description: "Train and run the module and issue-area classifiers: TF-IDF + logistic regression with a multinomial Naive Bayes baseline, exported to JSON for the browser."
---

# ticket-classification

**Purpose:** Predict module and issue area for every uploaded ticket, with probabilities and explanations.

**Used by:** NLP Specialist, Back-End Developer

**Inputs:** `data/synthetic/phire_train.csv` for training; ticket text at runtime.

## Steps

1. Preprocess per docs/nlp-methods.md (Title twice + Description, masking of IDs and dates).
2. Fit TF-IDF (unigrams + bigrams, sublinear TF) and logistic regression per label; fit Naive Bayes as the baseline.
3. Choose hyperparameters with 5-fold cross-validation on the training set only.
4. Export vocabulary, IDF weights, coefficients and intercepts to JSON.
5. In the browser, compute probabilities and the top contributing words; flag low-confidence predictions as 'needs review'.

## Output

Model JSON files and per-ticket `{ label, probability, topWords, needsReview }`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/nlp-methods.md`
