// Runs the analysis off the main thread so the page stays responsive. Ticket text never leaves the browser.
import { analyze } from "./engine/analyze.js";

self.onmessage = (e) => {
  const { tickets, model } = e.data;
  try {
    const result = analyze(model, tickets, { onProgress: (p) => self.postMessage({ type: "progress", value: p }) });
    self.postMessage({ type: "done", result });
  } catch (err) {
    self.postMessage({ type: "error", message: err.message });
  }
};
