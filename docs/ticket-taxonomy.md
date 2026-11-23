# 6. Ticket classification taxonomy

Every ticket gets **two independent labels**:

1. **Module**: which PeopleSoft product area it concerns (see [peoplesoft-modules.md](peoplesoft-modules.md)).
2. **Issue area**: what kind of work it is: **Functional, Technical, Security or Administration**.

They are independent: a Time and Labor ticket can be functional (schedule setup), technical (a PeopleCode
defect on the timesheet), security (an approver can't see their employees) or administration (Time Admin stuck
in Queued). The dashboard crosses the two labels in a heat map.

## Issue areas

| Area | Definition | Strong cue words | Typical resolution | Lead agent |
|---|---|---|---|---|
| **Functional** | Business process, configuration, data or how-to. No code change needed. | setup, configure, schedule, effective date, incorrect amount, doesn't match, how do I, mass update, procedure, report totals | Configuration change, data fix, user training | ERP Functional Analyst |
| **Technical** | Code or object change, or a code defect. | PeopleCode, Application Engine, SQR, SQL error, abend, step fails, interface file, query, report layout, retrofit, BI Publisher | Code fix, new or changed object (usually with a CR) | ERP Developer |
| **Security** | Who can access what. | access, role, permission, not authorized, user ID, row security, lock, disable, separated, remove access | Security update | PeopleSoft Administrator, Security Reviewer |
| **Administration** | Platform, batch infrastructure, environments, performance. | Process Scheduler, Queued, Report Manager, Integration Broker, environment, refresh, migrate, patch, slow, timeout | System administration, vendor patch | PeopleSoft Administrator |

Tie-break rules (for labeling the synthetic data and for the ERP QA Developer's review):

- If the ticket asks for a **new report, query or interface**, label **Technical**, even when the request is business-driven.
- If the ticket asks for **new values or setup** in an existing page, label **Functional**.
- If a batch process **fails with an error message from the program**, label **Technical**. If it **does not
  start or never finishes** (Queued, server down), label **Administration**.
- Anything about **roles, permission lists, user IDs or row security** is **Security**, whatever the module.

## Issue type (from PHIRE) vs. issue area (from the model)

PHIRE's **Issue Type** column (Enhancement Request, Production Support Item) says *why* the ticket exists.
Issue area says *what kind of work* it needs. Both are kept. For example, an Enhancement Request can be
Functional (new configuration values) or Technical (new report).

## Examples (written for this doc, not from real tickets)

| Title | Module | Area | Why |
|---|---|---|---|
| Assign the 4x10 work schedule to the new Parks workgroup | TL | Functional | Schedule setup, no code |
| Timesheet save fails with PeopleCode error after image update | TL | Technical | Code defect |
| Time approver can't see employees in new department | TL | Security | Row security |
| Time Administration has been in Queued since last night | TL | Administration | Scheduler problem |
| New report of garnishment deductions by pay period for Finance | PY | Technical | New report object |
| Add a new Action Reason for voluntary demotion | HR | Functional | Setup table values |
| Voucher Build ends with SQL error in step | AP | Technical | Program error |
| Remove all roles for separated employee | SEC | Security | Access removal |

## Priority suggestion signals

The model suggests **H / M / L** from cues and compares it with PHIRE's Priority:

- **High:** payroll at risk ("before pay confirm", "checks", "pay period end"), production down, multiple
  departments affected, separation access removal, year-end deadlines.
- **Low:** questions, how-to, cosmetic page changes, audit listings with no deadline.
- **Medium:** everything else.

The suggestion is advisory. The dashboard shows where suggested and recorded priority disagree.
