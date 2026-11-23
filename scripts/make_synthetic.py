"""Generate synthetic PHIRE ticket exports for PeopleSoft HCM 9.2 / FSCM 9.2.

No real ticket text is used. The column layout matches the PHIRE "All Issues" export
(16 columns, see docs/phire-export-format.md). Train and test descriptions come from
two separate phrasing banks (A and B) so the test score is not inflated by memorized
templates.

Outputs (data/synthetic/):
  phire_train.xlsx / .csv   16 PHIRE columns + 2 label columns (Issue Area, Recurring Group)
  phire_test.xlsx  / .csv   same layout, written with phrasing bank B
  phire_demo_export.xlsx    the test tickets with only the 16 PHIRE columns (what a user uploads)

Usage: python3 scripts/make_synthetic.py [--train 1000] [--test 250] [--seed 7]
"""
import argparse
import csv
import datetime as dt
import random
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

OUT = Path(__file__).resolve().parent.parent / "data" / "synthetic"
REPORT_DATE = dt.date(2026, 11, 22)
START_DATE = dt.date(2025, 1, 2)

PHIRE_COLUMNS = ["Module", "Priority", "Issue Type", "Issue Num", "Title", "Description",
                 "Status", "Assigned To", "Opened By", "Open Date", "Closed Date", "Aging",
                 "Resolution Code", "CR", "Due Date", "Developer"]
LABEL_COLUMNS = ["Issue Area", "Recurring Group"]

