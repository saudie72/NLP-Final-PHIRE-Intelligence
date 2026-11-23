# Software Architect reference notes

## Vite
- Web Workers: `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })` is bundled as a separate file.
- `build.assetsInlineLimit` controls base64 inlining of small assets; we set 0 so fonts stay files under a strict CSP.
- Sources: https://vite.dev/guide/features.html, https://vite.dev/config/build-options.html

## React
- Function components and hooks; state lives in App and flows down as props.
- Source: https://react.dev/learn

## Platform constraints (from the NLP Final guide research)
- Netlify runs Python only at build time; Functions are JS/TS/Go. Pyodide runs NLTK but not spaCy in the browser.
  Therefore: NLTK + spaCy in a build-time pipeline → static JSON; NLTK also live via self-hosted Pyodide.
- Sources: https://docs.netlify.com/functions/overview/, https://pyodide.org/en/stable/usage/packages-in-pyodide.html

## CSP for this design
- `connect-src 'self'` (data stays on site), `script-src 'self' 'wasm-unsafe-eval'` (Pyodide WebAssembly).
- Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
