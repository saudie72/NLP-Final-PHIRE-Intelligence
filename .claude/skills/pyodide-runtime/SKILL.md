---
name: pyodide-runtime
description: "Run Python (NLTK) in the browser with self-hosted Pyodide inside a Web Worker."
---

# pyodide-runtime

**Purpose:** Run Python (NLTK) in the browser with self-hosted Pyodide inside a Web Worker.

**Used by:** Front-End Developer, Pyodide Engineer

## Steps

1. Copy Pyodide core files from the pinned npm package; download needed wheels and verify SHA-256 against `pyodide-lock.json`.
2. In a module worker: `loadPyodide({ indexURL: '/pyodide/' })`, then `loadPackage(['nltk'])`.
3. Write NLTK data and `nltk_core.py` into the virtual FS with `pyodide.FS.writeFile`.
4. CSP needs `script-src 'self' 'wasm-unsafe-eval'`; serve `.mjs` as JavaScript and `.wasm` as `application/wasm`.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `app/scripts/copy-pyodide.mjs`
- `app/src/nltkWorker.js`
- `knowledge/pyodide-engineer/`
