const REPO = "https://github.com/saudie72/NLP-Final-PHIRE-Intelligence";
const TEAM = [
  ["Orchestrator", "Marisol", "Coordination", "opus"], ["Product Manager", "Devin", "Coordination", "sonnet"],
  ["ERP Manager", "Gloria", "Coordination", "sonnet"], ["Meta Agent", "Theo", "Coordination", "sonnet"],
  ["ERP Business Analyst", "Priya", "PeopleSoft ERP", "opus"], ["ERP Functional Analyst", "Ray", "PeopleSoft ERP", "sonnet"],
  ["ERP Developer", "Kwame", "PeopleSoft ERP", "sonnet"], ["PeopleSoft Administrator", "Dana", "PeopleSoft ERP", "sonnet"],
  ["ERP QA Developer", "Lucia", "PeopleSoft ERP", "sonnet"], ["Software Architect", "Hiro", "Development & NLP", "opus"],
  ["NLP Specialist", "Amara", "Development & NLP", "opus"], ["Data Engineer", "Sam", "Development & NLP", "sonnet"],
  ["Front-End Developer", "Jules", "Development & NLP", "sonnet"], ["Back-End Developer", "Omar", "Development & NLP", "sonnet"],
  ["QA Tester", "Bea", "Development & NLP", "haiku"], ["Security Reviewer", "Nadia", "Development & NLP", "opus"],
];

