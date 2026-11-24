# Entity labelling guide (version 2, round 2)

For hand-labelling PeopleSoft entities in **synthetic** tickets so gold sets are consistent. Author: erp-qa-developer.
Schemes: `pipeline/tests/gold_entities.json` (labels, rules), `pipeline/patterns.py` (ruler). Sources: [modules](peoplesoft-modules.md),
[technical](peoplesoft-technical.md), [security](peoplesoft-security.md). Items marked "to confirm" are assumptions.

## General rules

1. Label the **shortest span that names the thing** (no articles, no trailing "page", "process", "role").
2. Label every mention, not only the first. Exact text and label are scored, so keep the ticket's own casing.
3. Label by **what the words refer to in this sentence**, not by the word alone ("roles" in "remove roles" is plain English).
4. One span, one label. If two labels fit, use the tie-break for that pair in the sections below.
5. Never label ticket numbers or user IDs from real data; synthetic IDs only (`docs/data-handling.md`).

## Labels

| Label | Definition | Examples | Boundary rules |
|---|---|---|---|
| PS_MODULE | Product area or menu root | Time and Labor; Workforce Administration; PeopleTools | Navigation path: root = PS_MODULE, final page = PS_PAGE, skip middle folders. Bare codes (HR, TL, PY) only as "TL module" / "module: TL" (module codes beyond HR/PY/TL are to confirm in `peoplesoft-modules.md`). A bare two-letter code that is a business unit or department is not a module. |
| PS_PAGE | Page or component a user opens | Job Data; Timesheet; Process Monitor | Delivered page name, capitalised or after "page/component". Not a process, not a generic word ("roles", "report"). "Roles", "User Profiles", "Permission Lists" are pages only when used as the page name (nav path, "the Roles page"). |
| PS_PROCESS | Batch or business process, the work that runs | Pay Calculation; Load Time and Labor; budget check | A process is something you run or that runs. The scheduler that runs it is PS_TOOL. A page used to run it (Run Control) is PS_PAGE. |
| PS_FIELD | Field, code or setup value type on a page or record | Workgroup; Time reporting code; Expense Type | Label the field name, never the value in it. Record types ("position records", "deduction records") are not labelled. Error-message text is labelled only for scheme terms inside it. |
| PS_TOOL | PeopleTools technology or infrastructure | PeopleCode; Process Scheduler; Integration Broker / IB | Languages, engines, servers, schedulers, PUM, PS Query, security trees. Not a CAPS program name (that is PS_PROGRAM). Process Monitor is a page, not the tool. |
| PS_PROGRAM | Named delivered or custom program or object | HR_JOB; PSPPYRUN; XX_INTFC | Executable or object name written as a single CAPS token, with or without underscores. Environments (UAT) and business-unit codes are not programs. |
| PS_ENV | Environment | DEV; TST; UAT; TRN; CFG; PRD | Only when it names an environment ("refresh TST"). Not "test" in plain English. |
| TICKET_REF | PHIRE issue or CR number | IN + 6 digits; CR + 6 digits | Whole token. A reference to an earlier issue inside the text is still labelled. |
| USER_ID | User ID | SYNUSER0001 | Whole token. Never a person's name. |
| BUSINESS_UNIT | Business unit | "BU FR" (whole span); "Business Unit = SO" (whole span); bare "SO" used as a BU | Keep the prefix in the span when it is written; a later bare code that clearly repeats the BU is also labelled. Not a department abbreviation. |
| DATE | Calendar date | 05/13/2026; 07/29/2026 | Date part only. Not "PPE", "year-end", "annual", "last night", "Friday" (to confirm for relative dates). |
| ORG | County department | Code Enforcement; Water Utilities; Fire Rescue | Departments of the organisation (synthetic). Not a PeopleSoft department table or the word "department". |
| PS_ROLE | Delivered or named security/business role that grants access | Timekeeper; Payroll Inquiry; Security Administrator | See decision 2. Role names only, never the word "role(s)". Permission lists are PS_FIELD-like setup objects and not labelled (to confirm). |

## Decisions

### 1. PPE (pay period end)

