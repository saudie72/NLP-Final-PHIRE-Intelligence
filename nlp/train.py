"""Train, evaluate and export the PHIRE Ticket Intelligence NLP models.

Run:  pip install -r nlp/requirements.txt && python3 nlp/train.py

Inputs : data/synthetic/phire_train.csv (training, phrasing bank A)
         data/synthetic/phire_test.csv  (held-out test, phrasing bank B; used once for final scores)
Outputs: app/public/model/model.json   vocabulary, IDF, logistic-regression weights, thresholds
         nlp/results.md                evaluation report
         nlp/parity_fixture.json       sample inputs + expected outputs for the JavaScript parity test

Methods (docs/nlp-methods.md):
  - preprocessing: Title twice + Description, lowercase, mask ticket/CR numbers, dates and long numbers
  - TF-IDF (unigrams + bigrams, sublinear TF, smooth IDF, L2 norm) shared by both classifiers
  - multinomial Naive Bayes (baseline) vs logistic regression, per label (Module, Issue Area)
  - model and hyperparameters chosen by 5-fold cross-validation on the training set only, grouped by
    sentence template so each fold is scored on templates it has never seen (plain k-fold scored 1.000)
  - similar tickets: cosine similarity; duplicate/related thresholds tuned on training pairs
  - recurring issues: agglomerative clustering (average linkage, cosine), threshold tuned on training set
  - priority: rule-based cues from docs/ticket-taxonomy.md
"""
import csv
import json
import re
from collections import Counter
from pathlib import Path

import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, adjusted_rand_score, classification_report,
                             confusion_matrix, f1_score)
from sklearn.model_selection import StratifiedGroupKFold, cross_val_score
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "synthetic"
MODEL_OUT = ROOT / "app" / "public" / "model" / "model.json"
RESULTS = ROOT / "nlp" / "results.md"
FIXTURE = ROOT / "nlp" / "parity_fixture.json"
SEED = 7

