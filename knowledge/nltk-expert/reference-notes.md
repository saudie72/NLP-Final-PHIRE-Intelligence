# NLTK reference notes

Notes from the official NLTK documentation for the features this project uses. NLTK version in the build and
in Pyodide: **3.9.1**.

## Data packages (nltk.download)
- Many NLTK features need data that is **not** in the pip package; download it with `nltk.download("<id>")`.
- NLTK looks for data in the directories listed in `nltk.data.path`; the `NLTK_DATA` environment variable adds one.
  The pipeline downloads into `pipeline/.nltk_data` and the browser writes the same files to `/nltk_data`.
- Data can stay zipped: `nltk.data.find("corpora/stopwords")` also finds `corpora/stopwords.zip`.
- This project needs two packages: `vader_lexicon` (`sentiment/vader_lexicon.zip`) and `stopwords`
  (`corpora/stopwords.zip`). It deliberately avoids `punkt`/`punkt_tab` so the same code runs in Pyodide.
- Source: https://www.nltk.org/data.html

## Tokenizing
- `RegexpTokenizer(pattern)` splits text with a regular expression and needs no data download.
- Our pattern `[A-Za-z0-9][A-Za-z0-9_'\-]*[A-Za-z0-9]` keeps PeopleSoft codes such as `TL_TIMEADMIN`, `W-2`, `1099` whole.
- `word_tokenize` is more linguistic but requires the `punkt_tab` model.
- Source: https://www.nltk.org/api/nltk.tokenize.regexp.html

## Stopwords
- `nltk.corpus.stopwords.words("english")` returns the English stopword list (about 180 words).
- Add domain stopwords for ticket boilerplate ("please", "attached", "steps", "reproduce") so frequency
  counts show content words.
- Source: https://www.nltk.org/howto/corpus.html

## VADER sentiment
- `from nltk.sentiment.vader import SentimentIntensityAnalyzer`; `SentimentIntensityAnalyzer().polarity_scores(text)`
  returns `neg`, `neu`, `pos` (proportions) and `compound` (normalised, −1 to +1).
- Standard thresholds: compound ≥ 0.05 positive, ≤ −0.05 negative, otherwise neutral.
- VADER is a lexicon + rules model tuned for social-media text; it handles negation, "but", capitals and
  punctuation emphasis. It does not know domain meaning: in our tickets "pay" scores negative and "security",
  "save", "please" score positive (see `reports/nlp-language-evaluation.md`).
- `analyzer.lexicon` is the word → valence dictionary; we use it to show which words drove a score.
- Sources: https://www.nltk.org/howto/sentiment.html, https://www.nltk.org/api/nltk.sentiment.vader.html

## FreqDist
- `FreqDist(tokens)` counts samples; `.most_common(n)` returns the top n `(word, count)` pairs.
- Source: https://www.nltk.org/api/nltk.probability.FreqDist.html

## Collocations
- `BigramCollocationFinder.from_words(tokens)` for one text, or `.from_documents(list_of_token_lists)` so
  bigrams never span two tickets.
- `finder.apply_freq_filter(3)` drops rare pairs; rank with `finder.score_ngrams(BigramAssocMeasures().likelihood_ratio)`
  (or `.pmi`, which over-rewards rare pairs).
- `finder.ngram_fd[(w1, w2)]` gives the raw count.
- Source: https://www.nltk.org/howto/collocations.html

## In this project
- One module, `pipeline/nltk_core.py`, is used at build time and copied to the browser, so live results match.
- Results: `app/public/nlp/language.json` (build) and the "Analyze your own ticket" box (Pyodide).