# ---------------------------------------------------------------- vocabulary
M = {
    "HR": dict(weight=14, pages=["Job Data", "Personal Data", "Add a Person", "Position Data", "Department Table", "Workforce Job Summary"],
               nav="Workforce Administration > Job Information > Job Data",
               processes=["position mass update", "Job Data audit extract", "Org Chart refresh"],
               reports=["headcount report", "position vacancy report", "new hire report"],
               objs=["job row", "position", "employee record", "department"],
               fields=["Job Code", "Reports To", "Union Code", "Standard Hours", "Action Reason"],
               errmsgs=["Effective date must be greater than the current row", "Position number is not valid for this department"],
               tech=["Job Data save PeopleCode", "HR_JOB component", "CI_JOB_DATA component interface"],
               terms=["rehire", "transfer", "promotion", "termination action", "retroactive job change"],
               roles=["HR Administrator", "HR Inquiry"]),
    "PY": dict(weight=14, pages=["Paysheets", "Review Paycheck", "Create Additional Pay", "Pay Calendar Table", "Direct Deposit"],
               nav="Payroll for North America > Payroll Processing USA > Produce Payroll",
               processes=["Pay Calculation", "Pay Confirmation", "paysheet creation", "Pay Unconfirm", "year-end W-2 processing"],
               reports=["payroll register", "deduction register", "garnishment report", "W-2 audit report", "net pay reconciliation"],
               objs=["paycheck", "off-cycle check", "deduction", "garnishment", "earnings code", "tax withholding"],
               fields=["Earnings Code", "Deduction Code", "Tax Location", "federal withholding", "Net Pay"],
               errmsgs=["Pay calculation ended with errors for 14 employees", "Check number already exists"],
               tech=["PSPPYRUN COBOL", "PY_OUT interface Application Engine", "PAYCHECK SQR"],
               terms=["retro pay", "off-cycle check", "overtime", "shift differential", "longevity pay"],
               roles=["Payroll Specialist", "Payroll Inquiry"]),
    "TL": dict(weight=14, pages=["Timesheet", "Approve Reported Time", "Timesheet Lockdown", "Assign Work Schedule", "Manage Exceptions"],
               nav="Time and Labor > Report Time > Timesheet",
               processes=["Time Administration", "Load Time and Labor", "payable time approval"],
               reports=["payable time report", "exceptions report", "unapproved time report"],
               objs=["reported time", "payable time", "work schedule", "time reporting code", "comp time balance"],
               fields=["TRC", "Workgroup", "Taskgroup", "Schedule ID", "Rule Program"],
               errmsgs=["Time has not been approved", "Workgroup is not valid for this employee"],
               tech=["TL_TIMEADMIN Application Engine", "Timesheet PeopleCode", "Time and Labor rules engine"],
               terms=["holiday schedule", "overtime", "comp time", "shift change", "pay period end"],
               roles=["Timekeeper", "Time Approver"]),
    "AM": dict(weight=6, pages=["Absence Request", "Absence Balances", "Manage Absence", "Absence Entitlement"],
               nav="Global Payroll & Absence Mgmt > Payee Data > Maintain Absences",
               processes=["Absence Calculation", "Absence Finalize", "accrual process"],
               reports=["absence balances report", "leave usage report"],
               objs=["sick leave balance", "vacation accrual", "FMLA leave", "absence request"],
               fields=["Absence Take", "Entitlement", "Balance", "accrual rate"],
               errmsgs=["Absence request exceeds available balance", "Calendar group is not open"],
               tech=["Absence Management engine", "Absence Request PeopleCode"],
               terms=["sick leave", "vacation", "FMLA", "bereavement leave", "leave donation"],
               roles=["Absence Administrator"]),
    "BN": dict(weight=7, pages=["Benefits Enrollment", "Dependent Information", "Benefit Program Table", "Health Benefits"],
               nav="Benefits > Employee/Dependent Information > Dependent Information",
               processes=["Open Enrollment", "BenAdmin event processing", "benefit deduction calculation"],
               reports=["enrollment confirmation report", "dependent eligibility report", "carrier file"],
               objs=["dependent", "medical plan", "life event", "enrollment", "COBRA notice"],
               fields=["Coverage Code", "Benefit Plan", "dependent relationship"],
               errmsgs=["Event is out of sequence", "Dependent is not eligible for coverage"],
               tech=["834 carrier interface", "BenAdmin event Application Engine"],
               terms=["open enrollment", "life event", "new hire enrollment", "dental coverage", "vision coverage"],
               roles=["Benefits Administrator"]),
    "RC": dict(weight=4, pages=["Job Opening", "Manage Applicant", "Prepare Job Offer", "Careers page"],
               nav="Recruiting > Search Job Openings",
               processes=["applicant hire process", "job posting"],
               reports=["applicant flow report", "open requisitions report"],
               objs=["job opening", "applicant", "job offer", "requisition"],
               fields=["Recruiter", "Hiring Manager", "posting description"],
               errmsgs=["Job opening is not approved"],
               tech=["Candidate Gateway", "recruiting integration"],
               terms=["requisition", "offer letter", "background check", "job posting"],
               roles=["Recruiter"]),
    "EP": dict(weight=3, pages=["Performance Document", "Manager Evaluation", "Document Administration"],
               nav="Workforce Development > Performance Management",
               processes=["Create Evaluations", "document routing"],
               reports=["evaluation status report", "completion report"],
               objs=["evaluation document", "rating", "goal"],
               fields=["Overall Rating", "Review Period", "document template"],
               errmsgs=["Document cannot be transferred"],
               tech=["ePerformance workflow"],
               terms=["annual review", "probationary review", "goals", "rating"],
               roles=["Performance Administrator"]),
    "GL": dict(weight=8, pages=["Create/Update Journal Entries", "Ledger Inquiry", "ChartField Values", "Open Period Update"],
               nav="General Ledger > Journals > Journal Entry",
               processes=["Journal Edit", "Journal Post", "allocation", "year-end close"],
               reports=["trial balance", "ledger detail report", "budget vs actual report"],
               objs=["journal", "ledger", "ChartField", "account", "fund"],
               fields=["Account", "Fund Code", "Dept ID", "Program Code"],
               errmsgs=["Journal has combination edit errors", "Accounting period is closed"],
               tech=["GL_JEDIT Application Engine", "nVision layout"],
               terms=["year-end close", "month-end close", "allocation", "budget check"],
               roles=["GL Accountant"]),
    "AP": dict(weight=8, pages=["Voucher", "Supplier Information", "Payment Inquiry", "Match Workbench"],
               nav="Accounts Payable > Vouchers > Add/Update > Regular Entry",
               processes=["Voucher Build", "Pay Cycle", "matching", "Voucher Post"],
               reports=["aged payables report", "1099 report", "payment register"],
               objs=["voucher", "supplier", "payment", "check", "1099"],
               fields=["Supplier ID", "remit-to address", "Payment Method", "Invoice Number"],
               errmsgs=["Voucher is in budget error", "Duplicate invoice number"],
               tech=["AP_VCHRBLD Application Engine", "positive pay file"],
               terms=["pay cycle", "ACH payment", "stale-dated check", "1099 reporting"],
               roles=["AP Processor"]),
    "PO": dict(weight=7, pages=["Requisition", "Purchase Order", "Receiving", "Contract"],
               nav="Purchasing > Purchase Orders > Add/Update POs",
               processes=["Sourcing Workbench", "PO dispatch", "budget check", "PO rollover"],
               reports=["open PO report", "receipt report"],
               objs=["requisition", "purchase order", "receipt", "blanket PO"],
               fields=["Buyer", "Ship To", "Category Code"],
               errmsgs=["PO failed budget check", "Requisition has no approver"],
               tech=["PO dispatch Application Engine", "Approval Framework"],
               terms=["approval workflow", "change order", "PO rollover", "encumbrance"],
               roles=["Buyer", "Requester"]),
    "EX": dict(weight=4, pages=["Expense Report", "Travel Authorization", "Cash Advance"],
               nav="Employee Self-Service > Travel and Expenses",
               processes=["expense approval", "expense payment"],
               reports=["outstanding expense report"],
               objs=["expense report", "travel authorization", "mileage claim", "receipt"],
               fields=["Expense Type", "mileage rate", "per diem"],
               errmsgs=["Expense report cannot be submitted"],
               tech=["expense approval workflow"],
               terms=["mileage reimbursement", "per diem", "travel"],
               roles=["Expense Approver"]),
    "PC": dict(weight=3, pages=["Project General", "Project Activities", "Project Transactions"],
               nav="Project Costing > Project Definitions > General Information",
               processes=["Project Costing load", "pricing", "billing interface"],
               reports=["project cost report"],
               objs=["project", "activity", "grant project"],
               fields=["Project ID", "Activity ID", "Analysis Type"],
               errmsgs=["Project is closed for transactions"],
               tech=["PC_INTFEDIT Application Engine"],
               terms=["grant", "capital project", "cost transfer"],
               roles=["Project Manager"]),
    "SEC": dict(weight=5, pages=["User Profiles", "Roles", "Permission Lists", "Row Security"],
                nav="PeopleTools > Security > User Profiles",
                processes=["SJT refresh", "role audit", "department security tree update"],
                reports=["role audit report", "user access report"],
                objs=["user ID", "role", "permission list", "row-level security"],
                fields=["Primary Permission List", "Row Security Permission List"],
                errmsgs=["You are not authorized to access this component", "Security tree has not been refreshed"],
                tech=["SJT_REFRESH Application Engine", "department security tree"],
                terms=["access request", "separation access removal", "role change"],
                roles=["Security Administrator"]),
    "PT": dict(weight=3, pages=["Process Monitor", "Report Manager", "Integration Broker Monitor", "Web Profile"],
               nav="PeopleTools > Process Scheduler > Process Monitor",
               processes=["Process Scheduler", "Integration Broker", "report distribution", "environment refresh"],
               reports=["Process Monitor report"],
               objs=["process instance", "server", "app server domain", "message queue"],
               fields=["Run Control ID", "server name", "queue"],
               errmsgs=["Process stays in Queued status", "Message is in Error status"],
               tech=["Process Scheduler server", "Integration Broker gateway", "application server domain"],
               terms=["environment refresh", "PeopleTools patching", "PUM image", "performance"],
               roles=["PeopleSoft Administrator"]),
}

