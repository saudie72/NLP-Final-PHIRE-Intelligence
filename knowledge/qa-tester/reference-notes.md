# QA Tester reference notes

## Vitest
- Unit and parity tests: `npm test` (runs `vitest run`).
- Source: https://vitest.dev/guide/

## Playwright
- Browser flows with `page.getByTestId`, `waitForSelector`; block requests with `page.route(pattern, r => r.abort())`
  to test fallbacks (worker blocked, demo blocked).
- Source: https://playwright.dev/docs/network

## pytest
- `python3 -m pytest pipeline/tests -q` covers NLTK tokenizing, VADER labels, urgency terms, collocations, the
  EntityRuler, noun chunks and pipeline outputs.

## Always test under the production headers
- `app/tests/serve-with-headers.mjs` applies netlify.toml headers and correct MIME types (.mjs, .wasm).
