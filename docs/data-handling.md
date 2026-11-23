# 8. Data handling and security

## Why real PHIRE data is confidential

PHIRE issues are written by and about employees. In real exports, Title and Description can contain:

- employee and requester **names**, **employee IDs** and **user IDs**,
- **payroll** details (amounts, garnishments, tax, direct deposit),
- **benefits and absence** details (dependents, FMLA, medical leave),
- **security** details (roles, who has access to what),
- references to attachments with more of the above,
- internal system names, business unit codes and process schedules.

Even with names removed, operational detail can still identify people or expose how systems are secured.

## Rules for this project

1. **Only synthetic data is committed, deployed or shared.** The real sample export was used once to learn
   the column layout. It is not stored in this repository, and no text, names or ticket numbers from it
   appear here.
2. `.gitignore` blocks `.xlsx`, `.xls`, `.xlsm` and `.csv` files everywhere except `data/synthetic/`.
3. No real ticket text goes into prompts, agent knowledge folders, issues or commit messages.
4. Evaluating real PHIRE records is out of scope for the public deployment. It should only happen in an
   environment approved under the organization's data-handling policy, or on a sanitized dataset the data
   owner has approved.

## Browser-local processing

The deployed application processes uploaded spreadsheets **entirely in the browser**:

- The Excel file is read with a client-side library (SheetJS) via the File API. It is never uploaded.
- The NLP model is a static JSON file; classification, similarity and clustering run in JavaScript.
- The Excel report is generated in the browser and saved by the user.
- No analytics, no third-party scripts that receive page content, no server-side storage.

How the QA Tester and Security Reviewer will verify this:

- Load the app, upload the demo file, and confirm in the browser's Network panel that **no request carries
  ticket content** (only the page's static assets load).
- Set a strict **Content-Security-Policy** in `netlify.toml` (`connect-src 'self'`) so the page cannot send
  data anywhere else even by mistake.
- If an optional Claude-powered "ask the ERP specialists" feature is added later, it must be **off by
  default**, clearly labeled as sending text to an external service, and keep the API key server-side in a
  Netlify Function. It would never be used with real data on the public site.

## Secrets

No API keys in the repository or the front-end bundle. `.env` files are git-ignored. Netlify environment
variables hold any key that a function needs.
