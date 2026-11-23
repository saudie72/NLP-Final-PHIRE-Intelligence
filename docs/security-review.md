# Security review: version 1

**Reviewer:** Security Reviewer (Nadia), following `.claude/agents/security-reviewer.md` and `docs/data-handling.md`.
Every item below was checked by running a command or a test, not by reading the code alone.

> Process note: the background agent runs were stopped by the account's usage limit, so this review was carried out in
> the main session using the Security Reviewer's checklist.

## Verdict

**Signed off for deployment** of version 1 to Netlify with synthetic data. No open high or critical findings.
Re-reviewed after the "Ask the expert" chat was added (checks 15–21) and after NLTK/spaCy and Pyodide were added (checks 22–24).

## Checks

| # | Check | How it was verified | Result |
|---|---|---|---|
| 1 | No spreadsheets outside `data/synthetic/` in the repository | `git ls-files` for `.xlsx/.xls/.xlsm/.csv` | ✅ none |
| 2 | Real exports, `.env` files and the built demo copy are git-ignored | `git check-ignore` on sample paths | ✅ all ignored |
| 3 | No secrets in the repository | pattern search for API keys, AWS keys, private keys | ✅ none |
| 4 | No text from the real sample export | search for its names, system names and report names | ✅ none |
| 5 | Ticket content never leaves the browser | Playwright records every request during the full flow (upload, analyze, drawer, export) on desktop and phone | ✅ 0 requests to other origins |
| 6 | Content-Security-Policy enforced | `netlify.toml` headers served by `app/tests/serve-with-headers.mjs`; full browser suite run under them | ✅ 39/39 checks, no CSP violations |
| 7 | CSP is strict | `default-src 'self'; script-src 'self'; connect-src 'self'; font-src 'self'; worker-src 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'none'` | ✅ |
| 8 | No third-party scripts, fonts or analytics | fonts bundled with the app (`@fontsource`); Vite emits fonts as files (`assetsInlineLimit: 0`) | ✅ |
| 9 | No dangerous DOM sinks | search for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` in `app/src` | ✅ none; React escapes all ticket text |
| 10 | Browser storage holds no ticket data | `localStorage` keys: theme, portfolio choice, column mapping (header names only) | ✅ |
| 11 | Dependencies | `npm audit` (production and development) | ✅ 0 vulnerabilities after upgrading Vite to 6.4.6 and Vitest to 5.1.1 |
| 12 | Excel parser | SheetJS 0.20.3 from the vendor's CDN (the npm registry copy is outdated and has known issues) | ✅ |
| 13 | Excel export cannot create formulas from ticket text | SheetJS `json_to_sheet` writes text cells as strings, not formulas | ✅ |
| 15 | API key never reaches the browser | key read only in `netlify/functions/chat.mjs` from the server environment; the browser bundle contains only the variable *name* in the "not switched on" help text (`grep` of `dist/`) | ✅ |
| 16 | Chat off without a key | function returns 503 and the UI shows "not switched on"; browser test on desktop and phone | ✅ |
| 17 | Optional password gate | constant-time comparison of SHA-256 hashes; unit test and browser test with a wrong password (401) | ✅ |
| 18 | Input limits | known experts only, user/assistant roles only, alternating turns, 2,000 characters per message, last 16 turns, ticket fields clipped | ✅ unit tests |
| 19 | Consent before sending ticket text | the first message is blocked until the notice is ticked; browser test | ✅ |
| 20 | Chat stays same-origin | browser test with chat on: 0 requests to other origins; CSP unchanged | ✅ |
| 21 | Chat answers rendered safely | plain-text rendering (paragraphs, bullets, bold) without HTML; no `innerHTML` | ✅ |
| 22 | Pyodide is self-hosted | Pyodide core from the pinned npm package; NLTK wheels downloaded at build time and verified against SHA-256 in `pyodide-lock.json`; no CDN at runtime | ✅ |
| 23 | CSP change for Pyodide | only `'wasm-unsafe-eval'` added to `script-src` (WebAssembly compilation, not JavaScript eval); browser tests run under it | ✅ 68/68 |
| 24 | Live NLTK keeps data local | the worker fetches only same-origin files; browser test: 0 requests to other origins | ✅ |
| 14 | Other headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Cross-Origin-Opener-Policy` | ✅ |

## Findings fixed during review

| Finding | Severity | Fix |
|---|---|---|
| Vite inlined small font files as `data:` URLs, which the CSP blocks (found only when testing under the production headers) | Medium (broken fonts) | `assetsInlineLimit: 0` in `vite.config.js`; CSP left strict |
| Build and test tools had known advisories (Vite ≤ 6.4.3, Vitest / tinypool) | High (build machine only, never shipped) | Upgraded to Vite 6.4.6 and Vitest 5.1.1 |

## Residual risks (accepted for version 1)

- **Chat sends the discussed ticket to Anthropic's API** when the owner turns it on. Mitigated by the consent notice,
  the synthetic-data rule, the optional password and sending one ticket at a time. Costs are billed to the owner's key.

- **Users may upload real PHIRE exports to the public site.** Processing stays in their browser, but the start page and
  Resources page tell users to use synthetic or approved data only. Organizations should evaluate real data in an
  approved environment.
- **`style-src 'unsafe-inline'`** is needed for React inline style attributes (chart widths, colours). It does not allow
  scripts; the risk is limited to CSS injection, and ticket text is never placed in style attributes.
