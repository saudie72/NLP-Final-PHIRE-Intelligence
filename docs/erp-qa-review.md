# ERP QA review of misclassified test tickets

**Reviewer:** ERP QA Developer (Lucia), following `.claude/agents/erp-qa-developer.md`, `docs/ticket-taxonomy.md` and
`docs/peoplesoft-modules.md`. **Input:** the misclassified tickets listed in `nlp/results.md` with their full text from
`data/synthetic/phire_test.csv`. All tickets are synthetic.

> Process note: the background agent run for this review stopped when the account reached its usage limit, so the
> review was completed in the main session using the same agent instructions and the taxonomy tie-break rules.

## Summary

| Classifier | Errors | Model wrong | Label not recoverable from the text | Model more defensible than the label | Ambiguous |
|---|---|---|---|---|---|
| Module | 32 | 9 | 19 | 4 | 0 |
| Issue area | 22 | 17 | 0 | 0 | 5 |

## Observations

1. **Generic security and administration tickets carry a business module the text never mentions** (23 of 32 module errors).
   Examples: IN001006 "Terminate user access … Disable SYNUSER0710" is labelled `PY`; IN001258 "Patch CFG" is labelled `PY`;
   IN001046 "Need TST refreshed" is labelled `PT` but predicted `PY`. No PeopleSoft analyst could recover these modules from the
   wording. For IN001006 and IN001198 the model's `SEC` is what `docs/peoplesoft-modules.md` prescribes when no business module
   can be identified, so the **label** is the weaker answer.
2. **Report requests read as Functional** (6 issue-area errors, template "Report request - <field> by <department>").
   The taxonomy says a new report, query or interface is **Technical**; the label is right and the model is wrong. The training
   phrasing ("Create a new SQR / BI Publisher report…") names the tool, the test phrasing does not.
3. **Integration Broker and performance tickets drift to Technical/Functional** (7 errors: "IB errors for <object>",
   "System very slow"). Under the taxonomy these are **Administration** ("messages in error", "timing out"). The object
   names in the text ("Job Data save PeopleCode") pull toward Technical.
4. **Vague functional complaints are genuinely ambiguous** (5 errors): "We are having trouble with encumbrance. The blanket
   PO is not coming out right" and "Need a bulk change for job row records". These could be configuration, a data fix or a
   defect; an analyst would ask a follow-up question before labelling.
5. **Module errors on tickets with real module wording are few** (9 of 32), for example IN001289 "PS Query … rating information by Review Period" (`EP`, predicted `GL`).

## Hypotheses (to check in version 2)

- The test phrasing bank omits the tool words (SQR, BI Publisher) and administration verbs that the training bank uses, so
  the classifier leans on object names. More varied training phrasing should close most of the Report/IB gap.
- Real PHIRE tickets probably show the same pattern as observation 1: access and environment requests logged under a business
  module. The app should not treat a module disagreement on such tickets as an error.

## Recommendations

| # | Recommendation | Owner |
|---|---|---|
| 1 | Generator: security and administration templates logged under a business module should name that module's role, page or process; otherwise label them `SEC` / `PT` as the taxonomy rule says | data-engineer |
| 2 | Add training phrasings for report requests without tool names ("need a new report showing…") and for IB / performance tickets, then retrain (never tune on the test set) | data-engineer, nlp-specialist |
| 3 | Taxonomy: add explicit cues — "report showing", "message queue", "IB errors", "timing out" — to the tie-break table | erp-functional-analyst |
| 4 | App (done in v1): low-confidence predictions and module disagreements are flagged **Review**, not shown as errors | frontend-developer |
| 5 | Confirm with the PHIRE administrator whether access and environment tickets use `SEC` / `PT` or the business module (open question 1 in `docs/README.md`) | erp-business-analyst |

## Sources

- `nlp/results.md` (misclassified tickets), `data/synthetic/phire_test.csv` (full text and templates)
- `docs/ticket-taxonomy.md` (issue-area tie-break rules), `docs/peoplesoft-modules.md` (module rule for SEC/PT)
- knowledge folder: `knowledge/erp-qa-developer/` README only
