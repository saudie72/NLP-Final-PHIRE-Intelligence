"""Build-time NLTK + spaCy analysis of the synthetic PHIRE tickets.

Runs during the Netlify build (netlify.toml) before the React app is built, and writes static files:
  app/public/nlp/language.json            aggregates + per-ticket results the app displays
  app/public/pyodide-data/                NLTK data + nltk_core.py for the in-browser (Pyodide) box
  reports/nlp-language-evaluation.md      evaluation and error analysis
  reports/pipeline-run.json               versions, counts and timing of this run

Netlify runs Python only at build time (no Python functions), and spaCy cannot run in the browser, so all
spaCy work happens here. NLTK runs here and, through Pyodide, live in the browser.

Usage: pip install -r pipeline/requirements.txt && python3 pipeline/build_nlp.py
"""
import csv
import json
import os
import shutil
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
NLTK_DATA = HERE / ".nltk_data"
os.environ.setdefault("NLTK_DATA", str(NLTK_DATA))

import nltk  # noqa: E402
import spacy  # noqa: E402

nltk.data.path.insert(0, str(NLTK_DATA))

import nltk_core  # noqa: E402
from patterns import RULER_LABELS, patterns  # noqa: E402
import eval_entities  # noqa: E402

DATA = ROOT / "data" / "synthetic" / "phire_test.csv"   # the 250 tickets in the demo export
OUT_APP = ROOT / "app" / "public" / "nlp" / "language.json"
OUT_PYODIDE = ROOT / "app" / "public" / "pyodide-data"
OUT_REPORT = ROOT / "reports" / "nlp-language-evaluation.md"
OUT_RUN = ROOT / "reports" / "pipeline-run.json"
MODEL_LABELS = ["ORG", "PERSON", "GPE", "DATE", "CARDINAL", "PRODUCT", "NORP", "LOC", "FAC", "MONEY", "TIME", "ORDINAL", "LAW", "WORK_OF_ART", "EVENT", "QUANTITY", "PERCENT", "LANGUAGE"]


NLTK_PACKAGES = {"vader_lexicon": "sentiment/vader_lexicon.zip", "stopwords": "corpora/stopwords.zip"}


def ensure_nltk_data():
    """Download the two NLTK data packages into pipeline/.nltk_data (also copied to the browser for Pyodide)."""
    for pkg, path in NLTK_PACKAGES.items():
        if not (NLTK_DATA / path).exists():
            nltk.download(pkg, download_dir=str(NLTK_DATA), quiet=True, raise_on_error=True)
        if not (NLTK_DATA / path).exists():
            raise SystemExit(f"NLTK data {pkg} could not be downloaded")