# ------------------------------------------------------------------ preprocessing (mirrored in app/src/engine/text.js)
MASKS = [
    (re.compile(r"\bIN\d{4,}\b", re.I), " issueref "),
    (re.compile(r"\bCR\d{4,}\b", re.I), " crref "),
    (re.compile(r"\bSYNUSER\d+\b", re.I), " userref "),
    (re.compile(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b"), " dateref "),
    (re.compile(r"\b\d{4,}\b"), " numref "),
]
TOKEN = r"(?u)\b\w\w+\b"  # scikit-learn's default token pattern


def prep(title: str, description: str) -> str:
    text = f"{title} {title} {description}"
    text = text.replace("'", "").replace("’", "")
    for rx, repl in MASKS:
        text = rx.sub(repl, text)
    return text.lower()


# ------------------------------------------------------------------ priority rules (mirrored in app/src/engine/priority.js)
HIGH_CUES = ["next pay period", "pay confirmation", "pay confirm", "separated", "last day", "queued",
             "nothing has run", "timing out", "two minutes", "year-end", "w-2", "several departments",
             "multiple departments", "production down"]
LOW_CUES = ["question on", "how to", "guidance needed", "who has", "audit listing", "list of all user",
            "comments field", "display-only", "search by employee", "supervisor name"]


def suggest_priority(title: str, description: str, area: str) -> str:
    t = f"{title} {description}".lower()
    if any(c in t for c in HIGH_CUES):
        return "H"
    if any(c in t for c in LOW_CUES):
        return "L"
    return "M"


def load(name):
    with open(DATA / name, encoding="utf-8") as f:
        return list(csv.DictReader(f))


def md_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "---|" * len(headers)]
    out += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    return "\n".join(out)


def main():
    train, test = load("phire_train.csv"), load("phire_test.csv")
    Xtr_txt = [prep(r["Title"], r["Description"]) for r in train]
    Xte_txt = [prep(r["Title"], r["Description"]) for r in test]
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
    tmpl = [r["Template"] for r in train]
    vec_args = dict(token_pattern=TOKEN, ngram_range=(1, 2), sublinear_tf=True, min_df=2, lowercase=False)

    report = ["# NLP results", "",
              "All numbers are on **synthetic** data (`data/synthetic/`). Training rows use phrasing bank A; the "
              "250 test rows use a different phrasing bank B and were scored **once**, after all choices were made "
              "with 5-fold cross-validation on the training set.", "",
              f"Training rows: {len(train)} · Test rows: {len(test)}", "",
              "**Cross-validation is grouped by sentence template** (`StratifiedGroupKFold`, 32 training templates): each "
              "fold is scored on templates it never saw. A first run with plain stratified k-fold scored 1.000 for both "
              "issue-area models because folds shared templates, so it could not choose between them. Disclosure: that "
              "first run also produced test scores; the procedure was changed because the CV scores were saturated, and "
              "the model is chosen by the grouped CV score below, not by the test score.", ""]
    exported, summary = {}, []

    for label, key in [("module", "Module"), ("issueArea", "Issue Area")]:
        ytr = [r[key] for r in train]
        yte = [r[key] for r in test]
        # model selection on the training set only
        best = {}
        for name, make, grid in [
            ("Naive Bayes", lambda p: MultinomialNB(alpha=p), [0.001, 0.01, 0.05, 0.1, 0.5, 1.0]),
            ("Logistic regression", lambda p: LogisticRegression(C=p, max_iter=4000), [0.3, 1, 3, 10, 30, 100]),
        ]:
            scores = {p: cross_val_score(make_pipeline(TfidfVectorizer(**vec_args), make(p)), Xtr_txt, ytr,
                                         cv=cv, groups=tmpl, scoring="f1_macro").mean() for p in grid}
            p = max(scores, key=scores.get)
            pipe = make_pipeline(TfidfVectorizer(**vec_args), make(p)).fit(Xtr_txt, ytr)
            pred = pipe.predict(Xte_txt)
            best[name] = dict(param=p, cv=scores[p], pipe=pipe, pred=pred,
                              acc=accuracy_score(yte, pred), f1=f1_score(yte, pred, average="macro"))
        title = "Module" if label == "module" else "Issue area"
        report += [f"## {title} classifier", "",
                   md_table(["Model", "Chosen parameter", "5-fold CV macro F1 (train)", "Test accuracy", "Test macro F1"],
                            [[n, ("alpha=" if n.startswith("Naive") else "C=") + str(b["param"]),
                              f"{b['cv']:.3f}", f"{b['acc']:.3f}", f"{b['f1']:.3f}"] for n, b in best.items()]), ""]
        chosen_name = max(best, key=lambda n: best[n]["cv"])   # chosen by grouped CV, never by test score
        lr = best[chosen_name]
        summary.append((title, best["Naive Bayes"]["acc"], best["Logistic regression"]["acc"], chosen_name, lr["acc"], lr["f1"]))
        report += [f"**Chosen by grouped CV and exported to the app: {chosen_name}.**", "",
                   f"### {chosen_name} on the test set", "", "```",
                   classification_report(yte, lr["pred"], digits=3, zero_division=0), "```", ""]
        classes = list(lr["pipe"].classes_)
        cm = confusion_matrix(yte, lr["pred"], labels=classes)
        report += ["Confusion matrix (rows = true, columns = predicted):", "",
                   md_table([""] + classes, [[f"**{c}**"] + list(row) for c, row in zip(classes, cm)]), ""]
        wrong = [(r, p) for r, p in zip(test, lr["pred"]) if r[key] != p]
        report += [f"Misclassified test tickets ({len(wrong)}), for review by the ERP QA Developer:", ""]
        report += [f"- {r['Issue Num']} \"{r['Title']}\": true **{r[key]}**, predicted **{p}**" for r, p in wrong[:40]]
        if len(wrong) > 40:
            report.append(f"- ... and {len(wrong) - 40} more")
        report.append("")
        exported[label] = lr["pipe"]

    # one shared vocabulary for the browser: refit LR on a single vectorizer so both labels share features
    vec = TfidfVectorizer(**vec_args).fit(Xtr_txt)
    Xtr, Xte = vec.transform(Xtr_txt), vec.transform(Xte_txt)
    final = {}
    for label, key in [("module", "Module"), ("issueArea", "Issue Area")]:
        est = exported[label].steps[1][1]
        clf = (LogisticRegression(C=est.C, max_iter=4000) if isinstance(est, LogisticRegression)
               else MultinomialNB(alpha=est.alpha)).fit(Xtr, [r[key] for r in train])
        final[label] = clf
        assert accuracy_score([r[key] for r in test], clf.predict(Xte)) == accuracy_score(
            [r[key] for r in test], exported[label].predict(Xte_txt)), "shared-vocabulary model differs"

    # ------------------------------------------------------------ similarity and duplicates
    def sim_matrix(X):
        S = (X @ X.T).toarray()
        np.fill_diagonal(S, -1)
        return S

    def groups(rows):
        return [r["Recurring Group"] or None for r in rows]

    Str, gtr = sim_matrix(Xtr), groups(train)
    Ste, gte = sim_matrix(Xte), groups(test)
    # tune duplicate / related thresholds on training pairs (same recurring group = positive)
    iu = np.triu_indices(len(train), 1)
    same = np.array([gtr[i] is not None and gtr[i] == gtr[j] for i, j in zip(*iu)])
    sims = Str[iu]
    best_t, best_f = 0.5, -1
    for t in np.arange(0.30, 0.95, 0.01):
        pred = sims >= t
        tp = (pred & same).sum(); fp = (pred & ~same).sum(); fn = (~pred & same).sum()
        f = 2 * tp / max(1, 2 * tp + fp + fn)
        if f > best_f:
            best_t, best_f = float(t), float(f)
    related_t = round(max(0.2, best_t - 0.2), 2)
    dup_t = round(best_t, 2)

    def p_at_5(S, g):
        hits, n = [], 0
        for i, gi in enumerate(g):
            if gi is None or sum(1 for x in g if x == gi) < 2:
                continue
            top = np.argsort(-S[i])[:5]
            k = min(5, sum(1 for x in g if x == gi) - 1)
            hits.append(sum(1 for j in top[:k] if g[j] == gi) / k)
            n += 1
        return float(np.mean(hits)), n

    p5_te, n_te = p_at_5(Ste, gte)
    iu_te = np.triu_indices(len(test), 1)
    same_te = np.array([gte[i] is not None and gte[i] == gte[j] for i, j in zip(*iu_te)])
    pred_te = Ste[iu_te] >= dup_t
    tp = (pred_te & same_te).sum(); fp = (pred_te & ~same_te).sum(); fn = (~pred_te & same_te).sum()
    dup_prec, dup_rec = tp / max(1, tp + fp), tp / max(1, tp + fn)

    # ------------------------------------------------------------ clustering
    def cluster(X, t):
        D = 1 - (X @ X.T).toarray()
        np.clip(D, 0, 2, out=D)
        return AgglomerativeClustering(n_clusters=None, metric="precomputed", linkage="average",
                                       distance_threshold=1 - t).fit_predict(D)

    def ari(labels, g):
        idx = [i for i, x in enumerate(g) if x is not None]
        return adjusted_rand_score([g[i] for i in idx], [labels[i] for i in idx])

    best_ct, best_ari = 0.5, -1
    for t in np.arange(0.30, 0.90, 0.02):
        a = ari(cluster(Xtr, t), gtr)
        if a > best_ari:
            best_ct, best_ari = round(float(t), 2), a
    ari_te = ari(cluster(Xte, best_ct), gte)

    # ------------------------------------------------------------ priority rules
    pr_pred = [suggest_priority(r["Title"], r["Description"], r["Issue Area"]) for r in test]
    pr_acc = accuracy_score([r["Priority"] for r in test], pr_pred)

    report += ["## Similar tickets, duplicates and recurring issues", "",
               md_table(["Measure", "Value", "How it was measured"], [
                   ["Similar-ticket precision@5 (test)", f"{p5_te:.3f}",
                    f"{n_te} test tickets whose recurring group has another member in the test file; share of the top-k most similar tickets (k = min(5, group size - 1)) from the same group"],
                   ["Duplicate threshold (cosine)", f"{dup_t:.2f}", f"tuned on training pairs (F1 {best_f:.3f}); related threshold {related_t:.2f}"],
                   ["Duplicate precision / recall (test pairs)", f"{dup_prec:.3f} / {dup_rec:.3f}", "pairs at or above the duplicate threshold vs same recurring group"],
                   ["Clustering threshold (cosine similarity)", f"{best_ct:.2f}", f"tuned on training set (ARI {best_ari:.3f})"],
                   ["Recurring-issue clustering ARI (test)", f"{ari_te:.3f}", "adjusted Rand index vs recurring-group labels, tickets with a group"],
               ]), "",
               "## Priority suggestion", "",
               f"Rule-based cues from `docs/ticket-taxonomy.md` agree with the synthetic Priority label on "
               f"**{pr_acc:.1%}** of test tickets. The synthetic labels contain deliberate noise, so 100% is not expected; "
               "the app shows disagreements for a person to review rather than overriding PHIRE.", "",
               "## Summary", "",
               md_table(["Label", "Naive Bayes test accuracy", "Logistic regression test accuracy", "Exported model (by grouped CV)", "Exported test accuracy", "Exported macro F1"],
                        [[a, f"{b:.3f}", f"{c:.3f}", d, f"{e:.3f}", f"{f:.3f}"] for a, b, c, d, e, f in summary]), "",
               "## Limitations", "",
               "- Synthetic, template-generated text is cleaner than real tickets; accuracy on real PHIRE data will be lower.",
               "- TF-IDF ignores word order and misses paraphrases with no shared words; embeddings are a future improvement.",
               "- Module codes, statuses and priority scale beyond those seen in the sample export are assumptions (to confirm).", ""]
    RESULTS.write_text("\n".join(report))

    # ------------------------------------------------------------ export for the browser
    vocab = vec.vocabulary_
    terms = sorted(vocab, key=vocab.get)
    model = {
        "version": "1.0.0",
        "trainedOn": "data/synthetic/phire_train.csv",
        "preprocess": {"titleRepeat": 2, "masks": [[m.pattern, m.flags & re.I and "i" or "", r] for m, r in MASKS],
                       "tokenPattern": "\\b\\w\\w+\\b", "ngram": [1, 2], "sublinearTf": True},
        "vocab": terms,
        "idf": [round(float(x), 6) for x in vec.idf_],
        "classifiers": {
            # both models score classes linearly: softmax(x . W + b). For Naive Bayes W = feature_log_prob_,
            # b = class_log_prior_ (its joint log-likelihood), which gives the same probabilities as predict_proba.
            label: {"type": "logistic_regression" if isinstance(clf, LogisticRegression) else "multinomial_nb",
                    "classes": list(clf.classes_),
                    "coef": [[round(float(w), 5) for w in row] for row in
                             (clf.coef_ if isinstance(clf, LogisticRegression) else clf.feature_log_prob_)],
                    "intercept": [round(float(b), 5) for b in
                                  (clf.intercept_ if isinstance(clf, LogisticRegression) else clf.class_log_prior_)]}
            for label, clf in final.items()},
        "thresholds": {"duplicate": dup_t, "related": related_t, "cluster": best_ct, "lowConfidence": 0.55},
        "priority": {"high": HIGH_CUES, "low": LOW_CUES},
        "metrics": {"moduleModel": summary[0][3], "moduleAccuracy": round(summary[0][4], 3), "moduleF1": round(summary[0][5], 3),
                    "areaModel": summary[1][3], "areaAccuracy": round(summary[1][4], 3), "areaF1": round(summary[1][5], 3),
                    "lrModuleAccuracy": round(summary[0][2], 3), "lrAreaAccuracy": round(summary[1][2], 3),
                    "nbModuleAccuracy": round(summary[0][1], 3), "nbAreaAccuracy": round(summary[1][1], 3),
                    "similarP5": round(p5_te, 3), "clusterARI": round(float(ari_te), 3),
                    "priorityAgreement": round(float(pr_acc), 3), "trainRows": len(train), "testRows": len(test)},
    }
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    MODEL_OUT.write_text(json.dumps(model, separators=(",", ":")))

    # parity fixture: 25 test tickets with expected probabilities, plus test-set clusters and neighbours
    fx = []
    for r in test[:25]:
        x = vec.transform([prep(r["Title"], r["Description"])])
        fx.append({"title": r["Title"], "description": r["Description"],
                   "module": dict(zip(final["module"].classes_, map(float, final["module"].predict_proba(x)[0]))),
                   "issueArea": dict(zip(final["issueArea"].classes_, map(float, final["issueArea"].predict_proba(x)[0])))})
    te_clusters = cluster(Xte, best_ct)
    neighbours = [[int(j) for j in np.argsort(-Ste[i], kind="stable")[:5]] for i in range(25)]
    FIXTURE.write_text(json.dumps({"tickets": fx, "testClusters": [int(c) for c in te_clusters],
                                   "neighbours": neighbours, "clusterThreshold": best_ct}, indent=1))

    print(f"vocab {len(terms)} terms; model {MODEL_OUT.stat().st_size/1024:.0f} KB")
    for t, nb, lra, name, acc, f1 in summary:
        print(f"{t}: NB acc {nb:.3f} | LR acc {lra:.3f} | exported {name}: acc {acc:.3f} macro F1 {f1:.3f}")
    print(f"similar P@5 {p5_te:.3f} | dup thr {dup_t} (P {dup_prec:.2f} R {dup_rec:.2f}) | cluster thr {best_ct} ARI {ari_te:.3f} | priority agree {pr_acc:.3f}")


if __name__ == "__main__":
    main()
