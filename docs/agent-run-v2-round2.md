# Version 2, round 2: agent team run

**Date:** 2026-11-24 · **Data:** synthetic only · **Plan:** the Orchestrator's round-2 list in
[`agent-run-v2-round1.md`](agent-run-v2-round1.md) · **Approved by:** project owner (pending)

Six specialists worked as separate subagents, four of them in parallel and two (spaCy follow-up, Front-End) after the
reviews they depended on. The main session coordinated, wrote a second hand-labelled gold set, and ran the QA and
security checks. **Rule for this round** (from the Orchestrator): every pattern or lexicon change must cite `docs/` or
official documentation; nothing may be chosen from the gold tickets; the gold set is re-scored once, at the end.

| # | Item | Agent | Outcome |
|---|---|---|---|
| 1 | Entity labelling guide (PPE, roles, Process Scheduler, PSPPYRUN, lowercase words) | `erp-qa-developer` | [`entity-labelling-guide.md`](entity-labelling-guide.md) |
| 2–3 | Fix ruler labels, case-sensitive page names, slash-date pattern, guide decisions | `spacy-expert` | `pipeline/patterns.py` changed, 6 new tests |
| 4 | Urgency cues tested on train/validation only | `nltk-expert` | Change tried and **rejected** (validation F1 fell) |
| 5 | Usability review of the Language page | `ux-designer` | [`usability-review-language.md`](usability-review-language.md), 10 findings |
| 5 | Apply the review's small fixes (L1–L8) | `frontend-developer` | `Language.jsx`, `styles.css` |
| – | Second gold set (30 unseen tickets, labelled to the guide) | main session | `pipeline/tests/gold_entities_v2.json` |

## ERP QA Developer: labelling guide

Decisions, each citing the PeopleSoft docs:

1. **PPE is not an entity.** In "PPE 05/13/2026" only the date is DATE; "PPE Date" is PS_FIELD only as a field name.
2. **Named roles are PS_ROLE** (Timekeeper, Payroll Inquiry, Security Administrator) when used as a role, not when
   they name a person doing something. The word "role(s)" is never labelled.
3. **Process Scheduler is PS_TOOL** (infrastructure); the processes it runs are PS_PROCESS. **PSPPYRUN is
   PS_PROGRAM**; PS_PROGRAM is widened to any single CAPS program token.
4. **Lowercase words** are labelled only when they are a specific PeopleSoft term ("federal withholding", "budget
   check"), not business words ("withholding", "deduction", "roles").

Decision 2 changes the gold scheme, so, as the Orchestrator required, a **new gold set** was written before re-scoring.

## spaCy Expert: pattern fixes

| Change | Justification |
|---|---|
| Process Scheduler → PS_TOOL (no duplicate) | `peoplesoft-technical.md`; guide decision 3 |
| PSPPYRUN → PS_PROGRAM (new `PROGRAMS` list) | `peoplesoft-technical.md` COBOL row; guide decision 3 |
| 21 page names that are also plain English (Roles, Voucher, Requisition, Timesheet …) match only in Title or UPPER case | Guide rule 3 and decision 4; spaCy docs: `LOWER` is case-insensitive, `TEXT` exact |
| DATE pattern for MM/DD/YYYY and M/D/YYYY | `phire-export-format.md` ("dates may arrive as text mm/dd/yyyy"); DATE matches the model's own label |
| Bare "PPE" / "Pay Period End" removed from PS_FIELD; "PPE Date" added | Guide decision 1 |
| "Payroll Inquiry", "Security Administrator" added to PS_ROLE | Guide decision 2 |

Training-set effect (1,000 tickets): lowercase "roles" as PS_PAGE 44 → 0; PS_FIELD 432 → 257 (mostly bare PPE);
slash dates now found. **Risks the agent reported:** lowercase page mentions ("the voucher") are no longer labelled;
PS_ROLE fires on role names used as job titles (a token pattern can't tell them apart); bare "withholding" and
"deduction" are still PS_FIELD (outside the request; listed for round 3).

## NLTK Expert: urgency cues (rejected)

The agent split the **training** set by template (20% validation, seed 42), checked the taxonomy's High cues, and
tried removing "error", "errors" and "cannot" (Technical cue words, not High cues):

| Set | Before P / R | After P / R |
|---|---|---|
| Validation (268 tickets) | 0.64 / 0.51 (F1 0.566) | 0.77 / 0.43 (F1 0.553) |
| 10 template splits, mean F1 | 0.570 | 0.574 |
| Test set, measured once (87 H) | 0.53 / 0.58 (F1 0.550) | 0.54 / 0.51 (F1 0.521) |

Precision rose, recall fell, and validation F1 dropped, so the **coordinator kept the original list** (the rule is to
change only what helps on validation). Other findings: taxonomy cues such as "outage" and "payroll deadline" never
occur in the training text, so they can't be validated; about 37% of H tickets have no urgency cue at all (access
requests, patches), which caps a word-list approach near 0.6 recall.

## UX Designer and Front-End Developer: Language page

Top findings (severity 3): the priority table's last column was cut off and its scroll area not keyboard-reachable; the
faint text colour was about 3.6:1 contrast (WCAG AA needs 4.5:1); the sentiment bars relied on red vs green only; the
Entity accuracy panel had no plain-language reading. All findings marked small (L1–L8) were applied:
shorter wrapping headers and keyboard-focusable table regions; light-theme `--ink-3` darkened to about 5.7:1 (affects
the whole app); visible "% neg / neu / pos" text and a darker neutral bar; a plain-English sentence above the Entity
accuracy table with every number read from the data; table captions and `scope`; consistent "mean sentiment (VADER
compound)" wording; darker NLTK/spaCy badge colours; external links announced to screen readers. L9 (in-page
navigation) and L10 (reset button) are left for later.

