# Agent test results: does the agent read its knowledge folder?

**Agent:** ERP Functional Analyst (Ray), `.claude/agents/erp-functional-analyst.md`
**Knowledge document:** [`knowledge/erp-functional-analyst/tl-trc-setup-synthetic.md`](../knowledge/erp-functional-analyst/tl-trc-setup-synthetic.md),
a synthetic Time and Labor TRC setup with three quirks that appear nowhere else in the repository:

- **Quirk A:** TRC `SCKCE` (Code Enforcement field inspectors' sick leave) maps to `REG` earnings with no absence take until a mis-keyed effective date of 01/04/2027.
- **Quirk B:** PW_HOURLY comp time bank is capped at 80 hours in `PW_RULES`; anything above is paid as `OT15`.
- **Quirk C:** `HOLFR` is excluded from `FR_RULES` and must be entered on Paysheets manually.

All tickets and setup are synthetic. Tests were read-only. Rounds 1–4 used a fictional "Health Services" department;
it was replaced with Code Enforcement before round 5 so nothing in the project suggests medical data.

## Questions and pass criteria

| # | Question (synthetic) | Tests | Pass if the answer... |
|---|---|---|---|
| Q1 | Code Enforcement (BU CE) sick leave paid as regular hours and not reducing the balance for two pay periods | Knowledge only | Names Quirk A (`SCKCE`, effective date) and the effective-dated correction plus retro, citing the knowledge file |
| Q2 | PW_HOURLY employee earned 95 hours of comp time; 15 paid as overtime | Knowledge + docs | Uses Quirk B (80-hour cap → working as designed) **and** gives module/issue area from `docs/` |
| Q3 | Deduction Code and family per-pay-period amount for 2027 dental | Not covered | Says the knowledge folder and docs don't cover it, and does not guess |

## Results

| Round | Agent instructions | Q1 | Q2 | Q3 |
|---|---|---|---|---|
| 1 | Step 7 version: "read your knowledge folder" as one bullet in *Read first* | ❌ generic causes, never opened the folder | ❌ guessed "a cap may exist", called 80 "unverified" | ✅ checked the folder, refused to guess |
| 2 | Added a "Step 1: read your knowledge folder" section | ❌ same as round 1 | ✅ found Quirk B (likely via a repo search for "PW_HOURLY") | ✅ |
| 3 | Moved to a **mandatory first action** at the top of the file (Glob then Read every file; knowledge overrides docs; name it under Sources) | ❌ ×2 when run as the registered subagent | — | — |
| 4 | Same file as round 3, loaded fresh | ✅ | ✅ | ✅ |
| 5 | Same file; test department renamed from Health Services to Code Enforcement (`SCKCE`, workgroup `CE_FIELD`) and data regenerated | ✅ | ✅ | ✅ |

**Why rounds 2–3 still failed.** This build session registered the agents when they were first pushed (step 5) and
kept that definition, so the registered subagent never saw the step 7 and step 8 edits; its answers also lacked
Ray's voice and the required Sources line. Round 4 loads the current agent file directly, which is what a new
Claude Code session does. **Re-run Q1 in a new session to confirm with the registered agent.**

## Round 5 answers (condensed)

**Q1 ✅** "Our TRC setup matches this exactly (**Quirk A**). When the inspectors moved to the CE_FIELD workgroup on
09/14/2026, TRC `SCKCE` got a row that maps to earnings `REG` with no absence take; the corrected row (`SCK` /
`SICK_TAKE`) was entered with the wrong effective date, 01/04/2027. Configuration only. Fix: insert a correct `SCKCE`
row effective 09/14/2026 and run retro for the affected pay periods. *Given* a CE_FIELD inspector reports `SCKCE`,
*when* Time Administration and pay calculation run, *then* the hours are paid as `SCK` and the sick balance goes down."
Sources: `knowledge/erp-functional-analyst/tl-trc-setup-synthetic.md` (Quirk A), `docs/peoplesoft-modules.md`, `docs/ticket-taxonomy.md`.

**Q2 ✅** Module `TL`, issue area Functional, **working as designed**: PW_HOURLY has an 80-hour cap in `PW_RULES`;
95 − 80 = 15 hours paid as `OT15`. Checks before closing: confirm the bank balance and that the 15 hours came from the
rule. Suggested reply to the requester, plus "if the department wants a different cap, open an enhancement request."
Sources: the knowledge file (Quirk B), `docs/peoplesoft-modules.md`, `docs/ticket-taxonomy.md`.

**Q3 ✅** "I couldn't find either answer… My knowledge folder has the README and a synthetic TRC setup sheet; neither
covers Benefits, dental, Deduction Codes or 2027 rates… made no guesses." Recommends adding a synthetic Benefits
setup file to the folder.

## What changed because of this test

All 16 agent files now open with a **mandatory first action**: list and read every file in `knowledge/<id>/`, treat
those facts as overriding general knowledge and `docs/`, and name them under **Sources** (or write
"knowledge folder: README only"). The Meta Agent template includes the same step.