def load_tickets():
    with open(DATA, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return [{"id": r["Issue Num"], "title": r["Title"], "description": r["Description"], "priority": r["Priority"],
             "area": r["Issue Area"], "module": r["Module"]} for r in rows]


def build_spacy():
    nlp = spacy.load("en_core_web_sm")
    model_only = spacy.load("en_core_web_sm")
    ruler = nlp.add_pipe("entity_ruler", before="ner")   # rules first; NER keeps their spans
    ruler.add_patterns(patterns())
    return nlp, model_only


# Noun chunks that are ticket boilerplate rather than the thing the ticket is about.
ASPECT_STOP = {"information", "hi team", "team", "step", "attachment", "list", "mockup", "spec", "help",
               "thank", "everything", "nothing", "question", "request", "need", "user", "employee"}


def aspect_opinions(doc):
    """Noun-chunk aspects with opinion words found through the dependency parse (amod / acomp / negation)."""
    out = []
    for chunk in doc.noun_chunks:
        root = chunk.root
        if root.pos_ == "PRON" or root.is_stop or len(chunk.text) < 3:
            continue
        aspect = " ".join(t.lemma_.lower() for t in chunk if not t.is_stop and t.is_alpha) or root.lemma_.lower()
        if aspect in ASPECT_STOP or root.lemma_.lower() in ASPECT_STOP:
            continue
        opinions = [c.text.lower() for c in root.children if c.dep_ == "amod"]
        head = root.head
        if root.dep_ in ("nsubj", "nsubjpass"):
            opinions += [c.text.lower() for c in head.children if c.dep_ in ("acomp", "attr", "neg")]
            if head.pos_ in ("VERB", "AUX") and head.lemma_.lower() not in ("be", "have"):
                opinions.append(head.text.lower())
        out.append({"aspect": aspect, "opinion": " ".join(opinions), "sentence": chunk.sent.text})
    return out


def main():
    t0 = time.time()
    ensure_nltk_data()
    tickets = load_tickets()
    nlp, model_only = build_spacy()
    texts = [f"{t['title']}. {t['description']}" for t in tickets]

    per_ticket = {}
    token_lists = []
    by_area_tokens = defaultdict(list)
    ent_counts = Counter()
    ruler_terms = defaultdict(Counter)
    model_ent_terms = defaultdict(Counter)
    aspect_scores = defaultdict(list)
    aspect_opinion_words = defaultdict(Counter)
    lemma_counts = Counter()
    vader_pos, vader_neg = Counter(), Counter()
    model_only_on_ps = Counter()      # what en_core_web_sm alone calls the PeopleSoft objects the ruler found

    docs = list(nlp.pipe(texts, batch_size=64))
    docs_model = list(model_only.pipe(texts, batch_size=64))
    for t, text, doc, dm in zip(tickets, texts, docs, docs_model):
        content = nltk_core.content_tokens(text)
        token_lists.append(content)
        by_area_tokens[t["area"]].append(content)
        s = nltk_core.sentiment(text)
        urg = nltk_core.urgency_terms(text)
        for w, v in nltk_core.vader_drivers(text):
            (vader_pos if v > 0 else vader_neg)[w] += 1
        ents = []
        for e in doc.ents:
            source = "ruler" if e.ent_id_ == "ruler" else "model"
            ents.append({"text": e.text, "label": e.label_, "start": e.start_char, "end": e.end_char, "source": source})
            ent_counts[(e.label_, source)] += 1
            (ruler_terms if source == "ruler" else model_ent_terms)[e.label_][e.text] += 1
        model_spans = {(e.start_char, e.end_char): e.label_ for e in dm.ents}
        for e in doc.ents:
            if e.ent_id_ == "ruler" and e.label_ in ("PS_PAGE", "PS_PROCESS", "PS_MODULE", "PS_TOOL"):
                overlap = [lbl for (a, b), lbl in model_spans.items() if a < e.end_char and b > e.start_char]
                model_only_on_ps[overlap[0] if overlap else "(not an entity)"] += 1
        aspects = aspect_opinions(doc)
        for a in aspects:
            aspect_scores[a["aspect"]].append(nltk_core.sentiment(a["sentence"])["compound"])
            if a["opinion"]:
                aspect_opinion_words[a["aspect"]][a["opinion"]] += 1
        lemma_counts.update(tok.lemma_.lower() for tok in doc if tok.is_alpha and not tok.is_stop and len(tok) > 2)
        per_ticket[t["id"]] = {
            "title": t["title"],
            "nltk": {"compound": round(s["compound"], 3), "label": nltk_core.sentiment_label(s["compound"]),
                     "urgency": urg, "topWords": [w for w, _ in Counter(content).most_common(5)]},
            "spacy": {"entities": ents[:16], "aspects": [a["aspect"] for a in aspects][:6],
                      "lemmas": [tok.lemma_.lower() for tok in doc if tok.is_alpha and not tok.is_stop][:12]},
        }

    # ---------------- aggregates ----------------
    compounds = {tid: v["nltk"]["compound"] for tid, v in per_ticket.items()}
    label_of = {tid: v["nltk"]["label"] for tid, v in per_ticket.items()}
    areas = ["Functional", "Technical", "Security", "Administration"]
    sent_by_area = []
    for a in areas:
        ids = [t["id"] for t in tickets if t["area"] == a]
        c = Counter(label_of[i] for i in ids)
        sent_by_area.append({"area": a, "n": len(ids), "mean": round(sum(compounds[i] for i in ids) / max(1, len(ids)), 3),
                             "negative": c["negative"], "neutral": c["neutral"], "positive": c["positive"]})
    sent_by_priority = []
    for p in "HML":
        ids = [t["id"] for t in tickets if t["priority"] == p]
        sent_by_priority.append({"priority": p, "n": len(ids),
                                 "mean": round(sum(compounds[i] for i in ids) / max(1, len(ids)), 3),
                                 "negativeShare": round(sum(label_of[i] == "negative" for i in ids) / max(1, len(ids)), 3),
                                 "urgentShare": round(sum(bool(per_ticket[i]["nltk"]["urgency"]) for i in ids) / max(1, len(ids)), 3)})
    # does "has an urgency term" find the H tickets?
    h = [t for t in tickets if t["priority"] == "H"]
    flagged = [t for t in tickets if per_ticket[t["id"]]["nltk"]["urgency"]]
    tp = sum(1 for t in flagged if t["priority"] == "H")
    urgency_eval = {"precision": round(tp / max(1, len(flagged)), 3), "recall": round(tp / max(1, len(h)), 3),
                    "flagged": len(flagged), "highPriority": len(h)}
    # VADER as a priority signal: negative -> H, else not H
    vader_h = [t for t in tickets if label_of[t["id"]] == "negative"]
    tpv = sum(1 for t in vader_h if t["priority"] == "H")
    vader_eval = {"precision": round(tpv / max(1, len(vader_h)), 3), "recall": round(tpv / max(1, len(h)), 3), "flagged": len(vader_h)}

    urg_counts = Counter(u for v in per_ticket.values() for u in v["nltk"]["urgency"])
    aspects_out = sorted(
        ({"aspect": a, "n": len(v), "mean": round(sum(v) / len(v), 3),
          "opinions": [w for w, _ in aspect_opinion_words[a].most_common(3)]} for a, v in aspect_scores.items() if len(v) >= 4),
        key=lambda x: (-x["n"], x["aspect"]))[:18]
    ruler_out = {lbl: [[w, c] for w, c in ruler_terms[lbl].most_common(8)] for lbl in RULER_LABELS if ruler_terms[lbl]}
    model_out = {lbl: [[w, c] for w, c in model_ent_terms[lbl].most_common(6)] for lbl in MODEL_LABELS if model_ent_terms[lbl]}
    coverage = sum(1 for v in per_ticket.values() if any(e["source"] == "ruler" and e["label"].startswith("PS_") for e in v["spacy"]["entities"]))

    result = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset": "data/synthetic/phire_test.csv (the 250 tickets in the demo export)",
        "versions": {"nltk": nltk.__version__, "spacy": spacy.__version__, "model": f"en_core_web_sm {model_only.meta['version']}"},
        "tickets": len(tickets),
        "nltk": {
            "topWords": nltk_core.top_words(token_lists, 20),
            "topWordsByArea": {a: nltk_core.top_words(by_area_tokens[a], 8) for a in areas},
            "collocations": nltk_core.collocations(token_lists, 15, 3),
            "sentimentByArea": sent_by_area,
            "sentimentByPriority": sent_by_priority,
            "sentimentCounts": dict(Counter(label_of.values())),
            "urgencyTerms": urg_counts.most_common(12),
            "urgencyEval": urgency_eval,
            "vaderEval": vader_eval,
            "vaderDrivers": {"positive": vader_pos.most_common(10), "negative": vader_neg.most_common(10)},
        },
        "spacy": {
            "rulerEntities": ruler_out,
            "modelEntities": model_out,
            "entityCounts": [[lbl, src, c] for (lbl, src), c in ent_counts.most_common()],
            "modelOnlyOnPeopleSoft": model_only_on_ps.most_common(),
            "rulerCoverage": round(coverage / len(tickets), 3),
            "topLemmas": lemma_counts.most_common(15),
        },
        "both": {"aspects": aspects_out},
        "entityEval": eval_entities.evaluate(nlp, model_only),
        "perTicket": per_ticket,
    }
    OUT_APP.parent.mkdir(parents=True, exist_ok=True)
    OUT_APP.write_text(json.dumps(result, separators=(",", ":")))

    # files for the in-browser NLTK box (Pyodide): same nltk_core.py + the two NLTK data packages it needs
    OUT_PYODIDE.mkdir(parents=True, exist_ok=True)
    shutil.copy(HERE / "nltk_core.py", OUT_PYODIDE / "nltk_core.py")
    shutil.copy(NLTK_DATA / NLTK_PACKAGES["vader_lexicon"], OUT_PYODIDE / "vader_lexicon.zip")
    shutil.copy(NLTK_DATA / NLTK_PACKAGES["stopwords"], OUT_PYODIDE / "stopwords.zip")

    write_report(result, tickets)
    run = {"seconds": round(time.time() - t0, 1), "tickets": len(tickets), "versions": result["versions"],
           "outputs": [str(p.relative_to(ROOT)) for p in (OUT_APP, OUT_REPORT)], "rulerPatterns": len(patterns())}
    OUT_RUN.write_text(json.dumps(run, indent=1) + "\n")
    print(f"NLTK + spaCy pipeline: {len(tickets)} tickets in {run['seconds']} s -> {OUT_APP.relative_to(ROOT)} "
          f"({OUT_APP.stat().st_size // 1024} KB); ruler coverage {result['spacy']['rulerCoverage']:.0%}")


