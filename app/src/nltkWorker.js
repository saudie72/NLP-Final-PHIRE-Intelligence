// Runs NLTK live in the browser with Pyodide (Python compiled to WebAssembly), self-hosted under /pyodide/.
// It loads the same nltk_core.py the build pipeline uses, so results match the build-time analysis.
// Nothing leaves the browser: every file comes from this site.
let pyodide = null;
let ready = null;

async function boot() {
  const base = new URL("/", self.location.href).href;
  self.postMessage({ type: "status", text: "Loading Python (Pyodide)…" });
  const { loadPyodide } = await import(/* @vite-ignore */ `${base}pyodide/pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL: `${base}pyodide/` });
  self.postMessage({ type: "status", text: "Loading NLTK…" });
  await pyodide.loadPackage(["nltk"]);
  const files = [
    ["/nltk_data/sentiment/vader_lexicon.zip", "pyodide-data/vader_lexicon.zip"],
    ["/nltk_data/corpora/stopwords.zip", "pyodide-data/stopwords.zip"],
    ["/py/nltk_core.py", "pyodide-data/nltk_core.py"],
  ];
  for (const [path, url] of files) {
    const res = await fetch(base + url);
    if (!res.ok) throw new Error(`Missing ${url} (HTTP ${res.status})`);
    pyodide.FS.mkdirTree(path.slice(0, path.lastIndexOf("/")));
    pyodide.FS.writeFile(path, new Uint8Array(await res.arrayBuffer()));
  }
  await pyodide.runPythonAsync(`
import sys, json, nltk
nltk.data.path.insert(0, "/nltk_data")
sys.path.insert(0, "/py")
import nltk_core
nltk_core.analyze_text("warm up")
`);
  const version = pyodide.runPython("import nltk; nltk.__version__");
  self.postMessage({ type: "ready", nltk: version, pyodide: pyodide.version });
}

self.onmessage = async (e) => {
  try {
    ready ??= boot();
    await ready;
    if (e.data?.type === "analyze") {
      pyodide.globals.set("ticket_text", String(e.data.text || "").slice(0, 20000));
      const json = await pyodide.runPythonAsync("json.dumps(nltk_core.analyze_text(ticket_text))");
      self.postMessage({ type: "result", id: e.data.id, result: JSON.parse(json) });
    }
  } catch (err) {
    ready = null;
    self.postMessage({ type: "error", id: e.data?.id, message: String(err?.message || err).split("\n").slice(-2).join(" ") });
  }
};
