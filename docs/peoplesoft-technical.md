# 4. PeopleSoft technical and administration components

These terms tell the classifier that a ticket is **Technical** (code needs changing) or **Administration**
(the platform needs attention), regardless of module.

Sources: [PeopleTools Process Scheduler PeopleBook (8.60)](https://docs.oracle.com/cd/G10810_01/pt860pbr4/eng/pt/tprs.html),
[Editing the Process Scheduler configuration file](https://docs.oracle.com/cd/F28299_01/pt857pbr3/eng/pt/tprs/task_EditingthePeopleSoftProcessSchedulerConfigurationFile-dc0773.html),
[Implementing PeopleSoft Integration Broker (8.59)](https://docs.oracle.com/cd/F86650_01/pt859pbr5/eng/pt/tibr/ImplementingPeopleSoftIntegrationBroker-07659a.html),
[Integration Broker PeopleBook (8.61)](https://docs.oracle.com/cd/G10809_01/pt861pbr4/eng/pt/tibr.html),
[PeopleTools Product/Feature PeopleBook Index](https://docs.oracle.com/cd/F86650_01/pt859pbr5/eng/pt/tgst/PeopleToolsProduct_FeaturePeopleBookIndex.html).

## Development objects (signal: Technical)

| Component | What it is | Typical ticket language |
|---|---|---|
| PeopleCode | Event-driven code on records, pages and components (FieldChange, SavePreChange, etc.) | "error on save", "PeopleCode", "trace points to", "field not defaulting" |
| Application Engine (AE) | Batch programs made of sections, steps and SQL/PeopleCode actions | "AE abended", "fails at step", program names in CAPS such as `XX_INTFC` |
| SQR | Legacy report and batch language | "SQR", "report layout", ".sqr" |
| BI Publisher / XML Publisher | Report templates (RTF/XSL) over data sources | "BIP", "template", "report layout" |
| PS Query | User-built queries over records | "query", "PS Query", "run to Excel" |
| SQL | Database statements in AE, SQR, views | "SQL error", "ORA-", "selection criteria" |
| Application Packages | Object-oriented PeopleCode classes | "app package", "class" |
| Component Interface | API wrapper for loading data through a component | "CI", "load", "Excel to CI" |
| COBOL | Delivered payroll engines (e.g. pay calculation) | "COBOL", "PSPPYRUN" |
| Interfaces / files | Inbound and outbound files to banks, carriers, vendors | "outbound file", "interface", "missing records", "positive pay", "834" |

## Platform and operations (signal: Administration)

| Component | What it is | Typical ticket language |
|---|---|---|
| Process Scheduler | Runs batch processes (AE, SQR, COBOL, nVision) on servers; tracked in Process Monitor | "stuck in Queued", "Not Posted", "server down", "run control", "recurrence" |
| Report Manager | Where process output is posted | "report not posted", "can't find output" |
| Integration Broker (IB) | Messaging layer with an **integration gateway** and **integration engine**; sync and async services | "messages in error", "IB monitor", "queue paused", "gateway" |
| Application server / web server domains | Tuxedo app servers and WebLogic web servers | "system slow", "timeout", "domain restart" |
| Environments | DEV, TST, UAT, TRN, PRD copies | "refresh TST from production", "environment down" |
| Migrations | Moving projects between environments (PHIRE automates this) | "migrate project", "migrated to production" |
| PeopleTools patches and PUM images | Oracle's update delivery (PeopleSoft Update Manager images) | "apply patch", "PUM image", "retrofit" |

## How this helps the ERP Developer and PeopleSoft Administrator agents

When a ticket names a delivered or custom object, the agents can propose **where to investigate** (for
example: check the save PeopleCode on the component, check the AE trace for the process instance, check the
IB monitor queue). The application must present these as hypotheses for investigation, never as a diagnosed
root cause.
