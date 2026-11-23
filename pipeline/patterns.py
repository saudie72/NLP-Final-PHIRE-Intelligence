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
  PS_PROGRAM   program / object names in CAPS_WITH_UNDERSCORES (e.g. TL_TIMEADMIN)
  PS_ENV       environments (DEV, TST, UAT, TRN, CFG, PRD)
  TICKET_REF   PHIRE issue and change-request numbers (IN001234, CR004321)
  USER_ID      user IDs (synthetic placeholders SYNUSERnnnn)
  BUSINESS_UNIT  "BU XX" / "Business Unit = XX"
"""

MODULES = [
    "Core HR", "Payroll", "Payroll for North America", "Time and Labor", "Absence Management", "Benefits",
    "Benefits Administration", "Recruiting", "Talent Acquisition", "ePerformance", "General Ledger",
    "Accounts Payable", "Purchasing", "eProcurement", "Expenses", "Project Costing", "Grants", "PeopleTools",
]
PAGES = [
    "Job Data", "Personal Data", "Add a Person", "Position Data", "Department Table", "Workforce Job Summary",
    "Paysheets", "Review Paycheck", "Create Additional Pay", "Pay Calendar Table", "Direct Deposit",
    "Timesheet", "Approve Reported Time", "Timesheet Lockdown", "Assign Work Schedule", "Manage Exceptions",
    "Absence Request", "Absence Balances", "Manage Absence", "Absence Entitlement",
    "Benefits Enrollment", "Dependent Information", "Benefit Program Table", "Health Benefits",
    "Job Opening", "Manage Applicant", "Prepare Job Offer", "Careers page",
    "Performance Document", "Manager Evaluation", "Document Administration",
    "Create/Update Journal Entries", "Journal Entry", "Ledger Inquiry", "ChartField Values", "Open Period Update",
    "Voucher", "Supplier Information", "Payment Inquiry", "Match Workbench",
    "Requisition", "Purchase Order", "Receiving", "Expense Report", "Travel Authorization", "Cash Advance",
    "Project General", "Project Activities", "Project Transactions",
    "User Profiles", "Roles", "Permission Lists", "Row Security", "Process Monitor", "Report Manager",
    "Integration Broker Monitor", "Web Profile", "Org Chart",
]
PROCESSES = [
    "Pay Calculation", "Pay Confirmation", "Pay Unconfirm", "paysheet creation", "Time Administration",
    "Load Time and Labor", "payable time approval", "Absence Calculation", "Absence Finalize", "Absence Conversion",
    "Open Enrollment", "BenAdmin event processing", "Journal Edit", "Journal Post", "Voucher Build", "Pay Cycle",
    "Voucher Post", "Sourcing Workbench", "PO dispatch", "budget check", "PO rollover", "year-end close",
    "month-end close", "Create Evaluations", "Project Costing load", "SJT refresh", "environment refresh",
    "year-end W-2 processing", "accrual process", "Process Scheduler",
]
TOOLS = [
    "PeopleCode", "Application Engine", "SQR", "BI Publisher", "PS Query", "Integration Broker",
    "Component Interface", "Application Package", "COBOL", "nVision", "PUM image", "PeopleSoft Update Manager",
    "Approval Framework", "Candidate Gateway",
]
ENVS = ["DEV", "TST", "UAT", "TRN", "CFG", "PRD", "PROD"]


def _phrase(label, terms):
    out = []
    for t in terms:
        # case-insensitive token patterns, so "pay calculation" and "Pay Calculation" both match
        out.append({"label": label, "id": "ruler", "pattern": [{"LOWER": w.lower()} for w in t.replace("/", " / ").split()]})
    return out


def patterns():
    p = []
    p += _phrase("PS_MODULE", MODULES)
    p += _phrase("PS_PAGE", PAGES)
    p += _phrase("PS_PROCESS", PROCESSES)
    p += _phrase("PS_TOOL", TOOLS)
    p += [{"label": "PS_ENV", "id": "ruler", "pattern": [{"TEXT": e}]} for e in ENVS]
    p += [
        {"label": "PS_PROGRAM", "id": "ruler", "pattern": [{"TEXT": {"REGEX": r"^[A-Z][A-Z0-9]{1,}_[A-Z0-9_]{2,}$"}}]},
        {"label": "TICKET_REF", "id": "ruler", "pattern": [{"TEXT": {"REGEX": r"^(IN|CR)\d{4,}$"}}]},
        {"label": "USER_ID", "id": "ruler", "pattern": [{"TEXT": {"REGEX": r"^SYNUSER\d{3,}$"}}]},
        {"label": "BUSINESS_UNIT", "id": "ruler", "pattern": [{"LOWER": "bu"}, {"TEXT": {"REGEX": r"^[A-Z]{2,5}$"}}]},
        {"label": "BUSINESS_UNIT", "id": "ruler",
         "pattern": [{"LOWER": "business"}, {"LOWER": "unit"}, {"ORTH": "="}, {"TEXT": {"REGEX": r"^[A-Z]{2,5}$"}}]},
    ]
    return p


RULER_LABELS = ["PS_MODULE", "PS_PAGE", "PS_PROCESS", "PS_TOOL", "PS_PROGRAM", "PS_ENV", "TICKET_REF", "USER_ID", "BUSINESS_UNIT"]
