"""spaCy EntityRuler patterns for PeopleSoft support tickets.

The statistical model en_core_web_sm knows people, organisations, dates and places, but not PeopleSoft objects:
it tags pages such as "Process Monitor" as ORG and misses programs and ticket numbers. These rule-based patterns
(spaCy EntityRuler, https://spacy.io/usage/rule-based-matching#entityruler) add PeopleSoft labels. Terms come from
the project research (docs/peoplesoft-modules.md, docs/peoplesoft-technical.md, docs/peoplesoft-security.md) and
Oracle PeopleBooks, not from the synthetic data generator's code.

Labels
  PS_MODULE    product areas (Payroll, Time and Labor, ...)
  PS_PAGE      pages and components users work in
  PS_PROCESS   batch and business processes
  PS_TOOL      PeopleTools technologies (PeopleCode, Application Engine, SQR, Integration Broker, ...)
  PS_PROGRAM   program / object names written as one CAPS token, with or without underscores (TL_TIMEADMIN, PSPPYRUN)
  PS_ENV       environments (DEV, TST, UAT, TRN, CFG, PRD)
  TICKET_REF   PHIRE issue and change-request numbers (IN001234, CR004321)
  USER_ID      user IDs (synthetic placeholders SYNUSERnnnn)
  BUSINESS_UNIT  "BU XX" / "Business Unit = XX"
  PS_FIELD     fields, codes, forms and business terms inside pages (Earnings Code, TRC, ChartField, Workgroup,
               Taskgroup, Action Reason, PPE Date, W-2, 1099, ...). Sources: docs/peoplesoft-modules.md vocabulary column
  PS_ROLE      delivered business roles named in tickets (Timekeeper, Recruiter, ...); Oracle PeopleBooks roles

Bare "PPE" and "Pay Period End" are not entities; "PPE Date" / "Pay Period End Date" are PS_FIELD, and a date after
"PPE" is DATE (docs/entity-labelling-guide.md decision 1; docs/peoplesoft-modules.md lists PPE as vocabulary only).
Named roles "Payroll Inquiry" and "Security Administrator" come from the guide (decision 2).

Module codes (HR, PY, TL, AM, BN, RC, EP, GL, AP, PO, EX, PC) are labelled PS_MODULE only in clearly-code contexts:
"<code> module", "module <code>", "module: <code>". Bare two-letter codes are NOT labelled, because in tickets they are
often business units or departments (docs/peoplesoft-modules.md says codes beyond HR/PY/TL are to confirm). The one
exception is upper-case "PO", the FSCM Purchase Order abbreviation, labelled PS_PAGE.

Generic words (v2 round 2). A page name that is also plain English (GENERIC_PAGES: "Roles", "Voucher", "Work Schedule")
matches only in Title Case or UPPER CASE. Reason: Token matcher attributes are exact and case-sensitive unless LOWER is
used (https://spacy.io/usage/rule-based-matching), and a "LOWER" pattern cannot tell the page "Roles" from the word
"roles" in "assign the roles". Capitalisation is the only page-context cue a token pattern can see, since an
EntityRuler pattern cannot look ahead without putting the extra word inside the entity span.

Slash dates (v2 round 2). Label DATE, the en_core_web_sm label (https://spacy.io/models/en), so rule and model agree.
"""

