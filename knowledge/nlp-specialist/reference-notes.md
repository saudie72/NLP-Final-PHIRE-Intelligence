# NLP Specialist reference notes

## scikit-learn (classifiers)
- `TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=2)`; smooth IDF = ln((1 + n) / (1 + df)) + 1; L2 norm.
- `LogisticRegression` and `MultinomialNB` both score classes linearly, which lets the browser reproduce them.
- `StratifiedGroupKFold` keeps whole groups (sentence templates) in one fold, avoiding template leakage.
- Metrics: accuracy, precision, recall, F1 (macro), confusion matrix; `AgglomerativeClustering` with average linkage
  and `distance_threshold` for recurring issues.
- Sources: https://scikit-learn.org/stable/modules/feature_extraction.html,
  https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.StratifiedGroupKFold.html,
  https://scikit-learn.org/stable/modules/model_evaluation.html, https://scikit-learn.org/stable/modules/clustering.html

## NLTK and spaCy (language features)
- NLTK: VADER sentiment, FreqDist, collocations (https://www.nltk.org/howto/sentiment.html,
  https://www.nltk.org/howto/collocations.html). spaCy: NER, EntityRuler, noun chunks
  (https://spacy.io/usage/linguistic-features, https://spacy.io/api/entityruler).

## Evaluation rules
- Never tune on the test set; disclose any procedure change; report errors, not only scores.