AREA_MIX = {  # probabilities of Functional / Technical / Security / Administration per module
    "SEC": [0.0, 0.1, 0.8, 0.1],
    "PT": [0.0, 0.3, 0.0, 0.7],
}
DEFAULT_AREA_MIX = [0.5, 0.25, 0.12, 0.13]
AREAS = ["Functional", "Technical", "Security", "Administration"]

DEPTS = ["Public Works", "Finance", "Code Enforcement", "Parks and Recreation", "Community Services",
         "Information Technology", "Sheriff's Office", "Water Utilities", "Animal Services", "Human Resources",
         "Fire Rescue", "Transportation", "Planning and Zoning", "Budget Office"]
BUS = ["PW", "FN", "CE", "PR", "CS", "IT", "SO", "WU", "AS", "HR", "FR", "TR", "PZ", "BO"]
ENVS = ["DEV", "TST", "UAT", "TRN", "CFG"]
MODS = ["add a comments field", "default the effective date to today", "show the department name",
        "make the field display-only for non-administrators", "add a search by employee name",
        "add the supervisor name to the grid"]
FIRST = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Jamie", "Avery", "Quinn", "Drew",
         "Reese", "Rowan", "Skyler", "Parker", "Hayden", "Logan", "Emerson", "Sage"]
LAST = ["Abernathy", "Bellweather", "Castellano", "Dunmore", "Ellsworth", "Fairbanks", "Galloway",
        "Hollister", "Ingram", "Jarrett", "Kensington", "Lockridge", "Merriweather", "Northcott",
        "Okafor", "Pemberton", "Quintero", "Radcliffe"]
