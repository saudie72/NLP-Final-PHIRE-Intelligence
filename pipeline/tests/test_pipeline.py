"""Tests for the build-time NLTK + spaCy pipeline (run: python3 -m pytest pipeline/tests -q)."""
import json
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import build_nlp  # noqa: E402  (sets NLTK_DATA)
import nltk_core  # noqa: E402
from patterns import patterns  # noqa: E402

build_nlp.ensure_nltk_data()


# ---------------- NLTK ----------------
def test_tokenizer_keeps_peoplesoft_codes_together():
    assert "tl_timeadmin" in nltk_core.tokens("The TL_TIMEADMIN Application Engine failed")
    assert "w-2" in nltk_core.tokens("Reprint W-2 for 2026")


def test_stopwords_and_boilerplate_removed():
    toks = nltk_core.content_tokens("Hi team, please see the attachment for the voucher error")
    assert toks == ["voucher", "error"]


@pytest.mark.parametrize("text,label", [
    ("Payroll register is wrong and the error is terrible", "negative"),
    ("Great, the new report works perfectly, thank you", "positive"),
    ("Move project to TST", "neutral"),
])
def test_vader_labels(text, label):
    assert nltk_core.sentiment_label(nltk_core.sentiment(text)["compound"]) == label


def test_urgency_terms_single_words_and_phrases():
    found = nltk_core.urgency_terms("Time Administration is stuck in Queued and pay confirmation is Thursday")
    assert {"stuck", "queued", "pay confirmation"} <= set(found)
    assert nltk_core.urgency_terms("Add a comments field to Job Data") == []


def test_collocations_across_documents_only():
    docs = [["pay", "period", "end"]] * 4 + [["voucher", "build"]] * 3
    pairs = [b for b, _, _ in nltk_core.collocations(docs, 10, 3)]
    assert "pay period" in pairs and "voucher build" in pairs
    assert "end voucher" not in pairs  # no bigram across ticket boundaries


def test_analyze_text_shape():
    r = nltk_core.analyze_text("Voucher Build fails with an error before the pay cycle. Please help.")
    assert r["sentimentLabel"] in ("negative", "neutral", "positive")
    assert {"tokenCount", "contentCount", "stopwordsRemoved", "sentiment", "urgency", "topWords", "bigrams"} <= set(r)
    assert "fails" in r["urgency"] and r["stopwordsRemoved"] > 0


# ---------------- spaCy ----------------
@pytest.fixture(scope="module")
def nlp():
    return build_nlp.build_spacy()[0]


def ents(nlp, text):
    return {(e.text, e.label_) for e in nlp(text).ents}


def test_entity_ruler_finds_peoplesoft_objects(nlp):
    e = ents(nlp, "Time Administration stopped in Process Monitor; the TL_TIMEADMIN Application Engine abended in TST.")
    assert ("Time Administration", "PS_PROCESS") in e
    assert ("Process Monitor", "PS_PAGE") in e
    assert ("TL_TIMEADMIN", "PS_PROGRAM") in e
    assert ("Application Engine", "PS_TOOL") in e
    assert ("TST", "PS_ENV") in e


def test_entity_ruler_ids_and_business_units(nlp):
    e = ents(nlp, "Business Unit = PW. See IN001234 and CR004321; disable SYNUSER0410 in BU FN.")
    assert ("IN001234", "TICKET_REF") in e and ("CR004321", "TICKET_REF") in e
    assert ("SYNUSER0410", "USER_ID") in e
    assert any(lbl == "BUSINESS_UNIT" for _, lbl in e)


def test_model_entities_still_work_with_ruler(nlp):
    e = ents(nlp, "Finance in the Sheriff's Office reported it on 11/03/2026.")
    assert any(lbl == "DATE" for _, lbl in e)


def test_noun_chunk_aspects(nlp):
    aspects = [a["aspect"] for a in build_nlp.aspect_opinions(nlp("The outbound file is incomplete and the payroll register looks wrong."))]
    assert "outbound file" in aspects and "payroll register" in aspects


def test_patterns_are_well_formed():
    for p in patterns():
        assert p["label"] and p["pattern"] and p["id"] == "ruler"


# ---------------- outputs ----------------
def test_pipeline_outputs():
    build_nlp.main()
    out = json.loads(build_nlp.OUT_APP.read_text())
    assert out["tickets"] == 250 and len(out["perTicket"]) == 250
    assert out["nltk"]["topWords"] and out["nltk"]["collocations"] and out["spacy"]["rulerEntities"]
    assert 0.5 < out["spacy"]["rulerCoverage"] <= 1
    for f in ("nltk_core.py", "vader_lexicon.zip", "stopwords.zip"):
        assert (build_nlp.OUT_PYODIDE / f).exists()
    assert build_nlp.OUT_REPORT.exists()
