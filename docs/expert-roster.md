# Expert roster

The 16-agent team for **PeopleSoft PHIRE Ticket Intelligence**: who does what, which research each agent relies on, what it delivers in version 1, and the skills the agents share. Built from the research in this folder. The agent files themselves are created in step 5.

Two QA roles are deliberately separate: the **ERP QA Developer** checks the *PeopleSoft interpretation* of tickets (are the labels and conclusions right?), and the **QA Tester** checks the *application* (does it work?).

At runtime, the application does not call all 16 agents. Ticket analysis uses the trained NLP model and rules in the browser. The agents build and test the application, and a few ERP specialists can be consulted on individual tickets through the Orchestrator.


## Project management and coordination

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 1 | **Orchestrator** (`orchestrator`) | Takes any request, decides which agents to involve, sequences their work, resolves conflicts and returns one consolidated answer that separates observations from hypotheses. | all, starting with README.md | Build plan per step; consolidated multi-agent ticket assessments | `team-coordination`, `agent-authoring` |
| 2 | **Product Manager** (`product-manager`) | Owns scope, requirements and acceptance criteria for version 1 and keeps work aligned with the course assignment. | README.md, synthetic-dataset-plan.md, nlp-methods.md | Requirements and acceptance criteria; version 1 checklist; Resources page content | `dashboard-design`, `requirements-and-acceptance`, `team-coordination` |
| 3 | **ERP Manager** (`erp-manager`) | Judges operational priority, business impact, support workload and escalation, and defines what managers need from the dashboard. | phire-overview.md, ticket-taxonomy.md | Priority rules review; dashboard metrics for management | `recurring-issue-clustering`, `priority-suggestion`, `dashboard-design`, `requirements-and-acceptance` |
| 4 | **Meta Agent** (`meta-agent`) | Creates, updates and improves agents and skills so the team stays consistent as the project grows. | expert-roster.md, all agent and skill files | New or revised agents and skills on request | `agent-authoring` |

## PeopleSoft ERP specialists

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 5 | **ERP Business Analyst** (`erp-business-analyst`) | Reads ticket text for business requirements and impact, spots recurring business problems and turns user concerns into functional requirements. | phire-overview.md, ticket-taxonomy.md, peoplesoft-modules.md | Business-impact notes on recurring issues; requirement statements | `column-mapping`, `peoplesoft-module-identification`, `similar-ticket-search`, `recurring-issue-clustering`, `priority-suggestion`, `requirements-and-acceptance` |
| 6 | **ERP Functional Analyst** (`erp-functional-analyst`) | Assigns PeopleSoft module and affected business process, and separates functional and configuration issues from technical ones. | peoplesoft-modules.md, ticket-taxonomy.md | Labeling rules; review of synthetic-data labels; module vocabulary | `peoplesoft-module-identification`, `issue-area-triage`, `synthetic-ticket-generation`, `erp-test-scenarios` |
| 7 | **ERP Developer** (`erp-developer`) | Brings expertise in PeopleCode, Application Engine, Integration Broker, SQR, SQL and Application Packages, and suggests where to investigate technical tickets. | peoplesoft-technical.md, ticket-taxonomy.md | Technical cue vocabulary; investigation hints shown in ticket detail | `peoplesoft-module-identification`, `issue-area-triage`, `erp-test-scenarios`, `technical-investigation-hints` |
| 8 | **PeopleSoft Administrator** (`peoplesoft-admin`) | Covers PeopleTools, Process Scheduler, environments, integration and security administration issues. | peoplesoft-technical.md, peoplesoft-security.md | Administration and security cue vocabulary; investigation hints | `issue-area-triage`, `technical-investigation-hints` |
| 9 | **ERP QA Developer** (`erp-qa-developer`) | Validates the PeopleSoft interpretation of tickets: checks classifications against ERP knowledge and writes ERP test scenarios. Does not test the application itself. | ticket-taxonomy.md, peoplesoft-modules.md, synthetic-dataset-plan.md | Label audit of train/test data; ERP test scenarios; error analysis of misclassified tickets | `issue-area-triage`, `classifier-evaluation`, `synthetic-ticket-generation`, `erp-test-scenarios` |