ANALYSTS = [f"{f} {l}" for f, l in zip(FIRST[:10], LAST[:10])]
DEVELOPERS = [f"{f} {l}" for f, l in zip(FIRST[10:], LAST[10:])]
REQUESTERS = [f"{f} {l}" for f in FIRST for l in LAST][::7]

# ---------------------------------------------------------------- phrasing banks
# Each template: (issue type, title, description). EN = Enhancement Request, PS = Production Support Item.
EN, PS = "Enhancement Request", "Production Support Item"
BANK = {
    "A": {
        "Functional": [
            (PS, "{Term} not reflected on {page}", "When processing a {term} for an employee in BU {bu}, the change does not show correctly on the {page} page. The {field} value is incorrect after save. Please review the configuration and advise."),
            (EN, "Update {field} values for {dept}", "{dept} is requesting an update to the {field} setup used on {page}. The current values no longer match the business process. Effective {date}."),
            (PS, "{Report} totals do not match", "The {report} for the period ending {date} does not tie out. {dept} found differences for several {obj} records. Please research."),
            (EN, "New {field} needed for {term}", "Business requests a new {field} to support {term}. Attached are the requirements approved by the {dept} director."),
            (PS, "Incorrect {obj} after {process}", "After {process} ran, several {obj} records for BU {bu} are incorrect. Users entered the data per the procedure. Need a functional review of the setup."),
            (PS, "Question on {term} processing", "Users in {dept} are unsure how to handle {term} in {page}. Please confirm the correct steps and whether the setup needs to change."),
            (EN, "{page} change requested by {dept}", "Please modify the {page} page to {mod}. Requested by {dept}."),
            (PS, "Mass update of {obj} records for {bu}", "Business Unit = {bu}\n\nRequest a mass update of {obj} records effective {date}. Spreadsheet of affected records is attached."),
        ],
        "Technical": [
            (PS, "{tech} error during {process}", "{Process} ended in error in {tech} with the message \"{errmsg}\". Run control {runctl}, process instance {pi}. Please investigate the code."),
            (EN, "Modify {tech} for {term}", "A code change is needed in {tech} to handle {term}. Requirements are attached. Please update the PeopleCode/SQL and migrate."),
            (PS, "SQL error when saving {page}", "Users receive a SQL error when saving {page}: \"{errmsg}\". It appears to come from the save PeopleCode."),
            (PS, "Interface file missing {obj} records", "The outbound interface from {tech} is missing {obj} records for {date}. Please check the SQL selection criteria."),
            (EN, "Create new {report} with {field}", "Create a new SQR / BI Publisher report based on the {report} with additional columns for {field}. Template and sample layout attached."),
            (PS, "Application Engine step fails in {tech}", "The {tech} fails at a step with \"{errmsg}\". Need developer review of the program logic."),
            (EN, "PS Query for {obj} by {field}", "Please build a PS Query that lists {obj} records by {field} for {dept}."),
            (PS, "Retrofit {tech} after image update", "After applying the latest PUM image, the customization in {tech} needs to be retrofitted and retested."),
        ],
        "Security": [
            (PS, "Access to {page} for new {role}", "New {role} in {dept} needs access to {page}. Please add the {role} role to user ID {uid}. Approved by supervisor."),
            (PS, "Not authorized to access {page}", "User receives \"You are not authorized to access this component\" when opening {page}. User ID {uid}."),
            (PS, "Remove access for separated employee", "Employee separated effective {date}. Please remove all PeopleSoft roles from user ID {uid}."),
            (PS, "Row security: cannot see {dept} employees", "{role} cannot see records for {dept} in {page}. Row-level security may need to be updated."),
            (PS, "Role change for {uid}", "User moved to {dept}. Please replace current roles with {role} roles."),
            (PS, "Lock user account {uid}", "Please lock user ID {uid} pending a supervisor review."),
            (EN, "Audit listing of {role} roles", "Request a listing of all users with the {role} role for the quarterly access audit."),
            (PS, "Temporary access to {page}", "Temporary access is needed for {uid} to {page} through {date}."),
        ],
        "Administration": [
            (PS, "{Process} stuck in Queued status", "Processes submitted for {process} have stayed in Queued status since {date}. The Process Scheduler server may be down."),
            (PS, "Refresh {env} from production", "Please refresh the {env} environment with a copy of production as of {date} for testing."),
            (PS, "Slow performance on {page}", "{page} takes over two minutes to load in production. Users in {dept} are affected."),
            (PS, "Integration Broker messages in error", "Messages for {tech} are in Error status in the Integration Broker Monitor since {date}."),
            (PS, "Migrate {proj} to {env}", "Please migrate project {proj} to {env}. Testing sign-off is attached."),
            (PS, "{Process} output not posting to Report Manager", "Output from {process} is not appearing in Report Manager. Process Monitor shows Success but Not Posted."),
            (PS, "Apply PeopleTools patch to {env}", "Apply the PeopleTools patch to {env} per the maintenance schedule."),
            (EN, "Schedule {process} recurrence", "Set up a recurring schedule so {process} runs nightly after business hours."),
        ],
    },
    "B": {
        "Functional": [
            (PS, "{page}: wrong {field} showing", "Users report that {field} on {page} shows the wrong value since {date}. This affects {dept}. Can someone check the setup?"),
            (PS, "{dept} - {term} issue", "We are having trouble with {term}. The {obj} is not coming out right in {page}. Need help."),
            (PS, "Discrepancy in {report}", "Reconciliation for {date} shows a discrepancy in the {report}. Numbers for BU {bu} are off."),
            (EN, "Add {field} option", "Can we add a new {field} option to support {term}? The business owner approved it."),
            (PS, "{obj} wrong for BU {bu}", "Following the last {process}, the {obj} data for {bu} looks wrong."),
            (PS, "How to process {term}", "Guidance needed: what is the correct way to enter {term} on {page}?"),
            (EN, "Enhancement: {page}", "Requesting that {page} be changed to {mod}."),
            (PS, "Bulk change of {obj} records", "Need a bulk change for {obj} records in {bu}, effective {date}. List attached."),
        ],
        "Technical": [
            (PS, "Abend in {process}", "Getting \"{errmsg}\" from {tech}. Instance {pi}. Looks like a code issue."),
            (EN, "Code change - {tech}", "Update the logic in {tech} so that {term} is handled. See spec."),
            (PS, "Error message when saving {page}", "Save fails with an error and the trace points to PeopleCode on {page}."),
            (PS, "Outbound file incomplete", "The {tech} file sent on {date} did not include all {obj} records."),
            (EN, "Report request - {field} by {dept}", "Need a new report showing {field} for {obj} records in {dept}. Mockup attached."),
            (PS, "{tech} step failure", "{tech} stopped at a step; the log shows \"{errmsg}\"."),
            (EN, "PS Query for {dept}", "Could a query be created to pull {obj} information by {field}?"),
            (PS, "Customization broken after PUM update", "The {tech} customization no longer works after the PUM update."),
        ],
        "Security": [
            (PS, "New user setup - {role}", "Please set up {uid} with {role} access to {page}."),
            (PS, "Permission error on {page}", "Getting a permission error on {page} for user {uid}."),
            (PS, "Terminate user access", "Disable {uid}; last day was {date}."),
            (PS, "Missing employees in {page}", "Security looks wrong. {role} can't see {dept} data."),
            (PS, "Transfer - update roles", "Employee {uid} transferred to {dept} and needs roles updated."),
            (PS, "Disable login {uid}", "Account {uid} should be locked."),
            (EN, "Who has {role}?", "Need a list of all user IDs holding {role}."),
            (PS, "Short-term access request", "Give {uid} access to {page} until {date}."),
        ],
        "Administration": [
            (PS, "Jobs not running", "Nothing has run on the scheduler since {date}; {process} and everything else sits in Queued."),
            (PS, "Need {env} refreshed", "Copy production down to {env} please."),
            (PS, "System very slow", "{page} is timing out for users in {dept}."),
            (PS, "IB errors for {tech}", "Message queue shows errors for {tech}."),
            (PS, "Project migration request", "Move {proj} to {env}."),
            (PS, "Can't find {process} output", "Ran {process} but the report never posted to Report Manager."),
            (PS, "Patch {env}", "{env} needs the latest tools patch."),
            (EN, "Add recurrence for {process}", "Please schedule {process} to run every night."),
        ],
    },
}

