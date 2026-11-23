// One shared NLTK (Pyodide) worker for the whole page; it starts on first use.
let worker = null;
let seq = 0;
const pending = new Map();
const listeners = new Set();
export const nltkState = { status: "idle", text: "", versions: null };

function emit(patch) {
  Object.assign(nltkState, patch);
  listeners.forEach((fn) => fn({ ...nltkState }));
}
export function onNltkState(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function start() {
  if (worker) return worker;
  emit({ status: "loading", text: "Starting Python…" });
  worker = new Worker(new URL("../nltkWorker.js", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const m = e.data;
    if (m.type === "status") emit({ status: "loading", text: m.text });
    if (m.type === "ready") emit({ status: "ready", text: "", versions: { nltk: m.nltk, pyodide: m.pyodide } });
    if (m.type === "result" || m.type === "error") {
      const p = pending.get(m.id);
      pending.delete(m.id);
      if (m.type === "error") emit({ status: "error", text: m.message });
      p?.[m.type === "result" ? "resolve" : "reject"](m.type === "result" ? m.result : new Error(m.message));
    }
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    emit({ status: "error", text: "Python could not start in this browser." });
    pending.forEach((p) => p.reject(new Error("worker failed")));
    pending.clear();
    worker = null;
  };
  return worker;
}

export function analyzeWithNltk(text) {
  const w = start();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ type: "analyze", id, text });
  });
}
