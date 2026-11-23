# Netlify reference notes

Notes from the official Netlify documentation for this project's build and deploy.

## netlify.toml
- File-based configuration overrides UI build settings. `[build]` sets `base` (`app`), `command`, `publish` (`dist`,
  relative to base). `[build.environment]` sets environment variables for the build, such as `NODE_VERSION` and
  `PYTHON_VERSION`.
- `[functions]` sets the functions `directory` (relative to base) and `node_bundler = "esbuild"`.
- `[[headers]]` and `[[redirects]]` set response headers (our CSP) and the SPA fallback.
- Sources: https://docs.netlify.com/configure-builds/file-based-configuration/,
  https://docs.netlify.com/routing/headers/, https://docs.netlify.com/routing/redirects/

## Python at build time
- Netlify's build image can run Python during the build; the version is chosen with `PYTHON_VERSION`.
- Install dependencies explicitly in the build command (`python3 -m pip install -r ../pipeline/requirements.txt`).
- Netlify Functions run JavaScript/TypeScript (and Go), not Python, so Python work must happen at build time and
  be saved as static files. This is why NLTK and spaCy run in `pipeline/build_nlp.py` before `npm run build`.
- Sources: https://docs.netlify.com/configure-builds/manage-dependencies/, https://docs.netlify.com/functions/overview/

## Environment variables
- Secrets (the optional `ANTHROPIC_API_KEY`, `APP_PASSWORD`) go in the Netlify UI, marked as secret, never in
  `netlify.toml` or the repo.
- Source: https://docs.netlify.com/configure-builds/environment-variables/

## Functions
- Every file in the functions directory becomes a function; names may only contain letters, numbers, hyphens and
  underscores. Keep helper/generated modules outside (we use `app/netlify/lib/`).
- A v2 function can declare its route with `export const config = { path: "/api/chat" }`.
- Source: https://docs.netlify.com/functions/overview/

## Troubleshooting
- Read the deploy log from the first error; reproduce the exact build command in a clean clone.
- Source: https://docs.netlify.com/configure-builds/troubleshooting-tips/
