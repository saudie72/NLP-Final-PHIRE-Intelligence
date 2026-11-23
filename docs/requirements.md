# Version 1 requirements

**Owner:** Product Manager (Devin), with the ERP Business Analyst (scope, stakeholders) and ERP Functional Analyst
(user stories). Written in the format of the `scope-and-stakeholder-requirements` and `requirements-and-acceptance`
skills. Every acceptance criterion is mapped to the test that verifies it.

> Note: this document was written after version 1 was built, to record the requirements the build followed (from the
> project plan, `docs/` research and the approved step prompts). See `docs/version-2.md` for how version 1 was built.

## 1. Scope

**Problem.** PeopleSoft support teams export PHIRE issues to Excel, but the export does not tell them which module and
kind of work a ticket really is, which tickets repeat, or where recorded priorities look wrong.

**Goal.** A public web app that turns a PHIRE Excel export into a classified, searchable, de-duplicated view of support
work, demonstrates real NLP with honest evaluation, and keeps ticket data on the user's device.

| In scope (v1) | Out of scope (v1) |
|---|---|
| Excel upload and column mapping | Writing back to PHIRE or PeopleSoft |
| Module and issue-area classification with confidence | Training on real PHIRE data |
| Keywords, similar / duplicate tickets, recurring issues | User accounts, saved workspaces |
| Priority suggestion vs. recorded priority | Notifications, scheduling |
| Dashboard with module-portfolio filter; ticket table and detail | Embedding-based similarity (v2) |
| Excel report export | Multi-file trend history |
| Resources page; optional "Ask the expert" chat | Chat history storage |

**Constraints.** Synthetic data only in the repository and public demo; analysis in the browser; deploy on Netlify;
no secrets in the repository; model evaluated on a held-out test set.

**Assumptions (to confirm).** Full PHIRE value lists for Module, Status, Priority and Resolution Code
(`docs/README.md`, open questions).

## 2. Stakeholders

| Stakeholder | Interest | Needs from v1 |
|---|---|---|
| ERP Manager (module portfolio, e.g. PY + TL + AM) | Workload, escalations, recurring cost | Portfolio dashboard, aging, priority disagreements, recurring issues |
| ERP Functional / Technical analysts | Triage and investigation | Classification with reasons, similar tickets, expert advice |
| Business owners (departments) | Fewer repeat problems | Recurring-issue list to justify permanent fixes |
| Security / data owners | Confidential ticket data | Nothing leaves the browser; synthetic demo; clear notices |
| Course instructor | Working NLP app built by an agent team | Live link, repository, evaluation, Resources page |

## 3. User stories and acceptance criteria

| ID | User story | Acceptance criteria (Given / When / Then) | Verified by |
|---|---|---|---|
| R1 | As a support analyst, I want to upload a PHIRE Excel export so that I don't retype data. | Given an .xlsx export, when I choose it or drop it, then the first sheet loads and rows are counted; given the demo button, then 250 synthetic tickets load. | `e2e.mjs` "demo file loads" |
| R2 | As an analyst, I want columns matched automatically so that renamed headers still work. | Given the 16 PHIRE headers, then all 16 map automatically; given renamed headers (e.g. "Ticket ID", "Short Description"), then they map by synonym; given no Title and no Description, then Analyze is disabled with a message. | `unit.test.js` column mapping; `e2e.mjs` "16/16 fields mapped" |
| R3 | As an analyst, I want each ticket classified by module and issue area with a confidence so that I can triage quickly. | Given analyzed tickets, then each has a predicted module, issue area (Functional / Technical / Security / Administration), confidence and deciding words; low confidence or a module that differs from PHIRE is flagged "Review". | `unit.test.js` analysis; `parity.test.js` |
| R4 | As the NLP owner, I want the browser to give the same answers as the trained model so that reported accuracy is real. | Given the exported model, then JS probabilities match scikit-learn within 0.001 and clusters are identical. | `parity.test.js` (4 tests) |
| R5 | As an analyst, I want similar and duplicate tickets so that I reuse earlier resolutions. | Given a ticket, then its 5 most similar tickets show with a score and kind (duplicate / related / similar); `IN…` references in the text link to those tickets. | `e2e.mjs` "5 similar" |
| R6 | As an ERP Manager, I want recurring issues grouped so that I can fund permanent fixes. | Given the file, then clusters of 3+ similar tickets are listed with keywords, module, area, dates and members. | `unit.test.js` recurring; `e2e.mjs` recurring |
| R7 | As an ERP Manager, I want suggested priorities so that I spot tickets recorded too high or too low. | Given ticket text, then H / M / L is suggested from the taxonomy cues with the cue shown; disagreements with PHIRE are listed. | `unit.test.js` priority |
| R8 | As an ERP Manager, I want to see only my module portfolio. | Given the dashboard, when I choose "Payroll · Time · Absence", then every tile, chart and list shows only PY, TL and AM. | `e2e.mjs` portfolio filter |
| R9 | As an analyst, I want to search and filter tickets. | Given the table, when I type words, then tickets matching all words in text or labels (issue area, module name, status, priority…) show; filters for module, area, status and flags combine. | `unit.test.js` search; `e2e.mjs` search |
| R10 | As a manager, I want an Excel report so that I can share results. | When I click Export, then an .xlsx downloads with the original columns plus AI columns, a Recurring Issues sheet and Run Info. | `e2e.mjs` export |
| R11 | As a security owner, I want ticket data to stay on the device. | During the full flow, then no request goes to another origin; the CSP restricts connections to the site itself. | `e2e.mjs` "no requests leave the site's origin"; `docs/security-review.md` |
| R12 | As an analyst, I want to ask the assigned expert about a ticket. | Given chat is on, when I open a ticket's "Ask the expert" tab, then the expert routed by issue area is preselected; sending requires the consent notice (and the password if set); the answer streams in. Given chat is off, then the tab says so and the rest of the app works. | `chat.test.js`; `e2e-chat.mjs`; `e2e.mjs` chat tab |
| R13 | As the instructor, I want a Resources page listing every link the project relies on. | The page lists the GitHub repository, the step-by-step guide, the official documentation for each library and service, project reports, evaluation results and the agent team; it is reachable from the main navigation. | `e2e.mjs` Resources |
| R14 | As any user, I want the app to work on a phone and in dark mode. | At 390 px width and in dark mode, every page renders with no horizontal scroll and no console errors. | `e2e.mjs` phone / dark |

## 4. Non-functional requirements

| Area | Requirement | Status |
|---|---|---|
| Accuracy | Report accuracy, precision, recall and F1 on a held-out test set; never tune on the test set | `nlp/results.md` |
| Performance | 250 tickets analyzed in a few seconds without freezing the page (Web Worker) | met |
| Security | CSP `connect-src 'self'`, no secrets in the repository, npm audit clean | `docs/security-review.md` |
| Accessibility | Keyboard focus visible, dialog closes with Escape, reduced-motion respected, semantic labels | met |