OPENERS = ["", "", "", "Business Unit = {bu}\nPPE {date}\n\n", "Requested by {dept}.\n\n", "Hi team,\n\n"]
CLOSERS = ["", "", "", "\n\nSee attachment.", "\n\nThis is impacting the next pay period.",
           "\n\nSteps to reproduce:\n1. Navigate to {nav}\n2. Open the affected record\n3. Save",
           "\n\nPlease let us know if more information is needed."]

STATUSES_OPEN = ["1-New", "2-Assigned/In Queue", "2-Pending Validation", "3-In Development",
                 "4-Migrated to Test", "5-Ready for Test", "6-In Testing", "7-Approved for Production", "8-On Hold"]
STATUSES_CLOSED = ["10-Closed", "11-Migrated to Production", "9-Cancelled"]
RESOLUTION = {
    "Functional": ["Configuration Change", "User Training/Procedure", "Data Fix", "New Rqmt/Approved Enhancement"],
    "Technical": ["Code Fix", "New Rqmt/Approved Enhancement", "Data Fix", "Vendor Patch/Bundle"],
    "Security": ["Security Update", "Security Update", "User Training/Procedure"],
    "Administration": ["System Administration", "Vendor Patch/Bundle", "No Action Required"],
}
DUE_DAYS = {"H": 5, "M": 10, "L": 20}


