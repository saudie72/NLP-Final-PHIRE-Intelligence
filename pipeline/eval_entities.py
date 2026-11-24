"""Evaluate spaCy entities against hand-labelled gold entities (pipeline/tests/gold_entities*.json).

Compares two pipelines on two hand-labelled gold sets of 30 synthetic tickets each:
  - model only: en_core_web_sm as shipped
  - ruler + model: the project's EntityRuler (pipeline/patterns.py) placed before the statistical NER

Matching is exact surface text plus label, counted as a multiset per ticket (a term that appears twice must be
found twice). Precision is computed over predicted entities whose label is in the gold scheme; predictions with
other labels (PERSON, GPE, CARDINAL, PS_ROLE, ...) are reported separately as out-of-scheme, because the gold
labels do not cover them.

Run:  python3 pipeline/eval_entities.py            (prints a Markdown section)
Used by build_nlp.py to add the section to reports/nlp-language-evaluation.md.
"""
import csv
import json
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
GOLD_SETS = {"v1": HERE / "tests" / "gold_entities.json", "v2": HERE / "tests" / "gold_entities_v2.json"}
DATA = ROOT / "data" / "synthetic" / "phire_test.csv"


def load_gold(path):
    g = json.loads(path.read_text(encoding="utf-8"))
    return g, {tid: Counter((t, l) for t, l in ents) for tid, ents in g["tickets"].items()}


def load_texts(ids):
    with open(DATA, encoding="utf-8") as f:
        rows = {r["Issue Num"]: f"{r['Title']}. {r['Description']}" for r in csv.DictReader(f)}
    return {i: rows[i] for i in ids}


def score(nlp, texts, gold, scheme):
    tp, fp, fn = Counter(), Counter(), Counter()
    out_of_scheme = Counter()
    misses, wrong = Counter(), Counter()
    for tid, text in texts.items():
        pred_all = Counter((e.text, e.label_) for e in nlp(text).ents)
        pred = Counter({k: v for k, v in pred_all.items() if k[1] in scheme})
        for k, v in pred_all.items():
            if k[1] not in scheme:
                out_of_scheme[k[1]] += v
        g = gold[tid]
        hit = pred & g
        for (t, l), v in hit.items():
            tp[l] += v
        for (t, l), v in (pred - g).items():
            fp[l] += v
            wrong[(t, l)] += v
        for (t, l), v in (g - pred).items():
            fn[l] += v
            misses[(t, l)] += v
    return tp, fp, fn, out_of_scheme, misses, wrong


def prf(tp, fp, fn):
    p = tp / (tp + fp) if tp + fp else 0.0
    r = tp / (tp + fn) if tp + fn else 0.0
    f = 2 * p * r / (p + r) if p + r else 0.0
    return p, r, f


def evaluate_set(nlp, model_only, path):
    meta, gold = load_gold(path)
    scheme = set(meta["labels"])
    texts = load_texts(gold)
    res = {}
    for name, pipe in (("model", model_only), ("ruler", nlp)):
        tp, fp, fn, oos, misses, wrong = score(pipe, texts, gold, scheme)
        T, F, N = sum(tp.values()), sum(fp.values()), sum(fn.values())
        res[name] = {
            "overall": [round(x, 3) for x in prf(T, F, N)], "tp": T, "fp": F, "fn": N,
            "perLabel": {l: [round(x, 3) for x in prf(tp[l], fp[l], fn[l])] + [tp[l] + fn[l]] for l in meta["labels"]},
            "outOfScheme": dict(oos.most_common()),
            "misses": [[t, l, c] for (t, l), c in misses.most_common(12)],
            "wrong": [[t, l, c] for (t, l), c in wrong.most_common(12)],
        }
    res["tickets"] = len(gold)
    res["goldEntities"] = sum(sum(c.values()) for c in gold.values())
    res["labels"] = len(meta["labels"])
    res["file"] = str(path.relative_to(ROOT))
    return res


