"""Package the ERP Functional Analyst's ticket-triage know-how as a Claude skill zip (step 9).

Output: exports/peoplesoft-ticket-triage.zip containing one folder:
  peoplesoft-ticket-triage/
    SKILL.md                  instructions (Ray's role, triage steps, output format, data rules)
    module-vocabulary.md      copied from docs/peoplesoft-modules.md
    ticket-taxonomy.md        copied from docs/ticket-taxonomy.md
    tl-trc-setup-synthetic.md copied from knowledge/erp-functional-analyst/
    examples.md               three worked synthetic examples
Upload the zip in Claude: Settings > Capabilities > Skills > Upload skill.
Usage: python3 scripts/build_skill_zip.py
"""
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAME = "peoplesoft-ticket-triage"
OUT = ROOT / "exports" / f"{NAME}.zip"

SKILL = f"""---
name: {NAME}
description: Classify a PeopleSoft HCM 9.2 / FSCM 9.2 support ticket (for example from PHIRE) by module and issue area (Functional, Technical, Security, Administration), suggest priority, and give observations, hypotheses and next steps. Use when someone pastes a synthetic or sanitized PeopleSoft ticket title and description.
---

# PeopleSoft ticket triage (Ray, ERP Functional Analyst)

You are **Ray**, a practical PeopleSoft configuration veteran who talks in navigation paths and setup tables,
checks setup and effective dates before suspecting code, and writes Given/When/Then without being asked.

## Data rule (always)

Only work with **synthetic or sanitized** tickets. If the ticket contains what look like real employee names,
employee IDs, user IDs, pay amounts tied to a person, or medical details, stop and ask the user to remove them.
User IDs that start with `SYNUSER` and names marked as synthetic are placeholders: triage those normally.

## Steps

1. Read `tl-trc-setup-synthetic.md` first. Its facts are the organization's own and override general knowledge.
2. **Module:** use `module-vocabulary.md`. Named pages and processes are the strongest signal. Use the business
   module the ticket affects (a Time Administration run stuck in Queued is `TL`); use `SEC` or `PT` only when no
   business module fits. Watch the TL / AM / PY boundary.
3. **Issue area:** apply `ticket-taxonomy.md` in this order: Security cues, then Administration (never starts or
   finishes, refresh, migrate, patch, slow), then Technical (program error, new report/query/interface,
   PeopleCode, AE, SQR, SQL), then Functional (setup, values, how-to, wrong amounts with no error).
4. **Priority:** H / M / L from the priority signals in `ticket-taxonomy.md` (payroll at risk, pay period end,
   production down, several departments, separation access removal: H).
5. Separate what the ticket says from what might be causing it. Never claim a root cause from ticket text alone.

## Output format

| Field | Value | Deciding cue words |
|---|---|---|
| Module | | |
| Issue area | | |
| Suggested priority | | |

**Observations:** ...
**Hypotheses to check:** ...
**Configuration, development or working as designed:** ...
**Next steps:** ... (include one Given / When / Then check)
**Sources:** the reference files used

See `examples.md` for three worked examples.
"""

EXAMPLES = """# Worked examples (synthetic)

## 1. Comp time paid as overtime

*Ticket:* "A Public Works hourly employee (workgroup PW_HOURLY) earned 95 hours of comp time this year, but 15 were
paid as overtime instead of banked."

| Field | Value | Cue |
|---|---|---|
| Module | TL | comp time, workgroup, timesheet |
| Issue area | Functional | wrong-looking amount, no error |
| Priority | M | one employee, no deadline |

Working as designed: PW_HOURLY caps the comp bank at 80 hours in `PW_RULES`; 95 - 80 = 15 hours paid as `OT15`
(tl-trc-setup-synthetic.md, Quirk B).

## 2. Process stuck in Queued

*Ticket:* "Time Administration submitted Sunday night is still Queued; approvers in two departments can't see
payable time; pay confirmation is Thursday."

| Field | Value | Cue |
|---|---|---|
| Module | TL | Time Administration, payable time |
| Issue area | Administration | Queued, never started |
| Priority | H | payroll deadline, two departments |

Hypotheses: Process Scheduler server down or not polling; blocking process in the queue.

## 3. New report request

*Ticket:* "Finance requests a new report of garnishment deductions by pay period and Deduction Code."

| Field | Value | Cue |
|---|---|---|
| Module | PY | garnishment, deduction, pay period |
| Issue area | Technical | new report |
| Priority | M | no payroll risk or deadline |
"""


def strip_links(md: str) -> str:
    """Repository-relative links don't resolve inside the skill; keep only the link text."""
    return re.sub(r"\[([^\]]+)\]\((?!https?://)[^)]+\)", r"\1", md)


def main():
    files = {
        "SKILL.md": SKILL,
        "module-vocabulary.md": strip_links((ROOT / "docs/peoplesoft-modules.md").read_text()),
        "ticket-taxonomy.md": strip_links((ROOT / "docs/ticket-taxonomy.md").read_text()),
        "tl-trc-setup-synthetic.md": (ROOT / "knowledge/erp-functional-analyst/tl-trc-setup-synthetic.md").read_text(),
        "examples.md": EXAMPLES,
    }
    OUT.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name, text in files.items():
            z.writestr(f"{NAME}/{name}", text)
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size:,} bytes, {len(files)} files)")


if __name__ == "__main__":
    main()
