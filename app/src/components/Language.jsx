import { useEffect, useState } from "react";
import { analyzeWithNltk, nltkState, onNltkState } from "../lib/nltkClient.js";
import { Bars } from "./ui.jsx";

export const Lib = ({ name }) => <span className={`lib ${name === "NLTK" ? "nltk" : name === "spaCy" ? "spacy" : "both"}`}>{name}</span>;

const LABEL_NAMES = {
  PS_MODULE: "Modules", PS_PAGE: "Pages", PS_PROCESS: "Processes", PS_TOOL: "PeopleTools", PS_PROGRAM: "Programs",
  PS_ENV: "Environments", TICKET_REF: "Ticket / CR numbers", USER_ID: "User IDs (synthetic)", BUSINESS_UNIT: "Business units",
};
const tone = (c) => (c <= -0.05 ? "var(--bad)" : c >= 0.05 ? "var(--good)" : "var(--ink-3)");
const fmt = (c) => `${c >= 0 ? "+" : "−"}${Math.abs(c).toFixed(2)}`;

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
                <i style={{ width: `${s.neu * 100}%`, background: "var(--line)" }} />
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
          <a className="btn" href="https://github.com/saudie72/NLP-Final-PHIRE-Intelligence/blob/main/reports/nlp-language-evaluation.md" target="_blank" rel="noopener noreferrer">Evaluation and errors</a>
        </div>
      </section>

      <NltkBox initialText={initialText} />

      <div className="grid g2">
        <section className="panel" data-testid="panel-sentiment">
          <div className="panel-head"><h2>Sentiment by issue area <Lib name="NLTK" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>VADER</span></div>
          <div className="stack">
            {areaBars.map((a) => (
              <div key={a.area} className="stack-row">
                <span>{a.area}</span>
                <div className="sentbar">
                  <i style={{ width: `${(a.negative / a.n) * 100}%`, background: "var(--bad)" }} title={`${a.negative} negative`} />
                  <i style={{ width: `${(a.neutral / a.n) * 100}%`, background: "var(--line)" }} title={`${a.neutral} neutral`} />
                  <i style={{ width: `${(a.positive / a.n) * 100}%`, background: "var(--good)" }} title={`${a.positive} positive`} />
                </div>
                <span className="num mono" style={{ color: tone(a.mean) }}>{fmt(a.mean)}</span>
              </div>
            ))}
          </div>
          <div className="legend"><span><i style={{ background: "var(--bad)" }} />negative</span><span><i style={{ background: "var(--line)" }} />neutral</span><span><i style={{ background: "var(--good)" }} />positive</span><span>number = mean compound</span></div>
          <div className="table-wrap" style={{ marginTop: 14, boxShadow: "none" }}>
            <table>
              <thead><tr><th>PHIRE priority</th><th className="num">Tickets</th><th className="num">Mean VADER</th><th className="num">Negative</th><th className="num">Urgency words</th></tr></thead>
              <tbody>{n.sentimentByPriority.map((p) => (
                <tr key={p.priority} style={{ cursor: "default" }}><td>{p.priority}</td><td className="num">{p.n}</td><td className="num mono">{fmt(p.mean)}</td>
                  <td className="num">{Math.round(p.negativeShare * 100)}%</td><td className="num">{Math.round(p.urgentShare * 100)}%</td></tr>))}</tbody>
            </table>
          </div>
          <p className="faint" style={{ fontSize: ".8rem", marginTop: 10 }}>
            Words driving VADER here: <b>+</b> {n.vaderDrivers.positive.slice(0, 5).map(([w]) => w).join(", ")} · <b>−</b> {n.vaderDrivers.negative.slice(0, 5).map(([w]) => w).join(", ")}.
            “Pay” and “security” are everyday PeopleSoft words, not feelings: a known VADER domain error discussed in the evaluation.
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
            Errors such as “Parks” as PERSON or “PO” as GPE are listed in the evaluation.
          </p>
        </section>
      </div>

      <section className="panel" data-testid="panel-aspects">
        <div className="panel-head"><h2>Aspects and opinions <Lib name="NLTK + spaCy" /></h2><span className="faint" style={{ fontSize: ".8rem" }}>spaCy noun chunks + dependency parse · NLTK VADER on the sentence</span></div>
        <div className="table-wrap" style={{ boxShadow: "none" }}>
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
