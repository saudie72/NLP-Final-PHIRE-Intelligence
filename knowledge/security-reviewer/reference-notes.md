# Security Reviewer reference notes

## Content Security Policy
- `script-src` controls scripts; `'wasm-unsafe-eval'` allows WebAssembly compilation without allowing JavaScript
  `eval` (needed by Pyodide). `connect-src 'self'` limits fetch/XHR/WebSocket to the site.
- Sources: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src,
  https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html

## Common web risks
- OWASP Top 10: injection, broken access control, security misconfiguration, vulnerable components.
- Source: https://owasp.org/www-project-top-ten/

## Dependencies
- `npm audit` reports known vulnerabilities; fix or document each.
- Source: https://docs.npmjs.com/cli/v10/commands/npm-audit

## Supply chain for Pyodide
- Pyodide wheels are downloaded at build time and checked against SHA-256 hashes from `pyodide-lock.json`;
  nothing is loaded from a CDN at runtime.
