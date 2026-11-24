"""NLTK text analysis shared by the build pipeline and the browser.

The same file runs in two places:
  - at build time on Netlify (pipeline/build_nlp.py), over the synthetic demo tickets
  - live in the browser through Pyodide (the "Analyze your own ticket" box), copied to /pyodide-data/nltk_core.py
so a ticket gets identical NLTK results in both. Only NLTK resources that work in Pyodide are used:
RegexpTokenizer (no punkt download), the stopwords corpus, VADER, FreqDist and bigram collocations.
Docs: https://www.nltk.org/api/nltk.tokenize.regexp.html, https://www.nltk.org/howto/sentiment.html,
      https://www.nltk.org/api/nltk.probability.FreqDist.html, https://www.nltk.org/howto/collocations.html
"""
from nltk.collocations import BigramAssocMeasures, BigramCollocationFinder
from nltk.corpus import stopwords
from nltk.probability import FreqDist
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.tokenize import RegexpTokenizer

# Words of 2+ characters; keeps PeopleSoft codes such as tl_timeadmin, w-2, 1099 together.
TOKENIZER = RegexpTokenizer(r"[A-Za-z0-9][A-Za-z0-9_'\-]*[A-Za-z0-9]")

# Ticket boilerplate that says nothing about the issue (added to NLTK's English stopwords).
DOMAIN_STOPWORDS = {
    "please", "hi", "team", "thanks", "thank", "let", "know", "need", "needs", "see", "attached", "attachment",
    "information", "requested", "request", "requests", "issue", "ticket", "would", "could", "also", "like",
    "can", "get", "us", "per", "new", "using", "via", "etc",
    # ticket-template boilerplate ("Steps to reproduce: 1. Navigate to ...", "Mockup attached", "See spec")
    "steps", "reproduce", "navigate", "affected", "mockup", "spec", "save", "open", "list", "looks",
}

# Urgency vocabulary for support tickets (single words and multi-word phrases, matched on whole tokens), from
# docs/ticket-taxonomy.md "Priority suggestion signals". v2 round 2 tried removing "error", "errors" and "cannot"
# (Technical cue words, not High cues): precision rose but recall fell and F1 on a train validation split dropped
# (0.566 -> 0.553), so the list was kept as is.
URGENCY_TERMS = [
    "urgent", "asap", "immediately", "critical", "emergency", "deadline", "stuck", "queued", "down", "outage",
    "abend", "abended", "fails", "failed", "error", "errors", "cannot", "can't", "timing", "overpaying",
    "separated", "terminated", "locked", "pay confirmation", "pay confirm", "next pay period", "pay period end",
    "year-end", "w-2", "production", "several departments", "multiple departments", "not running", "nothing has run",
]

# PeopleSoft adjustment to VADER's lexicon (word -> valence, VADER range -4..+4). VADER was built for social media, so
# neutral PeopleSoft vocabulary scores as emotion and real problem words are missing. Derived only from the training
# tickets (data/synthetic/phire_train.csv) and docs/ticket-taxonomy.md; the test set was not consulted.
# Valence 0 = "not emotional here". Applied in _resources(); a score is still one signal, not a priority.
PEOPLESOFT_LEXICON = {
    # neutral in PeopleSoft tickets (VADER scores them as emotion)
    "pay": 0.0,        # payroll / "pay period" / "pay confirmation": the subject matter, not a complaint (-0.4)
    "po": 0.0,         # purchase order (-2.6)
    "security": 0.0,   # security role / access request, not praise (+1.4)
    "save": 0.0,       # "Save" button and "save error" (+2.2)
    "effective": 0.0,  # "effective date" / "effective-dated row" (+2.1)
    "value": 0.0,      # field value / translate value (+1.4)
    "values": 0.0,     # same as "value" (+1.7)
    "support": 0.0,    # "Production Support Item", "support request" (+1.7)
    "approved": 0.0,   # workflow status (+1.8)
    "approval": 0.0,   # workflow step (+2.1)
    "create": 0.0,     # "create a new ..." is a request verb (+1.1)
    "created": 0.0,    # record or row created (positive in VADER)
    "attachment": 0.0, # ticket boilerplate "see attachment" (+1.2)
    "please": 0.0,     # politeness on routine requests (+1.3)
    "rescue": 0.0,     # "Fire Rescue" department name (+2.3)
    "fire": 0.0,       # "Fire Rescue" department name (-1.4)
    # problem words that are missing from, or too weak in, VADER (docs/ticket-taxonomy.md urgency vocabulary)
    "queued": -1.5,    # process stuck in Queued status
    "abend": -2.0,     # abnormal end of a process / App Engine run
    "abended": -2.0,   # past tense of abend
    "stuck": -2.0,     # process or approval stuck (VADER has -1.0)
    "outage": -2.0,    # system or process down
    "cannot": -1.5,    # "users cannot ..." (VADER only knows "can't")
    "incorrect": -1.5, # wrong data (VADER has "wrong" but not "incorrect")
    "discrepancy": -1.2,  # balance / amount mismatch
    "locked": -1.0,    # locked account or row
}

