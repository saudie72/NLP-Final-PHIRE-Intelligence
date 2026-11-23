# Pyodide reference notes

Notes from the official Pyodide documentation. Version: **Pyodide 0.29.5** (Python 3.13), npm package `pyodide`.

## Loading
- `const { loadPyodide } = await import(".../pyodide.mjs"); const pyodide = await loadPyodide({ indexURL })`.
  `indexURL` is where `pyodide.asm.wasm`, `pyodide.asm.js`, `python_stdlib.zip` and `pyodide-lock.json` live.
- `pyodide.runPython(code)` / `await pyodide.runPythonAsync(code)` run Python; `pyodide.globals.set(name, value)`
  passes values in.
- Sources: https://pyodide.org/en/stable/usage/quickstart.html, https://pyodide.org/en/stable/usage/api/js-api.html

## Packages
- `await pyodide.loadPackage(["nltk"])` installs packages built for Pyodide; dependencies (`regex`, `sqlite3`)
  come from `pyodide-lock.json`, which lists each wheel's `file_name` and `sha256`.
- `nltk` is in the official Pyodide package set; **spaCy is not**, which is why spaCy runs only at build time.
- Sources: https://pyodide.org/en/stable/usage/loading-packages.html, https://pyodide.org/en/stable/usage/packages-in-pyodide.html

## Self-hosting
- Pyodide can be served from your own site: copy the core files and the needed wheels next to each other and
  point `indexURL` there. This project does it in `app/scripts/copy-pyodide.mjs`, verifying SHA-256 hashes.
- Source: https://pyodide.org/en/stable/usage/downloading-and-deploying.html

## Files
- Pyodide has an in-memory file system (Emscripten FS): `pyodide.FS.mkdirTree(dir)`, `pyodide.FS.writeFile(path, bytes)`.
  We write `vader_lexicon.zip`, `stopwords.zip` and `nltk_core.py` there, then add `/nltk_data` to `nltk.data.path`.
- Source: https://pyodide.org/en/stable/usage/file-system.html

## Web Worker
- Run Pyodide in a Web Worker so the page never freezes; post text in, results out.
- Source: https://pyodide.org/en/stable/usage/webworker.html

## Browser requirements we found
- CSP must allow WebAssembly compilation: `script-src 'self' 'wasm-unsafe-eval'`.
- Serve `.mjs` as JavaScript and `.wasm` as `application/wasm`, or the module import fails ("Failed to fetch
  dynamically imported module").
- First load is about 14 MB (cached afterwards); startup takes a few seconds.
