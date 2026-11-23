# 3. PeopleSoft modules

The application classifies each ticket into one **module**. Module codes below follow the observed
two-letter style (`HR`, `PY`, `TL`). Codes other than those three are **proposed** and must be confirmed
against your PHIRE instance.

Sources: [Oracle PeopleSoft HCM 9.2 PeopleBooks](https://docs.oracle.com/cd/F13810_02/hcm92pbr29/eng/hcm),
[HCM 9.2 PeopleBooks PDF index](https://docs.oracle.com/cd/E40044_01/psft/pdf/report_hgpc.pdf),
[Integrating Absence Management, Time and Labor, and Payroll for North America](https://docs.oracle.com/en/applications/peoplesoft/human-capital-management/9.2.055/peoplesoft-time-and-labor/integrating-absence-management-time-labor-payroll-north-america.html),
[Absence Management Features](https://docs.oracle.com/en/applications/peoplesoft/human-capital-management/9.2.055/peoplesoft-absence-management/absence-management-features.html),
[Time and Labor Integrations](https://docs.oracle.com/cd/F13810_02/hcm92pbr29/eng/hcm/htlr/concept_TimeandLaborIntegrations-e3195b.html).

## HCM 9.2

| Code | Module | Key pages / components | Key processes | Vocabulary that signals this module |
|---|---|---|---|---|
| `HR` (observed) | Core HR (Workforce Administration) | Job Data, Personal Data, Add a Person, Position Data, Department Table | Hire, rehire, transfer, termination, position management | job code, action reason, reports to, position number, effective date, union code |
| `PY` (observed) | Payroll for North America | Paysheets, Review Paycheck, Additional Pay, Pay Calendar, Direct Deposit | Pay Calculation, Pay Confirmation, Pay Unconfirm, off-cycle, year-end W-2 | paycheck, earnings code, deduction, garnishment, withholding, W-2, retro pay, payroll register |
| `TL` (observed) | Time and Labor | Timesheet, Approve Reported Time, Timesheet Lockdown, Assign Work Schedule, Manage Exceptions | Time Administration, Load Time and Labor, payable time | TRC, reported/payable time, workgroup, taskgroup, schedule, holiday schedule, PPE, comp time |
| `AM` | Absence Management | Absence Request, Absence Balances, Absence Entitlement | Absence Calculation, Finalize, Absence Conversion to payable time | sick leave, vacation accrual, FMLA, entitlement, balance, leave donation |
| `BN` | Benefits (Base Benefits / Benefits Administration) | Benefits Enrollment, Dependent Information, Benefit Program Table | Open Enrollment, BenAdmin event processing, carrier files | dependent, coverage code, life event, open enrollment, COBRA, 834 file |
| `RC` | Recruiting (Talent Acquisition Manager) | Job Opening, Manage Applicant, Prepare Job Offer | Posting, applicant hire | requisition, applicant, offer letter, job posting, background check |
| `EP` | ePerformance | Performance Document, Manager Evaluation | Create Evaluations, document routing | evaluation, rating, review period, goals |

Integration note: Time and Labor, Absence Management and Payroll are tightly linked. TRCs map to payroll
earnings codes and absence elements, and absences flow into payable time. Tickets about these three modules
are the most likely to be confused with each other, so the taxonomy keeps them separate and the evaluation
reports their confusion matrix.

## FSCM 9.2

| Code | Module | Key pages / components | Key processes | Vocabulary |
|---|---|---|---|---|
| `GL` | General Ledger | Journal Entry, Ledger Inquiry, ChartField Values, Open Period Update | Journal Edit, Journal Post, allocations, close | journal, ledger, ChartField, account, fund, period, trial balance, nVision |
| `AP` | Accounts Payable | Voucher, Supplier Information, Payment Inquiry, Match Workbench | Voucher Build, Matching, Pay Cycle, Voucher Post | voucher, supplier, invoice, payment, check, ACH, 1099, positive pay |
| `PO` | Purchasing (eProcurement) | Requisition, Purchase Order, Receiving, Contract | Sourcing Workbench, PO dispatch, budget check, PO rollover | requisition, PO, buyer, receipt, encumbrance, change order, approval workflow |
| `EX` | Expenses | Expense Report, Travel Authorization, Cash Advance | Expense approval and payment | mileage, per diem, travel, receipt, reimbursement |
| `PC` | Project Costing (and Grants) | Project General, Activities, Transactions | Costing loads, pricing, billing interface | project ID, activity, analysis type, grant, cost transfer |

## Cross-cutting codes

| Code | Area | Notes |
|---|---|---|
| `SEC` | Security | Access requests, role changes, row security. Some sites log these under the business module instead. **To confirm.** |
| `PT` | PeopleTools / Administration | Process Scheduler, Integration Broker, environments, patches. **To confirm.** |

## Scope note

Grants, Contracts, Position Management and other modules mentioned in the project plan are folded into the
nearest module above (Grants → `PC`, Position Management → `HR`) until the real Module list is confirmed.
