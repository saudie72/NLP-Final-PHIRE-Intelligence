---
name: netlify-deployment
description: "Configure the build, headers and Content-Security-Policy and deploy to Netlify after security sign-off."
---

# netlify-deployment

**Purpose:** Publish version 1 safely.

**Used by:** Software Architect, Front-End Developer, Security Reviewer

**Inputs:** The built app.

## Steps

1. netlify.toml: build command, publish directory, SPA redirect.
2. Headers: CSP with connect-src 'self', X-Content-Type-Options, Referrer-Policy, frame-ancestors.
3. Run tests and get security-reviewer sign-off before deploying.
4. Record the live URL in README.md.

## Output

Live URL.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/data-handling.md`
