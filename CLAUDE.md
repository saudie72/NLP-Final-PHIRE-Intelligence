# PeopleSoft PHIRE Ticket Intelligence

An NLP application that analyzes PeopleSoft HCM 9.2 / FSCM 9.2 support tickets exported from PHIRE to Excel:
it classifies each ticket by **module** and **issue area** (Functional, Technical, Security, Administration),
extracts keywords, finds similar and duplicate tickets, groups recurring issues, suggests priority, shows a
dashboard, and exports an Excel report. It is built by a team of 16 Claude Code agents and deployed on Netlify.

## Data-handling rules (non-negotiable)

- **Synthetic data only.** Only files in `data/synthetic/` may be committed, used for training, or used in the
  public app. `.gitignore` blocks spreadsheets everywhere else.
- **Never** copy real PHIRE ticket text, names, employee IDs, user IDs or ticket/CR numbers into any file,
  prompt, agent knowledge folder, issue or commit message. If real data appears, stop and tell the user.
- Ticket analysis runs **in the browser**. Nothing may send ticket content to a server or third party.
- Details: [`docs/data-handling.md`](docs/data-handling.md).

## Repository layout

| Path | What it holds |
|---|---|
| `docs/` | Research the agents rely on; start at [`docs/README.md`](docs/README.md) |
| `docs/expert-roster.md` | The 16 agents, their jobs, deliverables and skills |
| `.claude/agents/` | One subagent file per agent |
| `.claude/skills/` | 26 shared skills, one folder each with `SKILL.md` |
| `knowledge/<agent-id>/` | Each agent's own documents, read before every answer (synthetic or public material only) |
| `docs/agent-brains.md` | Each agent's model, name and personality |
| `data/synthetic/` | Synthetic PHIRE exports: train (1,000), test (250), demo (250); see its README |
| `scripts/make_synthetic.py` | Synthetic data generator (fixed seed) |
| `exports/` | Claude skill zip for the app (`scripts/build_skill_zip.py`); see its README |
| `sdk/` | Agent SDK demo script (synthetic data only, `--dry-run` needs no key); see its README |
| `nlp/` | Model training and evaluation (`train.py`, `results.md`, parity fixture) |
| `app/` | React app (Vite); `src/engine/` is the in-browser NLP engine, `public/model/model.json` the exported model |

## The team

| Group | Agents (`@agent-<id>`) |
|---|---|
| Project management and coordination | `orchestrator`, `product-manager`, `erp-manager`, `meta-agent` |
| PeopleSoft ERP specialists | `erp-business-analyst`, `erp-functional-analyst`, `erp-developer`, `peoplesoft-admin`, `erp-qa-developer` |
| Application development and NLP | `software-architect`, `nlp-specialist`, `data-engineer`, `frontend-developer`, `backend-developer`, `qa-tester`, `security-reviewer` |

Two analyst roles are separate on purpose: **erp-business-analyst** owns business cases, stakeholder
requirements, process maps and scope; **erp-functional-analyst** owns functional specifications, user stories and
acceptance criteria, system configuration and UAT support. The **erp-manager** oversees a portfolio of related
modules (for example Payroll, Time and Labor and Absence Management).

Two QA roles are separate on purpose: **erp-qa-developer** checks whether ticket labels and conclusions are
right from a PeopleSoft point of view; **qa-tester** checks whether the application works.

## How to use the team

- **Ask the whole team** — start with the Orchestrator, which picks the smallest set of specialists and returns
  one combined answer:
  `@agent-orchestrator Assess this synthetic ticket: "Time Administration has been in Queued since last night and approvers can't see payable time."`
- **Ask one expert** — mention the agent directly:
  `@agent-erp-functional-analyst Which module and issue area is "Need a new Action Reason for voluntary demotion"?`
- **Change the team** — ask the Meta Agent:
  `@agent-meta-agent Add a Grants specialist agent and update the roster.`

Every agent answers with **Observations** (what the ticket says) kept separate from **Hypotheses** (what to
investigate). No agent claims a root cause from ticket text alone.

## Build process

The project follows a 12-step plan. Each step is reviewed and approved by the project owner before the next
one starts, and nothing is deployed to Netlify until the app step is approved. Commit to `main` only after
approval.

## Conventions

- Module codes and taxonomy: [`docs/peoplesoft-modules.md`](docs/peoplesoft-modules.md), [`docs/ticket-taxonomy.md`](docs/ticket-taxonomy.md).
- NLP methods and evaluation: [`docs/nlp-methods.md`](docs/nlp-methods.md). Never tune on the test set.
- Items marked "to confirm" in the docs are assumptions; do not present them as facts.
