import { useEffect, useState } from "react";
import { analyzeWithNltk, nltkState, onNltkState } from "../lib/nltkClient.js";
import { Bars } from "./ui.jsx";

export const Lib = ({ name }) => <span className={`lib ${name === "NLTK" ? "nltk" : name === "spaCy" ? "spacy" : "both"}`}>{name}</span>;

const LABEL_NAMES = {
  PS_MODULE: "Modules", PS_PAGE: "Pages", PS_PROCESS: "Processes", PS_TOOL: "PeopleTools", PS_PROGRAM: "Programs",
  PS_ENV: "Environments", TICKET_REF: "Ticket / CR numbers", USER_ID: "User IDs (synthetic)", BUSINESS_UNIT: "Business units",
  PS_FIELD: "Fields and codes", PS_ROLE: "Business roles",
};
const tone = (c) => (c <= -0.05 ? "var(--bad)" : c >= 0.05 ? "var(--good)" : "var(--ink-3)");
const fmt = (c) => `${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2)}`;

const EVAL_URL = "https://github.com/saudie72/NLP-Final-PHIRE-Intelligence/blob/main/reports/nlp-language-evaluation.md";
const EvalLink = ({ children }) => (
  <a href={EVAL_URL} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (opens GitHub, new tab)</span></a>
);
const pct = (x) => Math.round(x * 100);
const pct2 = (x) => Math.round(Number(x.toFixed(2)) * 100);   // same rounding as the 2-decimal table cells

const EXAMPLE = "Time Administration has been stuck in Queued since Sunday. Approvers in Public Works and Parks cannot see payable time and pay confirmation is Thursday. Please help, this is urgent.";