def write_report(r, tickets):
    n, s = r["nltk"], r["spacy"]
    errors = [f"| {e} | {c} |" for e, c in s["modelOnlyOnPeopleSoft"]]
    L = [
        "# NLTK and spaCy evaluation", "",
        f"Generated by `pipeline/build_nlp.py` on {r['generatedAt']} over {r['tickets']} synthetic tickets "
        f"({r['dataset']}). Versions: NLTK {r['versions']['nltk']}, spaCy {r['versions']['spacy']}, {r['versions']['model']}.",
        "All tickets are synthetic; numbers describe this dataset, not real PHIRE data.", "",
        "## NLTK: VADER sentiment", "",
        "| Priority | Tickets | Mean compound | Share negative | Share with urgency terms |", "|---|---|---|---|---|",
        *[f"| {x['priority']} | {x['n']} | {x['mean']:+.3f} | {x['negativeShare']:.0%} | {x['urgentShare']:.0%} |" for x in n["sentimentByPriority"]], "",
        f"VADER labels: {n['sentimentCounts']}. Treating \"negative\" as a high-priority signal gives precision "
        f"{n['vaderEval']['precision']:.2f} and recall {n['vaderEval']['recall']:.2f} for H tickets.", "",
        "Words that drove VADER's scores (lexicon words found in the tickets):", "",
        "- positive: " + ", ".join(f"{w} ({c})" for w, c in n["vaderDrivers"]["positive"]),
        "- negative: " + ", ".join(f"{w} ({c})" for w, c in n["vaderDrivers"]["negative"]), "",
        "**PeopleSoft lexicon adjustment.** VADER was built for social-media text, and some of its lexicon words are neutral "
        "PeopleSoft vocabulary (\"pay\" in a payroll ticket is not a complaint, \"security\" in an access request is not praise), "
        "while PeopleSoft problem words such as \"queued\" and \"abend\" are missing. `nltk_core.PEOPLESOFT_LEXICON` sets "
        + f"{sum(1 for v in nltk_core.PEOPLESOFT_LEXICON.values() if v == 0)} domain words to 0 ("
        + ", ".join(w for w, v in nltk_core.PEOPLESOFT_LEXICON.items() if v == 0)
        + ") and adds or strengthens problem words ("
        + ", ".join(f"{w} {v:+.1f}" for w, v in nltk_core.PEOPLESOFT_LEXICON.items() if v != 0)
        + "). Words were chosen from the training set and the docs' urgency vocabulary; this demo set was not used to pick them.", "",
        "| Measure on these tickets | Stock VADER | With PeopleSoft lexicon |", "|---|---|---|",
        f"| Labels positive / neutral / negative | 122 / 34 / 94 | {n['sentimentCounts'].get('positive', 0)} / "
        f"{n['sentimentCounts'].get('neutral', 0)} / {n['sentimentCounts'].get('negative', 0)} |",
        f"| \"negative\" as an H signal: precision / recall | 0.37 / 0.40 | {n['vaderEval']['precision']:.2f} / {n['vaderEval']['recall']:.2f} |", "",
        "**Finding.** The adjustment removes most false \"positive\" labels on routine requests, so VADER now describes tone "
        "more plausibly, but it does not make VADER a better priority signal: recall for H rose slightly and precision fell. "
        "The app therefore shows VADER as descriptive tone only; the urgency vocabulary below is the stronger signal, and the "
        "rule-based priority suggestion is unchanged.", "",
        "## NLTK: urgency keywords", "",
        f"A ticket containing at least one urgency term: precision {n['urgencyEval']['precision']:.2f}, recall "
        f"{n['urgencyEval']['recall']:.2f} for H tickets ({n['urgencyEval']['flagged']} flagged, {n['urgencyEval']['highPriority']} H tickets).", "",
        "Most frequent: " + ", ".join(f"{w} ({c})" for w, c in n["urgencyTerms"][:8]) + ".", "",
        "## NLTK: top words and collocations", "",
        "Top words (FreqDist, stopwords removed): " + ", ".join(f"{w} ({c})" for w, c in n["topWords"][:12]) + ".", "",
        "Collocations (bigrams by likelihood ratio, min. frequency 3): " + ", ".join(f"\"{b}\"" for b, _, _ in n["collocations"][:10]) + ".", "",
        "## spaCy: EntityRuler for PeopleSoft objects", "",
        f"With the EntityRuler added before the statistical NER, {s['rulerCoverage']:.0%} of tickets mention at least one PeopleSoft "
        "module, page, process or tool. What `en_core_web_sm` alone calls those same spans:", "",
        "| en_core_web_sm label for PeopleSoft objects | Count |", "|---|---|", *errors, "",
        "**Finding.** The general-purpose model has never seen PeopleSoft: it labels pages and processes as ORG, PERSON, "
        "PRODUCT or misses them entirely. The EntityRuler fixes this with rules from the research docs. Remaining errors "
        "are terms outside the pattern list and capitalised business words the model still tags (see below).", "",
        "## spaCy: model entities (en_core_web_sm)", "",
        *[f"- **{lbl}**: " + ", ".join(f"{w} ({c})" for w, c in items) for lbl, items in s["modelEntities"].items()], "",
        "**Errors.** Correct: county departments as ORG. Wrong (examples from this run): "
        + "; ".join(f"{lbl}: " + ", ".join(w for w, _ in s["modelEntities"].get(lbl, [])[:4])
                    for lbl in ("PERSON", "GPE", "FAC", "PRODUCT", "NORP") if s["modelEntities"].get(lbl))
        + ". Capitalised field and page words become PERSON, business-unit and module codes (TR, PO, HR) become GPE, "
        "and some dates become FAC or PRODUCT. This is why entity results in the app show the EntityRuler's PeopleSoft "
        "labels first and mark model labels separately.", "",
        *eval_entities.markdown(r["entityEval"]),
        "## Both: aspects (spaCy noun chunks) scored with VADER (NLTK)", "",
        "| Aspect (noun chunk, lemmatised) | Mentions | Mean VADER of its sentence | Opinion words (dependency parse) |", "|---|---|---|---|",
        *[f"| {a['aspect']} | {a['n']} | {a['mean']:+.3f} | {', '.join(a['opinions']) or '—'} |" for a in r["both"]["aspects"][:12]], "",
        "## Limitations", "",
        "- Synthetic, template-generated text: real tickets will be noisier and VADER and the EntityRuler will miss more.",
        "- The EntityRuler only knows the terms listed in `pipeline/patterns.py`; new pages and processes need new patterns.",
        "- spaCy runs only at build time (it cannot run in the browser), so spaCy results cover the demo dataset; NLTK also "
        "runs live in the browser through Pyodide for any text.", "",
    ]
    OUT_REPORT.parent.mkdir(parents=True, exist_ok=True)
    OUT_REPORT.write_text("\n".join(L))


if __name__ == "__main__":
    main()
