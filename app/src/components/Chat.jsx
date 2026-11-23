import { useEffect, useRef, useState } from "react";

// Which expert a ticket is routed to (same rules as the Orchestrator's routing guide).
export const EXPERT_FOR_AREA = {
  Functional: "erp-functional-analyst",
  Technical: "erp-developer",
  Security: "peoplesoft-admin",
  Administration: "peoplesoft-admin",
};
const FALLBACK_EXPERTS = [
  { id: "erp-functional-analyst", name: "Ray", role: "ERP Functional Analyst" },
  { id: "erp-developer", name: "Kwame", role: "ERP Developer" },
  { id: "peoplesoft-admin", name: "Dana", role: "PeopleSoft Administrator" },
  { id: "erp-manager", name: "Gloria", role: "ERP Manager" },
  { id: "erp-business-analyst", name: "Priya", role: "ERP Business Analyst" },
  { id: "orchestrator", name: "Marisol", role: "Orchestrator" },
];
const SUGGESTIONS = {
  "erp-functional-analyst": ["Is this configuration or development?", "Which setup pages should I check first?"],
  "erp-developer": ["Where would you start investigating?", "What should the test cover?"],
  "peoplesoft-admin": ["What should I check in Process Monitor or the IB monitor?", "Who needs to approve this access change?"],
  "erp-manager": ["Should this be escalated before pay confirmation?", "Is the PHIRE priority right?"],
  "erp-business-analyst": ["Which business process does this affect?", "Is a permanent fix worth a business case?"],
  orchestrator: ["Assess this ticket as a team.", "What are the next steps and who owns them?"],
};

const session = {
  get: (k) => { try { return sessionStorage.getItem(k) || ""; } catch { return ""; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } },
};

let statusPromise = null;
function chatStatus() {
  statusPromise ??= fetch("/api/chat", { headers: { Accept: "application/json" } })
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : { configured: false }))
    .catch(() => ({ configured: false }));
  return statusPromise;
}

/** Simple, safe rendering: paragraphs, bullets and **bold**, no HTML injection. */
function Answer({ text }) {
  const bold = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : p));
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n");
    if (lines.every((l) => /^\s*[-*]\s/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{bold(l.replace(/^\s*[-*]\s/, ""))}</li>)}</ul>;
    return <p key={i}>{lines.map((l, j) => <span key={j}>{bold(l.replace(/^_(.*)_$/, "$1"))}{j < lines.length - 1 && <br />}</span>)}</p>;
  });
}

export function ChatPanel({ ticket, byId }) {
  const [status, setStatus] = useState(null);
  const [expert, setExpert] = useState(EXPERT_FOR_AREA[ticket.issueArea] || "erp-functional-analyst");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(() => session.get("chat-consent") === "yes");
  const [password, setPassword] = useState(() => session.get("chat-password"));
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  useEffect(() => { chatStatus().then(setStatus); }, []);
  useEffect(() => { setMessages([]); setError(null); }, [expert, ticket.id]);
  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight); }, [messages]);

  const experts = status?.experts?.length ? status.experts : FALLBACK_EXPERTS;
  const who = experts.find((e) => e.id === expert) || experts[0];
  const routed = EXPERT_FOR_AREA[ticket.issueArea];

  const send = async (text) => {
    const q = text.trim();
    if (!q || busy) return;
    if (!consent) return setError("Please confirm the notice above first.");
    setError(null);
    const history = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const similar = ticket.similar.map((s) => ({ ...s, resolutionCode: byId.get(s.id)?.resolutionCode || null }));
      const { _row, similar: _s, references, ...t } = ticket;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expert, password, ticket: t, similar, messages: history }),
      });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).error || `Request failed (${res.status}).`;
        setMessages(history.slice(0, -1));
        setInput(q);
        return setError(msg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
      }
    } catch {
      setMessages(history.slice(0, -1));
      setError("Could not reach the chat service.");
    } finally {
      setBusy(false);
    }
  };

  if (status && !status.configured) {
    return (
      <div className="chat-off" data-testid="chat-off">
        <b>Ask the expert is not switched on for this site.</b>
        <p className="muted">The site owner turns it on by adding an <span className="mono">ANTHROPIC_API_KEY</span> environment
          variable in Netlify (and optionally <span className="mono">APP_PASSWORD</span>). Everything else in the app works without it.</p>
        <p className="faint">This ticket would go to <b>{FALLBACK_EXPERTS.find((e) => e.id === routed)?.name}</b>, {FALLBACK_EXPERTS.find((e) => e.id === routed)?.role}, based on its issue area.</p>
      </div>
    );
  }

  return (
    <div className="chat">
      <label className="field">Expert
        <select id="chat-expert" className="input" value={expert} onChange={(e) => setExpert(e.target.value)}>
          {experts.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.role}{e.id === routed ? " (assigned)" : ""}</option>)}
        </select>
      </label>
      {!consent && (
        <label className="consent">
          <input id="chat-consent" type="checkbox" onChange={(e) => { setConsent(e.target.checked); setError(null); session.set("chat-consent", e.target.checked ? "yes" : ""); }} />
          <span>I understand that chatting sends <b>this ticket's text</b> to Anthropic's API to generate the answer, and that I
            should only use synthetic or approved data on this site.</span>
        </label>
      )}
      {status?.passwordRequired && (
        <label className="field">App password
          <input id="chat-password" className="input" type="password" value={password} autoComplete="current-password"
            onChange={(e) => { setPassword(e.target.value); session.set("chat-password", e.target.value); }} />
        </label>
      )}
      <div className="chat-log" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="faint" style={{ fontSize: ".86rem" }}>
            Ask <b>{who?.name}</b> ({who?.role}) about {ticket.id}. They see the ticket, its classification and similar tickets.
            <div className="row" style={{ marginTop: 8 }}>
              {(SUGGESTIONS[expert] || []).map((s) => <button key={s} className="chip" onClick={() => send(s)} disabled={busy || !consent}>{s}</button>)}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="eyebrow">{m.role === "user" ? "You" : `${who?.name} · ${who?.role}`}</span>
            {m.role === "assistant" && !m.content ? <span className="faint">thinking…</span> : m.role === "assistant" ? <Answer text={m.content} /> : <p>{m.content}</p>}
          </div>
        ))}
      </div>
      {error && <p className="warnmsg" role="alert">{error}</p>}
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea id="chat-input" className="input" rows={2} maxLength={2000} value={input} placeholder={`Ask ${who?.name}…`}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <button className="btn primary" type="submit" disabled={busy || !input.trim()}>{busy ? "…" : "Send"}</button>
      </form>
      <p className="faint" style={{ fontSize: ".74rem" }}>Answers come from Claude ({status?.model || "Sonnet"}) using the expert's instructions and knowledge folder. Check them before acting.</p>
    </div>
  );
}