MODULES = [
    "Core HR", "Payroll", "Payroll for North America", "Time and Labor", "Absence Management", "Benefits",
    "Benefits Administration", "Recruiting", "Talent Acquisition", "ePerformance", "General Ledger",
    "Accounts Payable", "Purchasing", "eProcurement", "Expenses", "Project Costing", "Grants", "PeopleTools",
]
PAGES = [
    "Job Data", "Personal Data", "Add a Person", "Position Data", "Department Table", "Workforce Job Summary",
    "Review Paycheck", "Create Additional Pay", "Pay Calendar Table",
    "Approve Reported Time", "Timesheet Lockdown", "Assign Work Schedule", "Manage Exceptions",
    "Absence Request", "Absence Balances", "Manage Absence", "Absence Entitlement",
    "Benefits Enrollment", "Dependent Information", "Benefit Program Table",
    "Job Opening", "Manage Applicant", "Prepare Job Offer", "Careers page",
    "Performance Document", "Manager Evaluation", "Document Administration",
    "Create/Update Journal Entries", "Ledger Inquiry", "ChartField Values", "Open Period Update",
    "Supplier Information", "Payment Inquiry", "Match Workbench", "Travel Authorization",
    "Project General", "Project Activities", "Project Transactions",
    "Run Control", "Blanket PO", "Security Tree Refresh", "Process Monitor", "Report Manager",
    "Integration Broker Monitor",
]
# Page names that are also ordinary English words or phrases ("roles", "voucher", "work schedule"). Matched only when
# every word is Title Case or UPPER CASE (how a page is written when a ticket names it), not in running lower-case
# text. See the note below the module docstring.
GENERIC_PAGES = [
    "Roles", "Voucher", "Receiving", "Requisition", "Timesheet", "Paysheets", "Direct Deposit", "Journal Entry",
    "Work Schedule", "Pay Calendar", "Holiday Schedule", "Health Benefits", "Cash Advance", "Purchase Order",
    "Expense Report", "Org Chart", "Row Security", "User Profiles", "Permission Lists", "Web Profile", "Carrier File",
]
PROCESSES = [
    "Pay Calculation", "Pay Confirmation", "Pay Unconfirm", "paysheet creation", "Time Administration",
    "Load Time and Labor", "payable time approval", "Absence Calculation", "Absence Finalize", "Absence Conversion",
    "Open Enrollment", "BenAdmin event processing", "Journal Edit", "Journal Post", "Voucher Build", "Pay Cycle",
    "Voucher Post", "Sourcing Workbench", "PO dispatch", "budget check", "PO rollover", "year-end close",
    "month-end close", "Create Evaluations", "Project Costing load", "SJT refresh", "environment refresh",
    "year-end W-2 processing", "accrual process",
]
TOOLS = [
    "PeopleCode", "Application Engine", "SQR", "BI Publisher", "PS Query", "Integration Broker",
    "Component Interface", "Application Package", "COBOL", "nVision", "PUM image", "PeopleSoft Update Manager",
    "Approval Framework", "Candidate Gateway", "PUM", "XML Publisher", "Integration Gateway", "Tuxedo", "WebLogic",
    "Query Manager", "IB", "Process Scheduler",
]
PROGRAMS = ["PSPPYRUN"]   # delivered COBOL program that runs payroll engines (docs/peoplesoft-technical.md)
FIELDS = [
    # Payroll / TL / AM / BN vocabulary (docs/peoplesoft-modules.md)
    "Earnings Code", "Deduction Code", "Deduction", "Garnishment", "Withholding", "TRC", "Time Reporting Code",
    "Workgroup", "Taskgroup", "PPE Date", "Pay Period End Date", "Comp Time", "Reported Time", "Payable Time",
    "Entitlement", "Coverage Code", "FMLA", "COBRA", "834 file", "W-2", "1099",
    # HR vocabulary
    "Action Reason", "Job Code", "Position Number", "Effective Date", "Union Code", "Reports To",
    # FSCM vocabulary
    "ChartField", "Supplier", "Encumbrance", "Project ID", "Analysis Type", "Trial Balance",
    # security (docs/peoplesoft-security.md)
    "Permission List", "Primary Permission List", "Benefit Plan", "Absence Take", "Queued", "Not Posted",
]
ROLES = ["Timekeeper", "Recruiter", "Hiring Manager", "Buyer", "Approver", "Payroll Inquiry", "Security Administrator"]
MODULE_CODES = ["HR", "PY", "TL", "AM", "BN", "RC", "EP", "GL", "AP", "PO", "EX", "PC"]
ENVS = ["DEV", "TST", "UAT", "TRN", "CFG", "PRD", "PROD"]


