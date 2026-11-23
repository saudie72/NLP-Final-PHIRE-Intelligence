import { showable } from "./text.js";

// Linear classifiers exported by nlp/train.py. Both logistic regression and multinomial Naive Bayes are
// scored as softmax(x . W + b); for Naive Bayes, W = feature_log_prob_ and b = class_log_prior_.

export function classify(clf, vec, model, topWords = 3) {
  const scores = clf.intercept.slice();
  for (const [i, w] of vec) for (let c = 0; c < scores.length; c++) scores[c] += w * clf.coef[c][i];
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  let best = 0;
  for (let c = 1; c < probs.length; c++) if (probs[c] > probs[best]) best = c;

  // words that pushed most toward the winning class relative to the average class
  const contributions = [];
  for (const [i, w] of vec) {
    let mean = 0;
    for (let c = 0; c < scores.length; c++) mean += clf.coef[c][i];
    mean /= scores.length;
    contributions.push([model.vocab[i], w * (clf.coef[best][i] - mean)]);
  }
  contributions.sort((a, b) => b[1] - a[1]);

  return {
    label: clf.classes[best],
    confidence: probs[best],
    probabilities: Object.fromEntries(clf.classes.map((c, k) => [c, probs[k]])),
    topWords: contributions.filter(([t, s]) => s > 0 && showable(t)).slice(0, topWords).map(([t]) => t),
  };
}