_sia = None
_stop = None


def _resources():
    global _sia, _stop
    if _sia is None:
        _sia = SentimentIntensityAnalyzer()
        _sia.lexicon.update(PEOPLESOFT_LEXICON)
        _stop = set(stopwords.words("english")) | DOMAIN_STOPWORDS
    return _sia, _stop


def tokens(text):
    """Lowercased word tokens (RegexpTokenizer)."""
    return [t.lower() for t in TOKENIZER.tokenize(text or "")]


def content_tokens(text):
    """Tokens without stopwords or pure numbers."""
    _, stop = _resources()
    return [t for t in tokens(text) if t not in stop and not t.isdigit() and len(t) > 2]


def sentiment(text):
    """VADER polarity scores: neg / neu / pos and compound in [-1, 1]."""
    sia, _ = _resources()
    return sia.polarity_scores(text or "")


def vader_drivers(text):
    """Words with a non-zero valence in the (PeopleSoft-adjusted) lexicon: why VADER scored the text that way."""
    sia, _ = _resources()
    return [[w, sia.lexicon[w]] for w in tokens(text) if sia.lexicon.get(w)]


def sentiment_label(compound):
    """VADER's recommended thresholds."""
    return "negative" if compound <= -0.05 else "positive" if compound >= 0.05 else "neutral"


def urgency_terms(text):
    t = " " + " ".join(tokens(text)) + " "
    return [u for u in URGENCY_TERMS if f" {u} " in t]


def top_words(token_lists, n=20):
    fd = FreqDist(w for toks in token_lists for w in toks)
    return [[w, c] for w, c in fd.most_common(n)]


def collocations(token_lists, n=15, min_freq=3):
    """Bigram collocations ranked by likelihood ratio, across documents (no bigrams across tickets)."""
    finder = BigramCollocationFinder.from_documents(token_lists)
    finder.apply_freq_filter(min_freq)
    measures = BigramAssocMeasures()
    scored = finder.score_ngrams(measures.likelihood_ratio)[:n]
    return [[f"{a} {b}", round(s, 1), finder.ngram_fd[(a, b)]] for (a, b), s in scored]


def analyze_text(text):
    """Everything the live box shows for one ticket."""
    toks = tokens(text)
    content = content_tokens(text)
    s = sentiment(text)
    finder = BigramCollocationFinder.from_words(content)
    bigrams = [f"{a} {b}" for (a, b), _ in finder.ngram_fd.most_common(6)]
    return {
        "tokenCount": len(toks),
        "contentCount": len(content),
        "stopwordsRemoved": len(toks) - len(content),
        "sentiment": {k: round(v, 3) for k, v in s.items()},
        "sentimentLabel": sentiment_label(s["compound"]),
        "urgency": urgency_terms(text),
        "topWords": [[w, c] for w, c in FreqDist(content).most_common(8)],
        "bigrams": bigrams,
    }
