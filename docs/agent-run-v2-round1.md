# Version 2, round 1: agent team run

**Date:** 2026-11-24 · **Data:** synthetic only (`data/synthetic/`) · **Approved by:** project owner (pending)

This is the first round of version 2 run the way the guide describes: specialists working **in parallel** as separate
subagents, the main session verifying their work with the QA Tester and Security Reviewer checks, and the
**Orchestrator** consolidating the results and planning the next round. Each section below summarises the agent's own
report; nothing was changed to make the numbers look better.

| Backlog item (`docs/version-2.md`) | Agent | Files changed |
|---|---|---|
| 4b PeopleSoft-tuned sentiment lexicon | `nltk-expert` | `pipeline/nltk_core.py`, `pipeline/tests/test_pipeline.py` |
| 4a Extend the EntityRuler | `spacy-expert` | `pipeline/patterns.py`, `pipeline/tests/test_pipeline.py` |
| 4a Hand-labelled entity evaluation | main session (coordinator) | `pipeline/eval_entities.py`, `pipeline/tests/gold_entities.json`, `pipeline/build_nlp.py`, `app/src/components/Language.jsx` |
| 12 UX Designer agent | `meta-agent` | `.claude/agents/ux-designer.md`, `.claude/skills/usability-review/`, `knowledge/ux-designer/`, roster, brains, `CLAUDE.md`, orchestrator |

Rules given to every agent: read your knowledge folder first; use the training set to choose words or patterns and the
test/demo set only for the final measurement; do not run the build, do not commit, do not touch another agent's files.

## NLTK Expert: PeopleSoft lexicon for VADER

**Change.** `PEOPLESOFT_LEXICON` in `nltk_core.py` (applied with `SentimentIntensityAnalyzer.lexicon.update`):