## Application development and NLP

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 10 | **Software Architect** (`software-architect`) | Designs the application structure, data flow, interfaces between components and the browser-only processing model. | data-handling.md, nlp-methods.md, phire-export-format.md | Architecture note; folder layout; Netlify configuration | `data-handling-review`, `netlify-deployment` |
| 11 | **NLP Specialist** (`nlp-specialist`) | Builds preprocessing, classification, keyword extraction, similarity and clustering, and the offline training and evaluation pipeline. | nlp-methods.md, ticket-taxonomy.md, synthetic-dataset-plan.md | Trained models exported to JSON; results report with metrics | `peoplesoft-module-identification`, `issue-area-triage`, `ticket-classification`, `keyword-extraction`, `similar-ticket-search`, `recurring-issue-clustering`, `priority-suggestion`, `classifier-evaluation`, `synthetic-ticket-generation` |
| 12 | **Data Engineer** (`data-engineer`) | Parses PHIRE Excel exports, handles column mapping and validation, and generates the synthetic datasets. | phire-export-format.md, synthetic-dataset-plan.md, data-handling.md | Synthetic data generator and files; import and validation logic | `phire-export-parsing`, `column-mapping`, `synthetic-ticket-generation`, `data-handling-review`, `excel-report-export` |
| 13 | **Front-End Developer** (`frontend-developer`) | Builds the React application: upload, column mapping, dashboard, filters, ticket detail and Resources page. | phire-export-format.md, ticket-taxonomy.md | React UI | `column-mapping`, `app-testing`, `dashboard-design`, `netlify-deployment` |
| 14 | **Back-End Developer** (`backend-developer`) | Implements the analysis engine in JavaScript (model inference, similarity, clustering, priority) and the Excel report export. | nlp-methods.md, phire-export-format.md | Analysis engine module; Excel export; parity test against Python | `phire-export-parsing`, `ticket-classification`, `keyword-extraction`, `similar-ticket-search`, `app-testing`, `excel-report-export` |
| 15 | **QA Tester** (`qa-tester`) | Tests that the application works: functional, regression, browser and edge-case tests. Does not judge PeopleSoft interpretation. | phire-export-format.md, data-handling.md | Automated tests; test report | `phire-export-parsing`, `classifier-evaluation`, `app-testing`, `excel-report-export` |
| 16 | **Security Reviewer** (`security-reviewer`) | Reviews upload handling, confidential-data exposure, secrets, content security policy and deployment settings. | data-handling.md, peoplesoft-security.md | Security review checklist and sign-off before deployment | `data-handling-review`, `netlify-deployment` |

## Skills

| Skill | What it does | Used by |
|---|---|---|
| `phire-export-parsing` | Read a PHIRE Excel export, detect headers, normalize dates and text, recompute Aging | Data Engineer, Back-End Developer, QA Tester |
| `column-mapping` | Auto-map PHIRE headers to app fields and handle renamed, missing or extra flex-field columns | Data Engineer, Front-End Developer, ERP Business Analyst |
| `peoplesoft-module-identification` | Recognize which PeopleSoft module a ticket concerns from pages, processes and vocabulary | ERP Functional Analyst, ERP Business Analyst, ERP Developer, NLP Specialist |
| `issue-area-triage` | Decide Functional / Technical / Security / Administration using the taxonomy tie-break rules | ERP Functional Analyst, ERP Developer, PeopleSoft Administrator, ERP QA Developer, NLP Specialist |
| `ticket-classification` | Train and run TF-IDF + logistic regression (with a Naive Bayes baseline) for module and issue area | NLP Specialist, Back-End Developer |
| `keyword-extraction` | Extract top terms per ticket and contrastive keywords per module or cluster | NLP Specialist, Back-End Developer |
| `similar-ticket-search` | Find related and possible duplicate tickets with cosine similarity and explicit IN-number references | NLP Specialist, Back-End Developer, ERP Business Analyst |
| `recurring-issue-clustering` | Group tickets into recurring issues and describe each cluster | NLP Specialist, ERP Business Analyst, ERP Manager |
| `priority-suggestion` | Suggest H / M / L from cue phrases and issue area, and flag disagreements with recorded priority | ERP Manager, ERP Business Analyst, NLP Specialist |
| `classifier-evaluation` | Cross-validate, score on the held-out test set (accuracy, precision, recall, F1, confusion matrix) and analyze errors | NLP Specialist, ERP QA Developer, QA Tester |
| `synthetic-ticket-generation` | Generate realistic, labeled synthetic PHIRE tickets with separate train and test phrasing | Data Engineer, NLP Specialist, ERP Functional Analyst, ERP QA Developer |
| `erp-test-scenarios` | Write PeopleSoft test scenarios that reproduce and validate a reported issue | ERP QA Developer, ERP Functional Analyst, ERP Developer |
| `technical-investigation-hints` | Point to PeopleCode, AE, SQR, IB or scheduler areas worth checking, labeled as hypotheses | ERP Developer, PeopleSoft Administrator |
| `data-handling-review` | Check that no real ticket data is committed, sent or stored, and that processing stays in the browser | Security Reviewer, Data Engineer, Software Architect |
| `app-testing` | Functional, regression and browser tests of upload, mapping, dashboard and export | QA Tester, Front-End Developer, Back-End Developer |
| `dashboard-design` | Choose and lay out the charts and tables managers need | Front-End Developer, ERP Manager, Product Manager |
| `excel-report-export` | Write the original rows plus AI-generated columns to a downloadable Excel workbook | Back-End Developer, Data Engineer, QA Tester |
| `requirements-and-acceptance` | Turn goals into requirements with testable acceptance criteria | Product Manager, ERP Business Analyst, ERP Manager |
| `netlify-deployment` | Configure build, headers, CSP and deploy to Netlify | Software Architect, Security Reviewer, Front-End Developer |
| `team-coordination` | Break work into tasks, route them to the right agents and merge results | Orchestrator, Product Manager |
| `agent-authoring` | Create or improve agent and skill definitions in the project's standard format | Meta Agent, Orchestrator |

