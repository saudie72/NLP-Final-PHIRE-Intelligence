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

# Urgency vocabulary for support tickets (single words and two-word phrases), from docs/ticket-taxonomy.md.
URGENCY_TERMS = [
    "urgent", "asap", "immediately", "critical", "emergency", "deadline", "stuck", "queued", "down", "outage",
    "abend", "abended", "fails", "failed", "error", "errors", "cannot", "can't", "timing", "overpaying",
    "separated", "terminated", "locked", "pay confirmation", "pay confirm", "next pay period", "pay period end",
    "year-end", "w-2", "production", "several departments", "multiple departments", "not running", "nothing has run",
]

_sia = None
_stop = None


def _resources():
    global _sia, _stop
    if _sia is None:
        _sia = SentimentIntensityAnalyzer()
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
    """Words in the text that are in VADER's lexicon, with their valence (why VADER scored it that way)."""
    sia, _ = _resources()
    return [[w, sia.lexicon[w]] for w in tokens(text) if w in sia.lexicon]


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