- 16 words set to 0 because they are PeopleSoft subject matter or boilerplate, not emotion: pay, po, security, save,
  effective, value, values, support, approved, approval, create, created, attachment, please, rescue, fire ("Fire
  Rescue" is a department). Chosen by frequency in the **training** set (for example please 564, save 234, pay 221).
- 9 problem words added or strengthened from the taxonomy's urgency vocabulary: queued −1.5, abend −2.0, abended −2.0,
  stuck −2.0, outage −2.0, cannot −1.5, incorrect −1.5, discrepancy −1.2, locked −1.0.
- `vader_drivers` skips zero-valence words, so neutralised words no longer show as drivers.

**Result** (250 test/demo tickets, 87 H):

| | Stock VADER | With lexicon |
|---|---|---|
| Labels positive / neutral / negative | 122 / 34 / 94 | 13 / 119 / 118 |
| "negative" as an H signal: precision / recall | 0.37 / 0.40 | 0.33 / 0.45 |
| Mean compound H / M / L | +0.023 / +0.020 / +0.196 | −0.201 / −0.282 / −0.120 |

**Conclusion (agent's own).** Tone labels are now plausible, but VADER is still not a priority predictor: H and M are
not separated. Treat VADER as descriptive tone only; urgency terms and the rule-based priority stay the stronger signals.

**Risks noted.** Template-generated text may make the word list overfit; "please" and "approved" lose genuine signal;
"locked", "cannot", "incorrect" are always negative, even in how-to requests.

## spaCy Expert: EntityRuler extension

**Change.** New labels `PS_FIELD` (Earnings Code, TRC, Workgroup, PPE, W-2, 1099, Action Reason, ChartField, Supplier,
Permission List …) and `PS_ROLE` (Timekeeper, Recruiter, Hiring Manager, Buyer, Approver); more `PS_TOOL` (PUM, IB, XML
Publisher, Tuxedo, WebLogic, Query Manager …) and `PS_PAGE` terms; module codes labelled only in code context ("PY
module", "module: TL"). Every term comes from `docs/peoplesoft-modules.md`, `docs/peoplesoft-technical.md`,
`docs/peoplesoft-security.md` or Oracle PeopleBooks, none from ticket files.

**Result** (250 demo tickets):

| Measure | Before | After |
|---|---|---|
| Tickets with at least one PeopleSoft object | 76.8% | 89.2% |
| PS_FIELD / PS_ROLE entities | 0 / 0 | 147 / 7 |
| Model ORG / PERSON / GPE errors and labels | 129 / 32 / 17 | 76 / 20 / 15 |

**Remaining model errors (agent's categories).** Department words as PERSON (Parks, Mockup); business-unit codes as
GPE/ORG (TR, HR, SO) when not written "BU XX"; slash dates as FAC/PRODUCT/PERSON; status words as entities
("Requesting" as GPE); generic words as DATE (year-end, annual).

## Coordinator: hand-labelled entity evaluation (item 4)

30 demo tickets (9 Functional, 9 Technical, 6 Security, 6 Administration; seed 2026) were labelled by hand from the
text before looking at spaCy's output: 112 entities, 12 labels (`pipeline/tests/gold_entities.json`).
`pipeline/eval_entities.py` scores exact text + label; the build adds the section to
`reports/nlp-language-evaluation.md` and the app shows it as the **Entity accuracy** panel on the Language page.

| Pipeline | Precision | Recall | F1 |
|---|---|---|---|
| en_core_web_sm alone | 0.23 | 0.07 | 0.11 |
| Ruler (round-0 patterns) + model | 0.74 | 0.55 | 0.63 |
| Ruler (round-1 patterns) + model | 0.69 | 0.62 | 0.65 |

Most frequent wrong predictions: "PPE" as PS_FIELD, "roles" as PS_PAGE, "Process Scheduler" as PS_PROCESS (gold:
PS_TOOL), "PSPPYRUN" as PS_TOOL (gold: PS_PROGRAM). DATE recall is 0.08: the model misses slash dates. These were
**not** fixed in this round, because fixing them from the 30 gold tickets would be tuning on the evaluation set.

## Meta Agent: UX Designer

Added `ux-designer` (Noor, Sonnet) with the `usability-review` skill (Nielsen's heuristics + WCAG 2.2) and a knowledge
folder with public sources; updated `docs/expert-roster.md`, `docs/agent-brains.md`, `CLAUDE.md` and the
Orchestrator's routing table. Team: **21 agents, 34 skills**. All agent and skill files parse as YAML with the required
fields (checked by the coordinator with a parser, which the meta-agent could not run).

## Verification (QA Tester and Security Reviewer checks, run in the main session)

| Check | Result |
|---|---|
| `pipeline/build_nlp.py` (full rebuild) | 250 tickets in 2.9 s, ruler coverage 89% |
| Pipeline tests (pytest) | 18/18 |
| Unit, parity and chat-function tests (vitest) | 34/34 |
| Browser end-to-end (Playwright, production CSP, desktop + phone) | 68/68, including the new Entity accuracy panel |
| Chat UI end-to-end (fake model) | 7/7 |
| No request leaves the site's origin | pass |
| No real PHIRE data or file names in the repository | pass |

## Orchestrator consolidation (Marisol)

**Summary.** Round 1 delivered three backlog items with all tests green. Ruler coverage rose from 76.8% to 89.2%; on
the gold set recall rose more than precision fell (F1 0.63 → 0.65). The lexicon makes tone plausible but is not a better
H-priority signal. The team is now 21 agents and 34 skills.

**Observations: where specialist work and the gold set disagree**

| Disagreement | Evidence | Resolve with |
|---|---|---|
| "PPE" labelled PS_FIELD; the gold set doesn't label it | `docs/peoplesoft-modules.md` lists PPE as Time and Labor vocabulary: a labelling-scheme conflict, not clearly a ruler error | erp-qa-developer, spacy-expert |
| "Process Scheduler" as PS_PROCESS | `docs/peoplesoft-technical.md` describes it as infrastructure that runs processes: the docs side with the gold (PS_TOOL) | spacy-expert, peoplesoft-admin |
| "PSPPYRUN" as PS_TOOL | The docs list it as a COBOL program: PS_PROGRAM | spacy-expert, erp-developer |
| "roles" as PS_PAGE | Generic lowercase word matching a page pattern | spacy-expert, peoplesoft-admin |
| DATE recall 0.08 | The model misses MM/DD/YYYY | spacy-expert |
| H precision fell with the lexicon | Measured above | nltk-expert, erp-manager |

**Hypotheses (not confirmed).** PS_FIELD precision (0.19) is low mainly because the field list holds broad business
words ("withholding", "deduction"). H precision fell because negative wording reflects the type of problem, not its
urgency.

**Recommended round 2**

| # | Item | Owners |
|---|---|---|
| 1 | Decide the gold scheme for PPE and roles; write a short labelling guide | erp-qa-developer, spacy-expert |
| 2 | Move Process Scheduler to PS_TOOL and PSPPYRUN to PS_PROGRAM; limit generic lowercase words to clear page context | spacy-expert, peoplesoft-admin |
| 3 | Add a DATE pattern for MM/DD/YYYY | spacy-expert |
| 4 | Keep the lexicon for tone only; test urgency cues on train/validation only | nltk-expert, erp-manager |
| 5 | Usability review of the Entity accuracy panel and the sentiment display | ux-designer |

**Rule for round 2.** Every pattern or lexicon change must cite `docs/` (or Oracle PeopleBooks recorded there); a fix
justified only by the 30 gold tickets is not accepted. Re-score the gold set once, after the changes, and report it as
indicative. If the label scheme changes, write a new gold set before re-scoring.