# Cues mirror the priority signals in docs/ticket-taxonomy.md so labels and documented rules agree.
HIGH_CUES = ("next pay period", "pay confirmation", "separated", "last day", "queued", "nothing has run",
             "timing out", "two minutes", "year-end", "w-2", "several departments", "multiple departments")
LOW_CUES = ("question on", "how to", "guidance needed", "who has", "audit listing", "list of all user",
            "comments field", "display-only", "search by employee", "supervisor name")


def priority_weights(text, area):
    """Priority follows the ticket's own cue words (with some noise), as described in docs/ticket-taxonomy.md."""
    t = text.lower()
    if any(c in t for c in HIGH_CUES):
        return [8, 2, 0.5]
    if any(c in t for c in LOW_CUES):
        return [0.5, 2, 8]
    return [2, 6, 2] if area not in ("Security", "Administration") else [3, 5, 2]


def cap(s):
    return s[0].upper() + s[1:] if s else s


class Gen:
    def __init__(self, rng):
        self.r = rng

    def slots(self, mod):
        r, v = self.r, M[mod]
        d = START_DATE + dt.timedelta(days=r.randrange((REPORT_DATE - START_DATE).days))
        i = r.randrange(len(DEPTS))
        s = dict(page=r.choice(v["pages"]), nav=v["nav"], process=r.choice(v["processes"]),
                 report=r.choice(v["reports"]), obj=r.choice(v["objs"]), field=r.choice(v["fields"]),
                 errmsg=r.choice(v["errmsgs"]), tech=r.choice(v["tech"]), term=r.choice(v["terms"]),
                 role=r.choice(v["roles"]), dept=DEPTS[i], bu=BUS[i], date=d.strftime("%m/%d/%Y"),
                 env=r.choice(ENVS), mod=r.choice(MODS), runctl=f"{mod}_NIGHTLY",
                 pi=str(r.randrange(1_000_000, 9_999_999)),
                 proj=f"PRJ_{mod}_{r.randrange(1000, 9999)}",
                 # obviously synthetic user IDs (two draws kept so the rest of the data is unchanged)
                 uid=f"SYNUSER{FIRST.index(r.choice(FIRST)) * 100 + LAST.index(r.choice(LAST)):04d}")
        s["Term"], s["Report"], s["Process"] = cap(s["term"]), cap(s["report"]), cap(s["process"])
        return s

    def pick_area(self, mod):
        return self.r.choices(AREAS, weights=AREA_MIX.get(mod, DEFAULT_AREA_MIX))[0]

    def ticket(self, bank, mod=None, area=None, tidx=None, fixed=None, group=""):
        r = self.r
        mod = mod or r.choices(list(M), weights=[m["weight"] for m in M.values()])[0]
        area = area or self.pick_area(mod)
        templates = BANK[bank][area]
        tidx = r.randrange(len(templates)) if tidx is None else tidx
        itype, title_t, desc_t = templates[tidx]
        s = self.slots(mod)
        if fixed:
            s.update(fixed)
        desc = r.choice(OPENERS) + desc_t + r.choice(CLOSERS)
        title, desc = title_t.format(**s), desc.format(**s)
        title = cap(title)
        prio = r.choices("HML", weights=priority_weights(title + " " + desc, area))[0]
        return dict(mod=mod, area=area, itype=itype, title=title, desc=desc, prio=prio, group=group)


