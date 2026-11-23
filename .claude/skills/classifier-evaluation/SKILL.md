---
name: classifier-evaluation
description: "Evaluate classifiers on the held-out test set: accuracy, precision, recall, F1 (per class and macro), confusion matrix, and error analysis."
---

# classifier-evaluation

**Purpose:** Prove the NLP works and show where it fails.

**Used by:** ERP QA Developer, NLP Specialist, QA Tester, NLTK Expert

**Inputs:** Trained models and `data/synthetic/phire_test.csv`.

## Steps

1. Run cross-validation on the training set for model selection only.
2. Score once on the test set for both Naive Bayes and logistic regression, for module and issue area.
3. Write the classification report and confusion matrix.
4. List misclassified test tickets; erp-qa-developer reviews each and notes whether the label or the model is wrong.
5. Evaluate similarity (precision@5 within recurring groups) and clustering (adjusted Rand index).

## Output

`nlp/results.md`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/nlp-methods.md`
- `docs/synthetic-dataset-plan.md`