/** NLTK live in the browser (Pyodide). */
export function NltkBox({ initialText }) {
  const [text, setText] = useState(initialText || EXAMPLE);
  const [state, setState] = useState({ ...nltkState });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onNltkState(setState), []);
  useEffect(() => { if (initialText) setText(initialText); }, [initialText]);
  const run = async () => {
    setBusy(true);
    try { setResult(await analyzeWithNltk(text)); } catch { /* status shows the error */ } finally { setBusy(false); }
  };
  const s = result?.sentiment;
  return (
    <section className="panel" data-testid="nltk-box">
      <div className="panel-head">
        <h2>Analyze your own ticket <Lib name="NLTK" /></h2>
        <span className="faint" style={{ fontSize: ".8rem" }}>NLTK running live in your browser via Pyodide · nothing is uploaded</span>
      </div>
      <div className="grid" style={{ gap: 10 }}>
        <textarea id="nltk-text" className="input" rows={4} maxLength={20000} value={text} onChange={(e) => setText(e.target.value)}
          aria-label="Ticket text to analyze with NLTK" />
        <div className="row">
          <button className="btn primary" onClick={run} disabled={busy || !text.trim()} data-testid="nltk-run">
            {busy ? (state.status === "loading" ? state.text || "Loading…" : "Analyzing…") : "Analyze with NLTK"}
          </button>
          {state.status === "idle" && <span className="faint" style={{ fontSize: ".8rem" }}>First run downloads Python + NLTK (about 14 MB, once).</span>}
          {state.versions && <span className="faint" style={{ fontSize: ".8rem" }}>NLTK {state.versions.nltk} · Pyodide {state.versions.pyodide}</span>}
          {state.status === "error" && <span className="warnmsg">{state.text}</span>}
        </div>
        {result && (
          <div className="nltk-result" data-testid="nltk-result">
            <div>
              <span className="eyebrow">VADER sentiment</span>
              <div className="sent">
                <b style={{ color: tone(s.compound) }}>{fmt(s.compound)}</b>
                <span className="kw">{result.sentimentLabel}</span>
              </div>
              <div className="sentbar" title={`negative ${s.neg} · neutral ${s.neu} · positive ${s.pos}`}>
                <i style={{ width: `${s.neg * 100}%`, background: "var(--bad)" }} />
                <i className="neu" style={{ width: `${s.neu * 100}%` }} />
                <i style={{ width: `${s.pos * 100}%`, background: "var(--good)" }} />
              </div>
              <p className="faint" style={{ fontSize: ".76rem" }}>neg {s.neg} · neu {s.neu} · pos {s.pos}</p>
            </div>
            <div>
              <span className="eyebrow">Urgency keywords</span>
              <div className="row" style={{ marginTop: 6 }}>{result.urgency.length ? result.urgency.map((u) => <span key={u} className="flag">{u}</span>) : <span className="faint">none found</span>}</div>
            </div>
            <div>
              <span className="eyebrow">Top words (FreqDist, stopwords removed)</span>
              <div className="row" style={{ marginTop: 6 }}>{result.topWords.map(([w, c]) => <span key={w} className="kw">{w} ×{c}</span>)}</div>
            </div>
            <div>
              <span className="eyebrow">Bigrams</span>
              <div className="row" style={{ marginTop: 6 }}>{result.bigrams.map((b) => <span key={b} className="kw">{b}</span>)}</div>
            </div>
            <p className="faint" style={{ fontSize: ".78rem" }}>{result.tokenCount} tokens · {result.stopwordsRemoved} stopwords and boilerplate words removed · tokenizer: RegexpTokenizer</p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Ticket text with spaCy entity spans highlighted (displaCy-style). */
export function EntityText({ text, entities }) {
  const parts = [];
  let at = 0;
  for (const e of [...entities].sort((a, b) => a.start - b.start)) {
    if (e.start < at) continue;
    parts.push(text.slice(at, e.start));
    parts.push(<mark key={e.start} className={`ent ${e.source}`} title={`${e.label} · ${e.source === "ruler" ? "EntityRuler" : "en_core_web_sm"}`}>
      {text.slice(e.start, e.end)}<small>{e.label}</small></mark>);
    at = e.end;
  }
  parts.push(text.slice(at));
  return <p className="ent-text">{parts}</p>;
}

export function Language({ data, initialText, go }) {
  if (!data) return <div className="panel"><p className="muted">Loading the build-time NLTK and spaCy results…</p></div>;
  const n = data.nltk, s = data.spacy;
  const areaBars = n.sentimentByArea;
  const ee = data.entityEval;
  const bestF1 = ee ? Math.max(ee.model.overall[2], ee.ruler.overall[2]) : 0;
  // Plain-language reading of the priority table, derived from the data (observation only, no cause claimed).
  const prio = n.sentimentByPriority;
  const prioH = prio.find((p) => p.priority === "H"), prioL = prio.find((p) => p.priority === "L");
  const means = prio.map((p) => p.mean);
  const prioNote = prioH && prioL
    ? `Observation: mean sentiment ranges only from ${fmt(Math.min(...means))} to ${fmt(Math.max(...means))} across priorities, `
      + `while ${pct(prioH.urgentShare)}% of H tickets contain urgency words against ${pct(prioL.urgentShare)}% of L. `
      + (prioH.urgentShare > prioL.urgentShare && (Math.max(...means) - Math.min(...means)) < 0.15
        ? "In this sample, urgency words separate H from L better than sentiment does (no cause is claimed)."
        : "Compare the two columns before relying on either as a priority cue.")
    : null;
  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="panel prose" style={{ maxWidth: "none" }}>
        <span className="eyebrow">Language analysis · NLTK and spaCy</span>
        <p className="muted" style={{ maxWidth: "80ch" }}>
          Panels marked <Lib name="NLTK" /> and <Lib name="spaCy" /> were computed <b>at build time on Netlify</b> by
          <span className="mono"> pipeline/build_nlp.py</span> over the {data.tickets} synthetic demo tickets
          (NLTK {data.versions.nltk}, spaCy {data.versions.spacy}, {data.versions.model}). spaCy can only run at build time;
          NLTK also runs <b>live in your browser</b> in the box below.
        </p>
        <div className="row">
          <button className="btn" onClick={() => go("tickets")}>See NLTK + spaCy per ticket</button>
          <a className="btn" href={EVAL_URL} target="_blank" rel="noopener noreferrer">Evaluation and errors<span className="sr-only"> (opens GitHub, new tab)</span>
            <svg className="ext-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 2h5v5M14 2 7 9M12 10v3.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5H7" /></svg></a>
        </div>
      </section>

      <NltkBox initialText={initialText} />

      <div className="grid g2">
        <section className="panel" data-testid="panel-sentiment">
          <div className="panel-head"><h2>Sentiment by issue area <Lib name="NLTK" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>VADER</span></div>
          <div className="stack">
            {areaBars.map((a) => {
              const split = `${pct(a.negative / a.n)}% negative, ${pct(a.neutral / a.n)}% neutral, ${pct(a.positive / a.n)}% positive`;
              return (
              <div key={a.area} className="stack-row">
                <span>{a.area}<span className="sent-split">{pct(a.negative / a.n)}% neg / {pct(a.neutral / a.n)}% neu / {pct(a.positive / a.n)}% pos</span></span>
                <div className="sentbar" role="img" aria-label={`${a.area}: ${split}`}>
                  <i style={{ width: `${(a.negative / a.n) * 100}%`, background: "var(--bad)" }} title={`${a.negative} negative`} />
                  <i className="neu" style={{ width: `${(a.neutral / a.n) * 100}%` }} title={`${a.neutral} neutral`} />
                  <i style={{ width: `${(a.positive / a.n) * 100}%`, background: "var(--good)" }} title={`${a.positive} positive`} />
                </div>
                <span className="num mono" style={{ color: tone(a.mean) }}>{fmt(a.mean)}</span>
              </div>
              );
            })}
          </div>
          <div className="legend"><span><i style={{ background: "var(--bad)" }} />negative</span><span><i style={{ background: "color-mix(in srgb, var(--ink-3) 40%, var(--panel))" }} />neutral</span><span><i style={{ background: "var(--good)" }} />positive</span><span>number = mean sentiment (VADER compound)</span></div>
          <div className="table-wrap compact" style={{ marginTop: 14, boxShadow: "none" }} tabIndex={0} role="region" aria-label="PHIRE priority sentiment table">
            <table>
              <thead><tr><th scope="col">PHIRE priority</th><th scope="col" className="num">Tickets</th><th scope="col" className="num">Mean sentiment (VADER compound)</th><th scope="col" className="num">% negative</th><th scope="col" className="num">% with urgency words</th></tr></thead>
              <tbody>{n.sentimentByPriority.map((p) => (
                <tr key={p.priority} style={{ cursor: "default" }}><td>{p.priority}</td><td className="num">{p.n}</td><td className="num mono">{fmt(p.mean)}</td>
                  <td className="num">{Math.round(p.negativeShare * 100)}%</td><td className="num">{Math.round(p.urgentShare * 100)}%</td></tr>))}</tbody>
            </table>
          </div>
          {prioNote && <p className="muted" style={{ fontSize: ".85rem", marginTop: 10 }}>{prioNote}</p>}
          <p className="faint caveat" style={{ marginTop: 10 }}>
            Words driving VADER here: <b>+</b> {n.vaderDrivers.positive.slice(0, 5).map(([w]) => w).join(", ")} · <b>−</b> {n.vaderDrivers.negative.slice(0, 5).map(([w]) => w).join(", ")}.
            Everyday PeopleSoft words such as “pay” and “security” are set to neutral, and problem words such as “queued” and “abend” added, by a PeopleSoft lexicon adjustment (<EvalLink>see the evaluation</EvalLink>).
          </p>
        </section>

        <section className="panel" data-testid="panel-urgency">
          <div className="panel-head"><h2>Urgency keywords <Lib name="NLTK" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>tokens + bigrams</span></div>
          <Bars data={n.urgencyTerms.slice(0, 8).map(([label, value]) => ({ label, value }))} color={() => "var(--accent)"} />
          <p className="faint" style={{ fontSize: ".8rem", marginTop: 12 }}>
            As a signal for PHIRE priority H: precision {n.urgencyEval.precision.toFixed(2)}, recall {n.urgencyEval.recall.toFixed(2)}
            {" "}(VADER “negative” alone: {n.vaderEval.precision.toFixed(2)} / {n.vaderEval.recall.toFixed(2)}).
          </p>
        </section>
      </div>

      <div className="grid g2">
        <section className="panel" data-testid="panel-topwords">
          <div className="panel-head"><h2>Top words <Lib name="NLTK" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>FreqDist · stopwords removed</span></div>
          <Bars data={n.topWords.slice(0, 12).map(([label, value]) => ({ label, value }))} color={() => "var(--nltk)"} />
        </section>
        <section className="panel" data-testid="panel-collocations">
          <div className="panel-head"><h2>Key phrases <Lib name="NLTK" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>bigram collocations · likelihood ratio</span></div>
          <ol className="phrases">{n.collocations.slice(0, 12).map(([p, score, count]) => <li key={p}><b>{p}</b><span className="faint">×{count} · LR {score}</span></li>)}</ol>
        </section>
      </div>

      <div className="grid g2">
        <section className="panel" data-testid="panel-ruler">
          <div className="panel-head"><h2>PeopleSoft objects <Lib name="spaCy" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>EntityRuler · {Math.round(s.rulerCoverage * 100)}% of tickets</span></div>
          <div className="entgrid">
            {Object.entries(s.rulerEntities).map(([label, items]) => (
              <div key={label}>
                <span className="eyebrow">{LABEL_NAMES[label] || label} <span className="mono">{label}</span></span>
                <div className="row" style={{ marginTop: 6 }}>{items.slice(0, 6).map(([w, c]) => <span key={w} className="ent-chip ruler">{w} <small>×{c}</small></span>)}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel" data-testid="panel-model-ents">
          <div className="panel-head"><h2>Named entities <Lib name="spaCy" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>{data.versions.model} statistical NER</span></div>
          <div className="entgrid">
            {Object.entries(s.modelEntities).slice(0, 6).map(([label, items]) => (
              <div key={label}>
                <span className="eyebrow mono">{label}</span>
                <div className="row" style={{ marginTop: 6 }}>{items.slice(0, 5).map(([w, c]) => <span key={w} className="ent-chip model">{w} <small>×{c}</small></span>)}</div>
              </div>
            ))}
          </div>
          <p className="faint" style={{ fontSize: ".8rem", marginTop: 12 }}>
            Without the EntityRuler, the model calls PeopleSoft pages and processes: {s.modelOnlyOnPeopleSoft.slice(0, 4).map(([l, c]) => `${l} ${c}`).join(" · ")}.
            Errors such as “Parks” as PERSON or “TR” as GPE are listed in <EvalLink>the evaluation</EvalLink>.
          </p>
        </section>
      </div>

      {data.entityEval && (
        <section className="panel" data-testid="panel-entity-eval">
          <div className="panel-head"><h2>Entity accuracy <Lib name="spaCy" /></h2><span className="faint caveat">{ee.goldEntities} hand-labelled entities in {ee.tickets} tickets</span></div>
          <p className="faint caveat">Exact text and label must match. One labeller, synthetic text: indicative only.</p>
          <p className="plain-reading" data-testid="entity-plain">
            Out of every 100 entities the PeopleSoft EntityRuler + spaCy model pipeline tagged, about {pct2(ee.ruler.overall[0])} were right (precision);
            it found about {pct2(ee.ruler.overall[1])} of every 100 that a person labelled (recall). The spaCy model alone: {pct2(ee.model.overall[0])} right, {pct2(ee.model.overall[1])} found.
          </p>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Entity accuracy table">
            <table>
              <caption className="sr-only">Precision, recall and F1 for the model alone and for the EntityRuler plus model, on hand-labelled synthetic tickets</caption>
              <thead><tr><th scope="col">Pipeline</th><th scope="col" className="num">Precision</th><th scope="col" className="num">Recall</th><th scope="col" className="num">F1</th></tr></thead>
              <tbody>
                {[["spaCy model only", "en_core_web_sm alone", ee.model], ["PeopleSoft EntityRuler + spaCy model", "EntityRuler + en_core_web_sm", ee.ruler]].map(([name, tech, r]) => (
                  <tr key={name} style={{ cursor: "default" }}><td>{name}<br /><span className="tech mono">{tech}</span></td>
                    {r.overall.map((v, i) => <td key={i} className={`num${i === 2 && r.overall[2] === bestF1 ? " best" : ""}`}>{v.toFixed(2)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="faint caveat" style={{ marginTop: 12 }}>
            The model alone has no PeopleSoft labels, so it can only score on dates and departments.
          </p>
        </section>
      )}

      <section className="panel" data-testid="panel-aspects">
        <div className="panel-head"><h2>Aspects and opinions <Lib name="NLTK + spaCy" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>spaCy noun chunks + dependency parse · NLTK VADER on the sentence</span></div>
        <div className="table-wrap" style={{ boxShadow: "none" }} tabIndex={0} role="region" aria-label="Aspects and opinions table">
          <table>
            <thead><tr><th>Aspect (noun chunk)</th><th className="num">Mentions</th><th className="num">Mean VADER</th><th>Opinion words (parse)</th></tr></thead>
            <tbody>{data.both.aspects.slice(0, 12).map((a) => (
              <tr key={a.aspect} style={{ cursor: "default" }}><td><b>{a.aspect}</b></td><td className="num">{a.n}</td>
                <td className="num mono" style={{ color: tone(a.mean) }}>{fmt(a.mean)}</td><td className="muted">{a.opinions.join(", ") || "—"}</td></tr>))}</tbody>
          </table>
        </div>
        <p className="faint" style={{ fontSize: ".8rem", marginTop: 10 }}>Top lemmas (spaCy lemmatizer): {s.topLemmas.slice(0, 12).map(([w]) => w).join(", ")}.</p>
      </section>
    </div>
  );
}
