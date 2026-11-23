# 7. NLP methods for support tickets

The application runs a **classical NLP pipeline in the browser**: small, fast, explainable, and nothing leaves
the device. The model is trained offline in Python (scikit-learn), exported to JSON, and re-implemented in
JavaScript, with a parity test proving the browser gives the same answers as scikit-learn.

Sources: [scikit-learn: TF-IDF term weighting](https://scikit-learn.org/stable/modules/feature_extraction.html#tfidf-term-weighting),
[scikit-learn: Logistic regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression),
[scikit-learn: Naive Bayes](https://scikit-learn.org/stable/modules/naive_bayes.html),
[scikit-learn: Classification metrics](https://scikit-learn.org/stable/modules/model_evaluation.html#classification-metrics),
[Manning, Raghavan & Schütze, *Introduction to Information Retrieval*](https://nlp.stanford.edu/IR-book/) (ch. 6 tf-idf and cosine, ch. 13 Naive Bayes, ch. 16–17 clustering),
[Comparison of Information Retrieval Techniques Applied to IT Support Tickets (arXiv 2508.05654)](https://arxiv.org/pdf/2508.05654),
[Textual dissimilarity in duplicate bug report detection (arXiv 2212.09976)](https://arxiv.org/pdf/2212.09976),
[arXiv 2512.17916](https://arxiv.org/html/2512.17916v1).

## 1. Preprocessing

- Input text = Title (repeated twice to give it more weight) + Description.
- Lowercase; drop apostrophes (`can't` → `cant`, keeping negations as one token); split on non-alphanumerics.
- **Keep** PeopleSoft tokens that look like noise to generic NLP: `trc`, `ae`, `sqr`, `ib`, `w2`, `1099`, `ppe`.
- **Mask** volatile values with placeholder tokens so they don't become features: ticket numbers → `<issue>`,
  CR numbers → `<cr>`, dates → `<date>`, long numbers → `<num>`.
- Light stop-word list (English function words only; don't remove "not", "no", "cannot").

## 2. Classification (module and issue area)

| Model | Role | Notes |
|---|---|---|
| Multinomial **Naive Bayes** | Baseline | Fast, strong on short text, gives a floor to beat |
| **Logistic regression** on TF-IDF | Main model | Unigrams + bigrams, sublinear TF, L2-normalized; one model per label (module, area) |

Each prediction shows its probability and the **top contributing words** (weight × TF-IDF), so the ERP
analyst can see why. Low-confidence predictions (top probability below a threshold tuned on the training
folds) are flagged "needs review" instead of being forced.

## 3. Keyword extraction

- **Per ticket:** top TF-IDF terms of that ticket (after masking), shown as chips.
- **Per module or per cluster:** terms with the highest average TF-IDF in the group relative to the whole
  file (a simple contrastive score), used to name clusters ("holiday schedule · ppe · work schedule").

## 4. Similar and duplicate tickets

- **Cosine similarity** between TF-IDF vectors of all tickets in the uploaded file.
- For each ticket, list the top 5 most similar, with the score.
- Pairs above a **duplicate threshold** are marked "possible duplicate"; pairs between a lower and the
  duplicate threshold are "related". Both thresholds are tuned on the synthetic data's recurring groups.
- Explicit references in the text (`reference IN…`) are detected with a regular expression and always shown
  as links.

Known limitation: TF-IDF ignores word order and misses paraphrases with no shared words ("jobs not running"
vs. "processes stuck in Queued"). Embedding methods such as Doc2Vec or Sentence-BERT do better at this in
published comparisons. Version 1 uses TF-IDF for transparency and browser speed; embeddings are listed as a
future improvement.

## 5. Recurring issues (clustering)

- **Agglomerative clustering** (average linkage, cosine distance) over ticket vectors, cut at a similarity
  threshold, so the number of clusters doesn't need to be chosen in advance.
- Clusters with 3 or more tickets are reported as **recurring issues**, with size, date range, module and keywords.
- Optionally combine with the explicit-reference links above.

## 6. Priority suggestion

Rules over cue phrases (see [ticket-taxonomy.md](ticket-taxonomy.md)) plus the predicted area. If labeled
priorities prove consistent enough, a small logistic regression can replace the rules.

## 7. Evaluation

- **Separate training and test sets** written with different phrasing (see
  [synthetic-dataset-plan.md](synthetic-dataset-plan.md)), so the score is not inflated by memorized templates.
- 5-fold cross-validation on the training set for model selection; the test set is used once for the final score.
- Report **accuracy, precision, recall and F1** (per class and macro average) and a **confusion matrix**
  for both module and issue area, for Naive Bayes vs. logistic regression.
- Similarity: **precision@5** and **recall@5** for finding other members of the same recurring group;
  duplicate-threshold precision and recall.
- Clustering: **adjusted Rand index** against the recurring-group labels.
- Results are written to `nlp/results.md` and shown on the app's Resources page.
