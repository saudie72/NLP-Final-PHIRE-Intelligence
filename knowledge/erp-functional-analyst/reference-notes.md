# ERP Functional Analyst reference notes

(See also `tl-trc-setup-synthetic.md` in this folder: the synthetic TRC setup used for testing.)

## Time and Labor / Absence / Payroll integration
- Time Reporting Codes (TRCs) map to Payroll for North America earnings codes and to Absence Management elements;
  this mapping is set up on the TRC pages. Absence Conversion sends absence data to payable time.
- Source: https://docs.oracle.com/en/applications/peoplesoft/human-capital-management/9.2.055/peoplesoft-time-and-labor/integrating-absence-management-time-labor-payroll-north-america.html

## Absence Management
- Entitlements (accruals), takes (absences), absence requests and balances; absence calculation and finalize.
- Source: https://docs.oracle.com/en/applications/peoplesoft/human-capital-management/9.2.055/peoplesoft-absence-management/absence-management-features.html

## HCM 9.2 PeopleBooks
- Module documentation index for Core HR, Payroll, Time and Labor, Benefits, Recruiting, ePerformance.
- Source: https://docs.oracle.com/cd/F13810_02/hcm92pbr29/eng/hcm

## Configuration vs development
- Effective-dated setup rows explain many "it changed two periods ago" tickets: always compare rows around the date.
- New report, query or interface → Technical (erp-developer); new values on an existing page → Functional.
- Source: docs/ticket-taxonomy.md
