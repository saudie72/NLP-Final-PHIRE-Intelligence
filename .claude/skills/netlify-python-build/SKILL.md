---
name: netlify-python-build
description: "Run Python at Netlify build time (NLTK + spaCy pipeline) before the Node build."
---

# netlify-python-build

**Purpose:** Run Python at Netlify build time (NLTK + spaCy pipeline) before the Node build.

**Used by:** Software Architect, Netlify Engineer

## Steps

1. Set `PYTHON_VERSION` and `NODE_VERSION` in `[build.environment]`.
2. Build command: `python3 -m pip install -r ../pipeline/requirements.txt && python3 ../pipeline/build_nlp.py && npm ci && npm run build`.
3. Netlify runs Python only during the build; Netlify Functions do not run Python.
4. Reproduce the build in a clean clone before pushing; read the deploy log for failures.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `netlify.toml`
- `knowledge/netlify-engineer/`