- **Observation:** `peoplesoft-modules.md` lists PPE only as Time and Labor vocabulary, beside workgroup and TRC. It is an abbreviation for a date, not a named field on a delivered page.
- **Decision:** bare "PPE" is **not** an entity. In "PPE 05/13/2026" label **only** `05/13/2026` as DATE (matches the gold rule "the date part only, not 'PPE'"). Label "PPE Date" or "Pay Period End Date" as PS_FIELD only when the ticket treats it as a page field or column (to confirm against PeopleBooks).
- **Ruler impact:** the ruler's bare "PPE" as PS_FIELD (the most frequent false positive in round 1) should go, with "PPE Date" kept.

### 2. Delivered roles

- **Observation:** `peoplesoft-security.md` defines a role as a collection of permission lists and the main way users get access; Security tickets turn on role names.
- **Decision:** a **named** role (Timekeeper, Payroll Inquiry, Security Administrator, Recruiter, Hiring Manager) is PS_ROLE when the ticket uses it as a role: assigned, added, removed, missing, needed. When it names a job or person ("the timekeeper entered it") it is not labelled. The generic word "role(s)" is never labelled.
- **Tie-break:** the role name wins over any module or page word inside it ("Payroll Inquiry" is PS_ROLE, not PS_MODULE).
- **Changes the gold set:** see below.

### 3. Process Scheduler and PSPPYRUN

- **Process Scheduler = PS_TOOL.** `peoplesoft-technical.md` lists it under platform and operations as the infrastructure that runs AE, SQR and COBOL processes. The things it runs ("Pay Calculation", "budget check") are PS_PROCESS; the monitoring page ("Process Monitor") is PS_PAGE. "The scheduler" and "process scheduler server" are PS_TOOL (to confirm for "server").
- **PSPPYRUN = PS_PROGRAM.** The technical doc lists it as the COBOL pay-calculation program. COBOL itself is PS_TOOL. The current `patterns.py` docstring says PS_PROGRAM is "CAPS_WITH_UNDERSCORES"; PSPPYRUN has none, so the guide widens the rule to any single CAPS program token.

### 4. Lowercase generic mentions

Label a lowercase term only if it is a **specific PeopleSoft term** used as the thing itself. Test: could you replace it with a capitalised page or field name from the docs without changing the meaning?

| Mention | Label? | Why |
|---|---|---|
| "federal withholding" (field/setup being changed) | PS_FIELD | Specific setup value type; the gold set already labels it |
| "withholding" / "deduction" alone, "wrong deduction amount" | No | Business words for an outcome or an amount, listed in `peoplesoft-modules.md` as vocabulary only |
| "deduction code", "earnings code", "time reporting code" | PS_FIELD | Named code type |
| "deduction records", "position records" | No | Record types (gold rule 2) |
| "budget check", "paysheet creation" | PS_PROCESS | Named process, lowercase in docs |
| "roles", "role" | No | Generic word; PS_PAGE only as the Roles page name |
| "expense report" naming the page being opened | PS_PAGE | The gold set labels it (kept) |
| "balance" in a sentence about a total | No | Capitalised "Balance" as a named field is PS_FIELD in the gold set (to confirm for lowercase) |

## Which current gold rules this guide changes

| Gold rule or label | Status |
|---|---|
| PS_TOOL for Process Scheduler, PS_PROGRAM for PSPPYRUN | Unchanged (guide agrees; the **ruler** is wrong, not the gold) |
| DATE excludes "PPE"; bare PPE not labelled | Unchanged (guide agrees; ruler's PS_FIELD "PPE" disagrees) |
| Navigation paths, error-message text, record types | Unchanged |
| **Rule 2: "Roles (Payroll Inquiry, Security Administrator) ... are not labelled"** | **Changed:** named roles become PS_ROLE. The label PS_ROLE is not in the gold `labels` list. The generic word "roles" stays unlabelled. |
| PS_PROGRAM definition "in CAPS" | Clarified (no underscore needed) |

Because rule 2 changes, the round 1 rule applies: **write a new gold set before re-scoring**; do not edit the 30 tickets to fit the ruler.
Role mentions in the existing 30 tickets must be re-read once under this guide (to confirm how many there are).

## Assumptions to confirm

- Relative dates ("last night", "end of month") are not DATE.
- Permission lists are not labelled in this scheme.
- "PPE Date" as a field name appears in tickets; PeopleBooks wording not checked here.
- "Process scheduler server" counts as PS_TOOL.
