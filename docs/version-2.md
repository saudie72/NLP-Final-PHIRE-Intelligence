# Version 1 summary and the plan for version 2

## What version 1 delivers

- **Live app:** https://phire-intelligence.netlify.app · **Repository:** https://github.com/saudie72/NLP-Final-PHIRE-Intelligence
- Upload a PHIRE Excel export (or the synthetic demo), map columns, and get module and issue-area classification,
  keywords, similar and duplicate tickets, recurring issues, priority suggestions, a portfolio dashboard, search,
  an Excel report, a Resources page, and an optional "Ask the expert" chat with the assigned specialist.
- Held-out test results (synthetic): module 87.2% accuracy, issue area 91.2%, similar-ticket precision@5 0.955,
  clustering ARI 0.898 (`nlp/results.md`).
- Tests: parity 4/4, unit 34/34, chat function 6/6, chat UI 7/7, browser 45/45 on the live site.
- Requirements (`docs/requirements.md`), architecture (`docs/architecture.md`), ERP QA review
  (`docs/erp-qa-review.md`) and security review (`docs/security-review.md`).

## How version 1 was built (honest account)

The 16-agent team was defined first (steps 4–7): roles, skills, knowledge folders, models and personalities. The build
itself was carried out in the main Claude Code session **following each agent's instructions and skills**, with the
project owner approving every step. Agents were run as separate subagents for:

- Orchestrator routing tests and a whole-team ticket assessment (steps 5–6)
- ERP Functional Analyst knowledge-folder tests, five rounds (step 8)
- the packaged skill test on held-out tickets (step 9)

The ERP QA Developer's background review run stopped when the account reached its usage limit, so that review and the
security review were completed in the main session using the same agent instructions (both documents say so). The
guide's "run the experts in parallel through the Orchestrator" was therefore **not** how version 1 was built; version
2 should use it (see process improvements below).

## Version 2 backlog

Ordered by value. Owners are agent IDs from `docs/expert-roster.md`.

### Model and data

| # | Item | Why | Owner |
|---|---|---|---|
| 1 | Label generic access and environment tickets `SEC` / `PT`, or add module wording to them, in the generator | 23 of 32 module errors come from tickets whose text never names their module (`docs/erp-qa-review.md`) | data-engineer |
| 2 | More varied training phrasing for report requests, Integration Broker and performance tickets; retrain (never on test) | Main issue-area errors | data-engineer, nlp-specialist |
| 3 | Add explicit cues ("report showing", "message queue", "timing out") to the taxonomy tie-break table | Makes labels and rules consistent | erp-functional-analyst |
| 4 | Sentence embeddings for similarity, kept in the browser (small ONNX model) | TF-IDF misses paraphrases; duplicate precision is only 0.39 | nlp-specialist, software-architect |
| 5 | Confirm the real PHIRE value lists (modules, statuses, priorities, resolution codes) and update the generator | Several values are assumptions | erp-business-analyst |
| 6 | Evaluate on a sanitized, approved sample of real tickets in an approved environment | Synthetic accuracy overstates real accuracy | nlp-specialist, security-reviewer |

### App

| # | Item | Why | Owner |
|---|---|---|---|
| 7 | "Ask the expert" buttons on ticket rows and dashboard lists | The chat is easy to miss inside the drawer | frontend-developer |
| 8 | Compare two exports (this month vs last) for trends | Managers want change over time, not one snapshot | product-manager, frontend-developer |
| 9 | Let users correct a label and export the corrections as new training data | Turns review into model improvement | nlp-specialist, frontend-developer |
| 10 | Chat: daily request cap per visitor, and showing the cost per answer | Protects the owner's API credit beyond the password | backend-developer, security-reviewer |
| 11 | Larger demo dataset so more recurring issues appear (the 250-ticket demo shows 3) | Better demonstration | data-engineer |

### Team and process

| # | Item | Why | Owner |
|---|---|---|---|
| 12 | Add a **UX Designer** agent (wireframes, usability review) and a **DevOps** agent (Netlify, CI, monitoring) | The guide's example team has both; in v1 the Front-End Developer and the Software Architect / Security Reviewer covered them | meta-agent |
| 13 | Run version 2 through `@agent-orchestrator` with experts in parallel, peer reviews in parallel, and feedback rounds | Matches the guide's process | orchestrator |
| 14 | GitHub Actions running unit, parity and browser tests on every push | Catch regressions before Netlify deploys | devops (new), qa-tester |
| 15 | Re-run the registered-agent knowledge test (Q1 in `docs/agent-test-results.md`) in a fresh session | Confirms the "read knowledge first" fix with the registered agent | erp-qa-developer |