def evaluate(nlp, model_only):
    """Both gold sets. v1 (seed 2026) was used for the round-1 error analysis; v2 (seed 2027, written to
    docs/entity-labelling-guide.md) was unseen until round 2's pattern changes were finished."""
    out = {k: evaluate_set(nlp, model_only, p) for k, p in GOLD_SETS.items()}
    v = out["v2"]   # headline numbers (the app reads these)
    return {**v, "sets": out}


def markdown(e):
    sets = e["sets"]
    v1, v2 = sets["v1"], sets["v2"]
    L = [
        "## spaCy: entity accuracy against hand-labelled tickets", "",
        "Two gold sets of 30 demo tickets each (9 Functional, 9 Technical, 6 Security, 6 Administration), labelled by hand "
        "from the ticket text before looking at spaCy's output on them. **v1** (seed 2026, "
        f"{v1['goldEntities']} entities, `{v1['file']}`) was used to analyse round-1 errors, so it is no longer unseen. "
        f"**v2** (seed 2027, different tickets, {v2['goldEntities']} entities, `{v2['file']}`) follows "
        "[`docs/entity-labelling-guide.md`](../docs/entity-labelling-guide.md) and adds PS_ROLE; it is the honest test for "
        "the current patterns. A prediction counts as correct when its text and label both match. Precision covers "
        "predictions with labels in the gold scheme; other labels are listed separately.", "",
        "| Gold set | Pipeline | Precision | Recall | F1 | Correct | Wrong | Missed |", "|---|---|---|---|---|---|---|---|",
    ]
    for k, g in (("v1", v1), ("v2", v2)):
        for name, key in (("en_core_web_sm alone", "model"), ("EntityRuler + en_core_web_sm", "ruler")):
            r = g[key]
            L.append(f"| {k} | {name} | {r['overall'][0]:.2f} | {r['overall'][1]:.2f} | {r['overall'][2]:.2f} | {r['tp']} | {r['fp']} | {r['fn']} |")
    m, r = v2["model"], v2["ruler"]
    L += [
        "", "Per label on v2:", "",
        "| Label | Gold count | Model alone P / R / F1 | Ruler + model P / R / F1 |", "|---|---|---|---|",
        *[f"| {l} | {r['perLabel'][l][3]} | {m['perLabel'][l][0]:.2f} / {m['perLabel'][l][1]:.2f} / {m['perLabel'][l][2]:.2f} "
          f"| {r['perLabel'][l][0]:.2f} / {r['perLabel'][l][1]:.2f} / {r['perLabel'][l][2]:.2f} |"
          for l in r["perLabel"] if r["perLabel"][l][3]], "",
        "Out-of-scheme predictions on v2 — model alone: " + (", ".join(f"{k} {v}" for k, v in m["outOfScheme"].items()) or "none")
        + "; ruler + model: " + (", ".join(f"{k} {v}" for k, v in r["outOfScheme"].items()) or "none") + ".", "",
        "Ruler + model on v2, most frequent misses: " + ("; ".join(f"\"{t}\" {l} ({c})" for t, l, c in r["misses"]) or "none") + ".", "",
        "Ruler + model on v2, most frequent wrong predictions: " + ("; ".join(f"\"{t}\" {l} ({c})" for t, l, c in r["wrong"]) or "none") + ".", "",
        "**Caveats.** One labeller, 30 tickets per set, synthetic text: treat these as indicative. The gold labels use the "
        "ruler's label scheme, so the model alone cannot score on PeopleSoft labels at all; its fair comparison is on DATE "
        "and ORG.", "",
    ]
    return L


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(HERE))
    import spacy
    from patterns import patterns
    nlp = spacy.load("en_core_web_sm")
    nlp.add_pipe("entity_ruler", before="ner").add_patterns(patterns())
    print("\n".join(markdown(evaluate(nlp, spacy.load("en_core_web_sm")))))