## Skill matrix

Columns are agent numbers from the roster above. ● = uses the skill.

| Skill | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | Agents |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `phire-export-parsing` |  |  |  |  |  |  |  |  |  |  |  | ● |  | ● | ● |  | 3 |
| `column-mapping` |  |  |  |  | ● |  |  |  |  |  |  | ● | ● |  |  |  | 3 |
| `peoplesoft-module-identification` |  |  |  |  | ● | ● | ● |  |  |  | ● |  |  |  |  |  | 4 |
| `issue-area-triage` |  |  |  |  |  | ● | ● | ● | ● |  | ● |  |  |  |  |  | 5 |
| `ticket-classification` |  |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  | 2 |
| `keyword-extraction` |  |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  | 2 |
| `similar-ticket-search` |  |  |  |  | ● |  |  |  |  |  | ● |  |  | ● |  |  | 3 |
| `recurring-issue-clustering` |  |  | ● |  | ● |  |  |  |  |  | ● |  |  |  |  |  | 3 |
| `priority-suggestion` |  |  | ● |  | ● |  |  |  |  |  | ● |  |  |  |  |  | 3 |
| `classifier-evaluation` |  |  |  |  |  |  |  |  | ● |  | ● |  |  |  | ● |  | 3 |
| `synthetic-ticket-generation` |  |  |  |  |  | ● |  |  | ● |  | ● | ● |  |  |  |  | 4 |
| `erp-test-scenarios` |  |  |  |  |  | ● | ● |  | ● |  |  |  |  |  |  |  | 3 |
| `technical-investigation-hints` |  |  |  |  |  |  | ● | ● |  |  |  |  |  |  |  |  | 2 |
| `data-handling-review` |  |  |  |  |  |  |  |  |  | ● |  | ● |  |  |  | ● | 3 |
| `app-testing` |  |  |  |  |  |  |  |  |  |  |  |  | ● | ● | ● |  | 3 |
| `dashboard-design` |  | ● | ● |  |  |  |  |  |  |  |  |  | ● |  |  |  | 3 |
| `excel-report-export` |  |  |  |  |  |  |  |  |  |  |  | ● |  | ● | ● |  | 3 |
| `requirements-and-acceptance` |  | ● | ● |  | ● |  |  |  |  |  |  |  |  |  |  |  | 3 |
| `netlify-deployment` |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  | ● | 3 |
| `team-coordination` | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `agent-authoring` | ● |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  | 2 |

**Agent numbers:** 1 Orchestrator, 2 Product Manager, 3 ERP Manager, 4 Meta Agent, 5 ERP Business Analyst, 6 ERP Functional Analyst, 7 ERP Developer, 8 PeopleSoft Administrator, 9 ERP QA Developer, 10 Software Architect, 11 NLP Specialist, 12 Data Engineer, 13 Front-End Developer, 14 Back-End Developer, 15 QA Tester, 16 Security Reviewer.


## How the team works on a ticket (example)

*Ticket (written for this example):* "Approvers can't approve reported time after pay confirmation. Several departments report the same problem."

| Agent | Contribution |
|---|---|
| ERP Business Analyst | Affected process is time approval; impact is late or missing pay for several departments |
| ERP Functional Analyst | Module `TL`; possibly a period-lockdown or approval-setup issue |
| ERP Developer | Hypotheses to check: approval PeopleCode, Time Administration run after confirmation |
| PeopleSoft Administrator | Hypotheses to check: Time Admin stuck in Queued, approval workflow notifications |
| ERP QA Developer | Test scenario: report time, confirm pay, attempt approval for two departments |
| ERP Manager | Priority H; recommends escalation before the next pay period |
| Orchestrator | Consolidates the above, separating what the ticket says from what still needs investigation |