def finish(tickets, rng, first_num):
    """Assign dates, statuses, people and ticket numbers in open-date order."""
    span = (REPORT_DATE - START_DATE).days
    for t in tickets:
        t.setdefault("open", START_DATE + dt.timedelta(days=rng.randrange(span)))
    tickets.sort(key=lambda t: t["open"])
    seen_group = {}
    rows = []
    for n, t in enumerate(tickets):
        num = f"IN{first_num + n:06d}"
        age_now = (REPORT_DATE - t["open"]).days
        closed = rng.random() < min(0.92, age_now / 120)
        needs_cr = t["itype"] == "Enhancement Request" or t["area"] == "Technical"
        cr = f"CR{rng.randrange(1000, 9999):06d}" if needs_cr and rng.random() < 0.8 else None
        if closed:  # only tickets with a CR are migrated
            status = rng.choices(STATUSES_CLOSED, weights=[6, 3 if cr else 0, 1])[0]
        else:
            status = rng.choice(STATUSES_OPEN)
        closed_date = t["open"] + dt.timedelta(days=rng.randint(1, max(1, min(age_now, 90)))) if closed else None
        aging = ((closed_date or REPORT_DATE) - t["open"]).days
        desc = t["desc"]
        if t["group"]:
            prev = seen_group.get(t["group"])
            if prev and rng.random() < 0.5:
                desc += f"\n\nThis has been done before, reference {prev}."
            seen_group[t["group"]] = num
        t["row"] = row = {
            "Module": t["mod"], "Priority": t["prio"], "Issue Type": t["itype"], "Issue Num": num,
            "Title": t["title"], "Description": desc, "Status": status,
            "Assigned To": rng.choice(ANALYSTS) if rng.random() < 0.85 else None,
            "Opened By": rng.choice(REQUESTERS),
            "Open Date": t["open"], "Closed Date": closed_date, "Aging": aging,
            "Resolution Code": rng.choice(RESOLUTION[t["area"]]) if closed and status != "9-Cancelled" else (
                "Duplicate" if status == "9-Cancelled" else None),
            "CR": cr, "Due Date": t["open"] + dt.timedelta(days=DUE_DAYS[t["prio"]]),
            "Developer": rng.choice(DEVELOPERS) if t["area"] == "Technical" or cr else None,
            "Issue Area": t["area"], "Recurring Group": t["group"] or None,
        }
        rows.append(row)
    return rows