const GUIDE = "https://claude.ai/artifact/NTCut33EUofio3qY7ZNCXQ";
const LINKS = [
  ["Project", [
    ["GitHub repository", REPO],
    ["Step-by-step guide (Build a team of synthetic employees with Claude Code)", GUIDE],
    ["Version 1 requirements", `${REPO}/blob/main/docs/requirements.md`],
    ["Architecture", `${REPO}/blob/main/docs/architecture.md`],
    ["Evaluation report", `${REPO}/blob/main/nlp/results.md`],
    ["ERP QA review", `${REPO}/blob/main/docs/erp-qa-review.md`],
    ["Security review", `${REPO}/blob/main/docs/security-review.md`],
    ["Version 2 plan", `${REPO}/blob/main/docs/version-2.md`],
    ["Research docs", `${REPO}/tree/main/docs`],
    ["Agent roster", `${REPO}/blob/main/docs/expert-roster.md`],
  ]],
  ["Libraries and frameworks", [
    ["React", "https://react.dev"],
    ["Vite", "https://vite.dev/guide/"],
    ["SheetJS (Excel in the browser)", "https://docs.sheetjs.com"],
    ["scikit-learn (model training)", "https://scikit-learn.org/stable/"],
    ["Anthropic TypeScript SDK", "https://github.com/anthropics/anthropic-sdk-typescript"],
    ["Fontsource (self-hosted fonts)", "https://fontsource.org"],
    ["IBM Plex typeface", "https://www.ibm.com/plex/"],
    ["Vitest", "https://vitest.dev"],
    ["Playwright", "https://playwright.dev"],
  ]],
  ["Platforms and web standards", [
    ["Netlify Functions", "https://docs.netlify.com/functions/overview/"],
    ["Netlify file-based configuration (netlify.toml)", "https://docs.netlify.com/configure-builds/file-based-configuration/"],
    ["Claude API documentation", "https://platform.claude.com/docs"],
    ["Claude Code subagents", "https://code.claude.com/docs/en/sub-agents"],
    ["Claude Code skills", "https://code.claude.com/docs/en/skills"],
    ["Claude Agent SDK (TypeScript)", "https://code.claude.com/docs/en/agent-sdk/typescript"],
    ["Node.js 22 API", "https://nodejs.org/docs/latest-v22.x/api/"],
    ["Web Workers (MDN)", "https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API"],
    ["Content Security Policy (MDN)", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"],
  ]],
  ["PeopleSoft domain", [
    ["Oracle PeopleSoft HCM 9.2 PeopleBooks", "https://docs.oracle.com/cd/F13810_02/hcm92pbr29/eng/hcm"],
    ["Project research on PHIRE and PeopleSoft (sources cited in each file)", `${REPO}/blob/main/docs/README.md`],
  ]],
];

export function Resources({ model }) {
  const m = model?.metrics;
  const pct = (x) => (x == null ? "—" : `${(x * 100).toFixed(1)}%`);
  return (
    <div className="grid" style={{ gap: 16 }}>
      <section className="panel prose" style={{ maxWidth: "none" }}>
        <span className="eyebrow">NLP final project · version 1</span>
        <h1>PeopleSoft PHIRE Ticket Intelligence</h1>
        <p className="muted" style={{ maxWidth: "72ch" }}>
          An NLP application that analyzes PeopleSoft HCM 9.2 and FSCM 9.2 support tickets exported from PHIRE. It was
          designed, built and tested by a team of 16 specialized Claude Code agents covering PeopleSoft ERP operations,
          software development and NLP.
        </p>
        <div className="row">
          <a className="btn" href={REPO} target="_blank" rel="noopener noreferrer">GitHub repository</a>
          <a className="btn" href={`${REPO}/blob/main/nlp/results.md`} target="_blank" rel="noopener noreferrer">Full evaluation report</a>
          <a className="btn" href={`${REPO}/tree/main/docs`} target="_blank" rel="noopener noreferrer">Research docs</a>
          <a className="btn" href={`${REPO}/blob/main/docs/expert-roster.md`} target="_blank" rel="noopener noreferrer">Agent roster</a>
          <a className="btn" href={GUIDE} target="_blank" rel="noopener noreferrer">Step-by-step guide</a>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>How the analysis works</h2><span className="faint" style={{ fontSize: ".8rem" }}>everything runs in your browser</span></div>
        <div className="pipeline">
          <div><b>1 · Read</b>Excel parsed locally (SheetJS); columns mapped to ticket fields.</div>
          <div><b>2 · Prepare</b>Title ×2 + description; IDs, dates and numbers masked; unigrams and bigrams.</div>
          <div><b>3 · Vectorize</b>TF-IDF with sublinear term frequency and L2 normalisation ({model ? model.vocabSize || "3,122" : "—"} terms).</div>
          <div><b>4 · Classify</b>Module: {m?.moduleModel || "logistic regression"}. Issue area: {m?.areaModel || "Naive Bayes"}.</div>
          <div><b>5 · Relate</b>Cosine similarity for similar tickets; average-linkage clustering for recurring issues.</div>
        </div>
      </section>

      <div className="grid g2">
        <section className="panel">
          <div className="panel-head"><h2>Evaluation (held-out synthetic test set)</h2></div>
          <div className="table-wrap" style={{ boxShadow: "none" }}>
            <table>
              <thead><tr><th>Measure</th><th className="num">Result</th></tr></thead>
              <tbody>
                <tr><td>Module accuracy ({m?.moduleModel})</td><td className="num">{pct(m?.moduleAccuracy)}</td></tr>
                <tr><td>Module macro F1</td><td className="num">{pct(m?.moduleF1)}</td></tr>
                <tr><td>Issue-area accuracy ({m?.areaModel})</td><td className="num">{pct(m?.areaAccuracy)}</td></tr>
                <tr><td>Issue-area macro F1</td><td className="num">{pct(m?.areaF1)}</td></tr>
                <tr><td>Baseline Naive Bayes, module</td><td className="num">{pct(m?.nbModuleAccuracy)}</td></tr>
                <tr><td>Similar-ticket precision@5</td><td className="num">{pct(m?.similarP5)}</td></tr>
                <tr><td>Recurring-issue clustering (adjusted Rand index)</td><td className="num">{m ? m.clusterARI.toFixed(3) : "—"}</td></tr>
                <tr><td>Rule-based priority agreement</td><td className="num">{pct(m?.priorityAgreement)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="faint" style={{ fontSize: ".8rem", marginTop: 10 }}>
            {m?.trainRows} training and {m?.testRows} test tickets, written with different phrasing. Models chosen by 5-fold
            cross-validation grouped by template; the test set was scored once. Real PHIRE text is messier, so expect lower accuracy on real data.
          </p>
        </section>
        <section className="panel prose" style={{ maxWidth: "none" }}>
          <h2>Data handling</h2>
          <p className="muted">Uploaded files are read and analyzed in this browser tab. Nothing is sent to a server; the site's
            Content-Security-Policy only allows connections back to this site, to load the model.</p>
          <p className="muted">This public site is meant for <b>synthetic or approved</b> data. Real PHIRE records can contain names,
            employee IDs, payroll and access details. Evaluate real exports only in an environment approved by your organization.</p>
          <p className="muted"><b>Ask the expert</b> (in each ticket) is the one exception: when the site owner switches it on, the
            ticket you chat about is sent to Anthropic's API through this site's server, after you confirm a notice.</p>
          <p className="muted">The demo data is synthetic: fictional county departments, <span className="mono">SYNUSER</span> placeholder IDs,
            and tickets generated from templates.</p>
        </section>
      </div>

      <section className="panel" data-testid="links">
        <div className="panel-head"><h2>Links this project relies on</h2><span className="faint" style={{ fontSize: ".8rem" }}>official documentation for every library and service</span></div>
        <div className="linkgrid">
          {LINKS.map(([group, items]) => (
            <div key={group}>
              <span className="eyebrow">{group}</span>
              <ul>{items.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noopener noreferrer">{label}</a></li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>The agent team that built it</h2><span className="faint" style={{ fontSize: ".8rem" }}>Claude Code subagents · model in brackets</span></div>
        <div className="team">
          {TEAM.map(([role, name, group, brain]) => (
            <div className="agent" key={role}><b>{name} · {role}</b><span>{group} · {brain}</span></div>
          ))}
        </div>
      </section>
    </div>
  );
}
