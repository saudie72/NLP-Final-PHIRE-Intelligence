# Exports

## `peoplesoft-ticket-triage.zip` (step 9)

Ray, the ERP Functional Analyst, packaged as a Claude skill you can use in the Claude app without Claude Code.
Built by `python3 scripts/build_skill_zip.py` from files already in this repository.

| File in the zip | Source |
|---|---|
| `SKILL.md` | Ray's role, data rule, triage steps, output format |
| `module-vocabulary.md` | `docs/peoplesoft-modules.md` |
| `ticket-taxonomy.md` | `docs/ticket-taxonomy.md` |
| `tl-trc-setup-synthetic.md` | `knowledge/erp-functional-analyst/` (synthetic) |
| `examples.md` | Three worked synthetic examples |

### Upload it

1. In Claude, open **Settings → Capabilities** and make sure **Skills** (and code execution, if listed) is on.
2. Under **Skills**, choose **Upload skill** and select `peoplesoft-ticket-triage.zip`.
3. In a new chat, paste a **synthetic** ticket and ask: "Triage this PeopleSoft ticket." Claude loads the skill
   when the request matches its description.

Menu names in the Claude app change from time to time; if they differ, look for Skills under Settings.

### Test results

An agent given **only** the unzipped skill (nothing else from the repository) triaged five tickets from the
held-out synthetic test set:

| Ticket | True label | Skill's answer | Module | Area |
|---|---|---|---|---|
| Add Entitlement option (vacation) | AM / Functional | AM / Functional | ✅ | ✅ |
| Outbound file incomplete (PO dispatch AE) | PO / Technical | PO / Technical | ✅ | ✅ |
| Disable login SYNUSER0711 | SEC / Security | SEC / Security | ✅ | ✅ |
| Add recurrence for report distribution | PT / Administration | PT / Administration | ✅ | ✅ |
| Discrepancy in unapproved time report | TL / Functional | TL / Functional | ✅ | ✅ |

Module 5/5, issue area 5/5. The first run refused the Security ticket because its synthetic user ID looked like a
real login; synthetic IDs are now `SYNUSERnnnn` and the skill treats them as placeholders. Priority labels in the
data were then aligned with the documented priority rules (see `data/synthetic/README.md`).

**Data rule:** only paste synthetic or sanitized tickets into the Claude app. The skill stops and asks you to
remove anything that looks like a real name, ID, pay amount or medical detail.