def _phrase(label, terms):
    out = []
    for t in terms:
        # case-insensitive token patterns, so "pay calculation" and "Pay Calculation" both match
        out.append({"label": label, "id": "ruler", "pattern": [{"LOWER": w.lower()} for w in t.replace("/", " / ").split()]})
    return out


def _title_or_upper(label, terms):
    """Like _phrase, but each word must be Title Case or UPPER CASE (case-sensitive), so lower-case prose is skipped."""
    out = []
    for t in terms:
        words = t.split()
        pat = [{"TEXT": {"IN": sorted({w.title(), w.upper()})}} for w in words]
        out.append({"label": label, "id": "ruler", "pattern": pat})
    return out


# Slash dates as PHIRE text exports write them (docs/phire-export-format.md: "text (mm/dd/yyyy)"). spaCy's tokenizer
# keeps "09/14/2026" and "1/4/2027" as one token, so one regex token pattern is enough.
SLASH_DATE = r"^(0?[1-9]|1[0-2])/(0?[1-9]|[12]\d|3[01])/(19|20)\d{2}$"


def patterns():
    p = []
    p += _phrase("PS_MODULE", MODULES)
    p += _phrase("PS_PAGE", PAGES)
    p += _title_or_upper("PS_PAGE", GENERIC_PAGES)
    p += _phrase("PS_PROCESS", PROCESSES)
    p += _phrase("PS_TOOL", TOOLS)
    p += _phrase("PS_PROGRAM", PROGRAMS)
    p += _phrase("PS_FIELD", FIELDS)
    p += _phrase("PS_ROLE", ROLES)
    p += [{"label": "PS_ENV", "id": "ruler", "pattern": [{"TEXT": e}]} for e in ENVS]
    code = {"TEXT": {"IN": MODULE_CODES}}
    p += [
        {"label": "PS_MODULE", "id": "ruler", "pattern": [code, {"LOWER": "module"}]},
        {"label": "PS_MODULE", "id": "ruler", "pattern": [{"LOWER": "module"}, {"ORTH": {"IN": [":", "="]}, "OP": "?"}, code]},
        {"label": "PS_PAGE", "id": "ruler", "pattern": [{"TEXT": "PO"}]},
        {"label": "DATE", "id": "ruler", "pattern": [{"TEXT": {"REGEX": SLASH_DATE}}]},
        {"label": "PS_PROGRAM", "id": "ruler", "pattern": [{"TEXT": {"REGEX": r"^[A-Z][A-Z0-9]{1,}_[A-Z0-9_]{2,}$"}}]},
        {"label": "TICKET_REF", "id": "ruler", "pattern": [{"TEXT": {"REGEX": r"^(IN|CR)\d{4,}$"}}]},
        {"label": "USER_ID", "id": "ruler", "pattern": [{"TEXT": {"REGEX": r"^SYNUSER\d{3,}$"}}]},
        {"label": "BUSINESS_UNIT", "id": "ruler", "pattern": [{"LOWER": "bu"}, {"TEXT": {"REGEX": r"^[A-Z]{2,5}$"}}]},
        {"label": "BUSINESS_UNIT", "id": "ruler",
         "pattern": [{"LOWER": "business"}, {"LOWER": "unit"}, {"ORTH": "="}, {"TEXT": {"REGEX": r"^[A-Z]{2,5}$"}}]},
    ]
    return p


RULER_LABELS = ["PS_MODULE", "PS_PAGE", "PS_PROCESS", "PS_TOOL", "PS_PROGRAM", "PS_ENV", "TICKET_REF", "USER_ID", "BUSINESS_UNIT",
                "PS_FIELD", "PS_ROLE"]