## Entity evaluation: two gold sets

| Gold set | Pipeline | Precision | Recall | F1 |
|---|---|---|---|---|
| v1 (seed 2026, 112 entities, seen in round 1) | Model alone | 0.23 | 0.07 | 0.11 |
| v1 | Ruler, round 1 | 0.69 | 0.62 | 0.65 |
| v1 | Ruler, round 2 | 0.86 | 0.74 | 0.80 |
| **v2** (seed 2027, 103 entities, **unseen**) | Model alone | 0.26 | 0.11 | 0.15 |
| **v2** | **Ruler, round 2** | **0.82** | **0.83** | **0.83** |

v1 rose a lot, but it was used to find round-1 errors, so treat that gain with care; **v2 is the honest number**.
Per label on v2: DATE F1 0.23 → 0.89 thanks to the slash-date pattern; PS_PAGE 0.95; PS_FIELD 0.64 (false positives:
"encumbrance", "payable time", bare "withholding"); PS_ROLE 0.00 ("AP Processor" is not in the role list, and "Security
Administrator" was tagged where the guide says not to). Ruler coverage on the 250 demo tickets fell from 89% to 85%,
because lowercase page words and bare PPE are no longer counted; precision is what improved.

## Verification

| Check | Result |
|---|---|
| Pipeline rebuild | 250 tickets in 3.4 s, ruler coverage 85% |
| Pipeline tests (pytest) | 23/23 |
| Unit, parity, chat-function tests (Vitest) | 34/34 |
| Browser end-to-end, production CSP, desktop + phone | 68/68 |
| Chat UI end-to-end (fake model) | 7/7 |
| No request leaves the site's origin; no real data in the repository | pass |

## Round 3 candidates (not started)

| Item | Owner |
|---|---|
| Remove bare "withholding", "deduction", "encumbrance" from PS_FIELD (guide decision 4) | spacy-expert |
| Add delivered role names from PeopleBooks (e.g. AP Processor) to PS_ROLE; restrict role patterns to role context ("holding", "add", "remove") | spacy-expert, peoplesoft-admin |
| Add taxonomy High cues that the generator never produces (outage, payroll deadline) to the synthetic training phrasing, then re-test urgency | data-engineer, nltk-expert |
| L9 in-page navigation and L10 reset button on the Language page | frontend-developer, ux-designer |
| Write a third gold set before re-scoring round 3 | erp-qa-developer |
