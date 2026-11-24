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


def test_peoplesoft_lexicon_neutralises_domain_words():
    assert nltk_core.sentiment("Security role pay po save effective date")["compound"] == 0
    assert not nltk_core.vader_drivers("Add security role for pay period")


def test_peoplesoft_lexicon_adds_problem_words():
    for word in ("queued", "abend", "abended"):
        assert nltk_core.sentiment(f"Process {word} overnight")["compound"] < -0.05


# ---------------- spaCy EntityRuler: v2 patterns ----------------
def _ruler_ents(text):
    nlp, _ = build_nlp.build_spacy()
    return {(e.text, e.label_) for e in nlp(text).ents if e.ent_id_ == "ruler"}


def test_ruler_fields_roles_and_tools():
    ents = _ruler_ents("The Timekeeper fixed the Earnings Code and TRC for the Workgroup and PPE Date; PUM image applied.")
    assert {("Timekeeper", "PS_ROLE"), ("Earnings Code", "PS_FIELD"), ("TRC", "PS_FIELD"),
            ("Workgroup", "PS_FIELD"), ("PPE Date", "PS_FIELD"), ("PUM image", "PS_TOOL")} <= ents


def test_bare_ppe_is_not_an_entity_but_its_date_is():
    ents = _ruler_ents("Run it for PPE 05/13/2026 and assign Payroll Inquiry.")
    assert ("05/13/2026", "DATE") in ents and ("Payroll Inquiry", "PS_ROLE") in ents
    assert not [e for e in ents if e[0] == "PPE"]


def test_process_scheduler_is_tool_and_psppyrun_is_program():
    ents = _ruler_ents("Process Scheduler is down and PSPPYRUN never started.")
    assert ("Process Scheduler", "PS_TOOL") in ents and ("PSPPYRUN", "PS_PROGRAM") in ents
    assert not [e for e in ents if e[0] in ("Process Scheduler", "PSPPYRUN") and e[1] not in ("PS_TOOL", "PS_PROGRAM")]
    labels = [p["label"] for p in patterns() if [t.get("LOWER") for t in p["pattern"]] == ["process", "scheduler"]]
    assert labels == ["PS_TOOL"]  # no duplicate pattern under another label


def test_generic_page_words_need_title_case():
    assert not [e for e in _ruler_ents("Please assign the roles and check the voucher and requisition.") if e[1] == "PS_PAGE"]
    ents = _ruler_ents("Open the Roles page, then Voucher and Work Schedule.")
    assert {("Roles", "PS_PAGE"), ("Voucher", "PS_PAGE"), ("Work Schedule", "PS_PAGE")} <= ents


def test_slash_dates_are_labelled_date():
    ents = _ruler_ents("Opened 09/14/2026 and effective 1/4/2027; not 13/40/2026 or 2026-09-14.")
    assert ("09/14/2026", "DATE") in ents and ("1/4/2027", "DATE") in ents
    assert not [e for e in ents if e[0].startswith("13/")]


def test_module_codes_only_in_code_context():
    assert ("HR module", "PS_MODULE") in _ruler_ents("Please route this to the HR module team.")
    assert not [e for e in _ruler_ents("Numbers for the HR department look wrong.") if e[1] == "PS_MODULE"]


def test_urgency_terms_taxonomy_cues():
    # round 2 tried dropping "error", "errors", "cannot" (higher precision, lower recall); validation F1 fell, so the
    # list was kept. Taxonomy High cues are matched as single words and phrases.
    found = nltk_core.urgency_terms("Separated employee still has access; fix before the next pay period and year-end")
    assert {"separated", "next pay period", "year-end"} <= set(found)
    assert "production" in nltk_core.urgency_terms("Production is down for payroll")