def recurring_seeds(rng, n=24):
    """Recurring issues: same module, area, template and key details, reported several times."""
    gen = Gen(rng)
    seeds = []
    for k in range(n):
        mod = rng.choices(list(M), weights=[m["weight"] for m in M.values()])[0]
        area = gen.pick_area(mod)
        tidx = rng.randrange(8)
        s = gen.slots(mod)
        fixed = {key: s[key] for key in ("page", "process", "obj", "field", "tech", "term", "report",
                                         "errmsg", "dept", "bu", "role", "Term", "Report", "Process")}
        seeds.append(dict(group=f"RG-{k + 1:02d}", mod=mod, area=area, tidx=tidx, fixed=fixed))
    return seeds


def build(bank, count, rng, seeds, per_group):
    gen = Gen(rng)
    out = []
    for sd in seeds:
        for _ in range(rng.randint(*per_group)):
            out.append(gen.ticket(bank, sd["mod"], sd["area"], sd["tidx"], sd["fixed"], sd["group"]))
    while len(out) < count:
        out.append(gen.ticket(bank))
    return out[:count]


def write_xlsx(path, rows, columns):
    wb = Workbook()
    ws = wb.active
    ws.title = "sheet1"
    ws.append(columns)
    for c in ws[1]:
        c.font = Font(bold=True)
    for row in rows:
        ws.append([row[c] for c in columns])
    for col_idx, name in enumerate(columns, 1):
        letter = get_column_letter(col_idx)
        if name in ("Open Date", "Closed Date", "Due Date"):
            for cell in ws[letter][1:]:
                cell.number_format = "mm/dd/yyyy"
        ws.column_dimensions[letter].width = {"Title": 45, "Description": 80}.get(name, 16)
    ws.freeze_panes = "A2"
    wb.save(path)


def write_csv(path, rows, columns):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=columns)
        w.writeheader()
        for row in rows:
            w.writerow({c: (row[c].isoformat() if isinstance(row[c], dt.date) else row[c]) for c in columns})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", type=int, default=1000)
    ap.add_argument("--test", type=int, default=250)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    rng = random.Random(a.seed)
    seeds = recurring_seeds(rng)
    train = build("A", a.train, rng, seeds, (3, 6))
    test = build("B", a.test, rng, seeds, (1, 2))
    # one shared timeline and numbering for both sets, then split back
    finish(train + test, rng, first_num=1001)
    train_rows = [t["row"] for t in sorted(train, key=lambda t: t["open"])]
    test_rows = [t["row"] for t in sorted(test, key=lambda t: t["open"])]

    OUT.mkdir(parents=True, exist_ok=True)
    cols = PHIRE_COLUMNS + LABEL_COLUMNS
    write_xlsx(OUT / "phire_train.xlsx", train_rows, cols)
    write_csv(OUT / "phire_train.csv", train_rows, cols)
    write_xlsx(OUT / "phire_test.xlsx", test_rows, cols)
    write_csv(OUT / "phire_test.csv", test_rows, cols)
    write_xlsx(OUT / "phire_demo_export.xlsx", test_rows, PHIRE_COLUMNS)
    print(f"train {len(train_rows)}  test {len(test_rows)}  recurring groups {len(seeds)}  -> {OUT}")


if __name__ == "__main__":
    main()
