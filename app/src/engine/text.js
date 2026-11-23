// Text preparation and TF-IDF vectors. Mirrors nlp/train.py (prep + scikit-learn TfidfVectorizer settings):
// Title twice + Description, strip apostrophes, mask IDs / dates / long numbers, lowercase,
// tokens = \b\w\w+\b, unigrams + bigrams, sublinear TF (1 + ln tf), smooth IDF, L2 normalisation.

const MASKS = [
  [/\bIN\d{4,}\b/gi, " issueref "],
  [/\bCR\d{4,}\b/gi, " crref "],
  [/\bSYNUSER\d+\b/gi, " userref "],
  [/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, " dateref "],
  [/\b\d{4,}\b/g, " numref "],
];
const MASK_TOKENS = new Set(["issueref", "crref", "userref", "dateref", "numref"]);
const TOKEN = /\b\w\w+\b/g;

export function prep(title = "", description = "") {
  let text = `${title} ${title} ${description}`.replace(/['’]/g, "");
  for (const [rx, repl] of MASKS) text = text.replace(rx, repl);
  return text.toLowerCase();
}

export function terms(text) {
  const toks = text.match(TOKEN) || [];
  const out = toks.slice();
  for (let i = 0; i + 1 < toks.length; i++) out.push(`${toks[i]} ${toks[i + 1]}`);
  return out;
}

/** Index the model vocabulary once. */
export function indexModel(model) {
  if (!model._index) model._index = new Map(model.vocab.map((t, i) => [t, i]));
  return model._index;
}

/** Sparse L2-normalised TF-IDF vector: Map(featureIndex -> weight). */
export function vectorize(model, title, description) {
  const index = indexModel(model);
  const counts = new Map();
  for (const t of terms(prep(title, description))) {
    const i = index.get(t);
    if (i !== undefined) counts.set(i, (counts.get(i) || 0) + 1);
  }
  const vec = new Map();
  let norm = 0;
  for (const [i, tf] of counts) {
    const w = (1 + Math.log(tf)) * model.idf[i];
    vec.set(i, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm);
  if (norm > 0) for (const [i, w] of vec) vec.set(i, w / norm);
  return vec;
}

export function dot(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let s = 0;
  for (const [i, w] of small) {
    const v = large.get(i);
    if (v !== undefined) s += w * v;
  }
  return s;
}

export function isMaskToken(term) {
  return term.split(" ").some((t) => MASK_TOKENS.has(t));
}

// Display-only stop words for keywords (the model itself uses every term).
const STOP = new Set(("a an and are as at be been but by can could did do for from had has have hi how i in into is it its let " +
  "me more my need needs no not of on or our please see should so team that the their them then there these this to up us was " +
  "we were what when which who will with would you your know attached attachment let us any all also just").split(" "));
export const showable = (t) => !isMaskToken(t) && !t.split(" ").some((w) => STOP.has(w)) && !/^\d+$/.test(t);
