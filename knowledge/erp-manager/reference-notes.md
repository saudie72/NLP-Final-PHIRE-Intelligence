# ERP Manager reference notes

## Time-to-pay integration (why PY + TL + AM is one portfolio)
- PeopleSoft Absence Management, Time and Labor and Payroll for North America integrate: absences convert to
  payable time, Time and Labor sends payable time to Payroll, and TRCs map to earnings codes and absence takes.
  A setup error in one module shows up as a pay error in another.
- Source: https://docs.oracle.com/en/applications/peoplesoft/human-capital-management/9.2.055/peoplesoft-time-and-labor/integrating-absence-management-time-labor-payroll-north-america.html

## Priority and severity
- Severity describes impact (how many users, payroll or compliance at risk); priority adds urgency (deadlines such
  as pay confirmation or year-end). Common practice uses 3–5 levels with clear definitions.
- Source: https://www.atlassian.com/incident-management/kpis/severity-levels

## Signals in this app
- Rule-based priority cues (docs/ticket-taxonomy.md), NLTK urgency keywords and VADER sentiment. VADER alone is a
  weak priority signal (precision about 0.37 for H on the synthetic data); urgency keywords are stronger (about 0.53).
- Source: reports/nlp-language-evaluation.md
