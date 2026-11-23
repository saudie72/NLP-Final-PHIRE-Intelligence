# Expert roster

The 20-agent team for **PeopleSoft PHIRE Ticket Intelligence**: who does what, which research each agent relies on, what it delivers in version 1, and the skills the agents share. Built from the research in this folder. The agent files themselves are created in step 5.

Two analyst roles are deliberately separate too: the **ERP Business Analyst** owns business cases, stakeholder requirements, process maps and scope; the **ERP Functional Analyst** owns functional specifications, user stories and acceptance criteria, configuration and UAT support.

Two QA roles are deliberately separate: the **ERP QA Developer** checks the *PeopleSoft interpretation* of tickets (are the labels and conclusions right?), and the **QA Tester** checks the *application* (does it work?).

At runtime, the application does not call all 20 agents. Ticket analysis uses the trained NLP model and rules in the browser. The agents build and test the application, and a few ERP specialists can be consulted on individual tickets through the Orchestrator.


## Project management and coordination

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 1 | **Orchestrator** (`orchestrator`) | Takes any request, decides which agents to involve, sequences their work, resolves conflicts and returns one consolidated answer that separates observations from hypotheses. | all, starting with README.md | Build plan per step; consolidated multi-agent ticket assessments | `team-coordination`, `agent-authoring` |
| 2 | **Product Manager** (`product-manager`) | Owns version 1 scope, user stories with acceptance criteria, and alignment with the course assignment. | README.md, synthetic-dataset-plan.md, nlp-methods.md | Scope definition; user stories and acceptance criteria; version 1 checklist; Resources page content | `scope-and-stakeholder-requirements`, `business-case`, `business-process-mapping`, `requirements-and-acceptance`, `dashboard-design`, `team-coordination` |
| 3 | **ERP Manager** (`erp-manager`) | Oversees a portfolio of related modules (for example Payroll, Time and Labor and Absence Management): priority, business impact, escalation, workload across the portfolio, and what management needs on the dashboard. | phire-overview.md, ticket-taxonomy.md | Portfolio priority and escalation rules; dashboard metrics with a module-portfolio filter; business cases for top recurring issues | `business-case`, `business-process-mapping`, `recurring-issue-clustering`, `priority-suggestion`, `dashboard-design`, `vader-sentiment` |
| 4 | **Meta Agent** (`meta-agent`) | Creates, updates and improves agents and skills so the team stays consistent as the project grows. | expert-roster.md, all agent and skill files | New or revised agents and skills on request | `agent-authoring` |

## PeopleSoft ERP specialists

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 5 | **ERP Business Analyst** (`erp-business-analyst`) | Business cases, stakeholder requirements, process maps and scope definitions. Stays at business level and hands detail to the ERP Functional Analyst. | phire-overview.md, ticket-taxonomy.md, peoplesoft-modules.md, expert-roster.md | Business cases for top recurring issues and version 1 features; stakeholder maps and requirements; process maps; version 1 scope (with Product Manager) | `business-case`, `scope-and-stakeholder-requirements`, `business-process-mapping`, `recurring-issue-clustering`, `priority-suggestion` |
| 6 | **ERP Functional Analyst** (`erp-functional-analyst`) | Functional specifications, user stories and acceptance criteria, system configuration, and UAT support. Also assigns module and issue area for tickets. | peoplesoft-modules.md, ticket-taxonomy.md | Functional specs and user stories for version 1; labeling rules and label review; UAT scripts (with ERP QA Developer) | `functional-specification`, `requirements-and-acceptance`, `uat-support`, `peoplesoft-module-identification`, `issue-area-triage`, `synthetic-ticket-generation`, `erp-test-scenarios`, `entity-ruler-patterns` |
| 7 | **ERP Developer** (`erp-developer`) | Brings expertise in PeopleCode, Application Engine, Integration Broker, SQR, SQL and Application Packages, and suggests where to investigate technical tickets. | peoplesoft-technical.md, ticket-taxonomy.md | Technical cue vocabulary; investigation hints shown in ticket detail | `peoplesoft-module-identification`, `issue-area-triage`, `erp-test-scenarios`, `technical-investigation-hints`, `functional-specification`, `entity-ruler-patterns` |
| 8 | **PeopleSoft Administrator** (`peoplesoft-admin`) | Covers PeopleTools, Process Scheduler, environments, integration and security administration issues. | peoplesoft-technical.md, peoplesoft-security.md | Administration and security cue vocabulary; investigation hints | `issue-area-triage`, `technical-investigation-hints` |
| 9 | **ERP QA Developer** (`erp-qa-developer`) | Validates the PeopleSoft interpretation of tickets: checks classifications against ERP knowledge and writes ERP test scenarios. Does not test the application itself. | ticket-taxonomy.md, peoplesoft-modules.md, synthetic-dataset-plan.md | Label audit of train/test data; ERP test scenarios; error analysis of misclassified tickets | `issue-area-triage`, `classifier-evaluation`, `synthetic-ticket-generation`, `erp-test-scenarios`, `uat-support` |

## Application development and NLP

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 10 | **Software Architect** (`software-architect`) | Designs the application structure, data flow, interfaces between components and the browser-only processing model. | data-handling.md, nlp-methods.md, phire-export-format.md | Architecture note; folder layout; Netlify configuration | `data-handling-review`, `netlify-deployment`, `netlify-python-build` |
| 11 | **NLP Specialist** (`nlp-specialist`) | Builds preprocessing, classification, keyword extraction, similarity and clustering, and the offline training and evaluation pipeline. | nlp-methods.md, ticket-taxonomy.md, synthetic-dataset-plan.md | Trained models exported to JSON; results report with metrics | `peoplesoft-module-identification`, `issue-area-triage`, `ticket-classification`, `keyword-extraction`, `similar-ticket-search`, `recurring-issue-clustering`, `priority-suggestion`, `classifier-evaluation`, `synthetic-ticket-generation`, `nltk-text-analysis`, `vader-sentiment`, `spacy-entity-extraction` |
| 12 | **Data Engineer** (`data-engineer`) | Parses PHIRE Excel exports, handles column mapping and validation, and generates the synthetic datasets. | phire-export-format.md, synthetic-dataset-plan.md, data-handling.md | Synthetic data generator and files; import and validation logic | `phire-export-parsing`, `column-mapping`, `synthetic-ticket-generation`, `data-handling-review`, `excel-report-export` |
| 13 | **Front-End Developer** (`frontend-developer`) | Builds the React application: upload, column mapping, dashboard, filters, ticket detail and Resources page. | phire-export-format.md, ticket-taxonomy.md | React UI | `column-mapping`, `app-testing`, `dashboard-design`, `netlify-deployment`, `pyodide-runtime` |
| 14 | **Back-End Developer** (`backend-developer`) | Implements the analysis engine in JavaScript (model inference, similarity, clustering, priority) and the Excel report export. | nlp-methods.md, phire-export-format.md | Analysis engine module; Excel export; parity test against Python | `phire-export-parsing`, `ticket-classification`, `keyword-extraction`, `similar-ticket-search`, `app-testing`, `excel-report-export` |
| 15 | **QA Tester** (`qa-tester`) | Tests that the application works: functional, regression, browser and edge-case tests. Does not judge PeopleSoft interpretation. | phire-export-format.md, data-handling.md | Automated tests; test report | `phire-export-parsing`, `classifier-evaluation`, `app-testing`, `excel-report-export` |
| 16 | **Security Reviewer** (`security-reviewer`) | Reviews upload handling, confidential-data exposure, secrets, content security policy and deployment settings. | data-handling.md, peoplesoft-security.md | Security review checklist and sign-off before deployment | `data-handling-review`, `netlify-deployment` |

## NLP libraries and platform

| # | Agent | Job | Relies on (docs) | Delivers in version 1 | Skills |
|---|---|---|---|---|---|
| 17 | **NLTK Expert** (`nltk-expert`) | NLTK tokenizing, stopwords, VADER sentiment, FreqDist, collocations; build time and live in the browser. | nltk-spacy-netlify.md, nlp-language-evaluation report | `pipeline/nltk_core.py`; NLTK panels; NLTK evaluation | `nltk-text-analysis`, `vader-sentiment`, `classifier-evaluation` |
| 18 | **spaCy Expert** (`spacy-expert`) | spaCy en_core_web_sm entities, EntityRuler for PeopleSoft objects, noun chunks, lemmas, dependency parse (build time). | nltk-spacy-netlify.md, peoplesoft-modules.md, peoplesoft-technical.md | `pipeline/patterns.py`; spaCy panels and entity highlighting; error analysis | `spacy-entity-extraction`, `entity-ruler-patterns`, `noun-chunk-aspects` |
| 19 | **Pyodide Engineer** (`pyodide-engineer`) | Runs NLTK in the browser with self-hosted Pyodide in a Web Worker. | nltk-spacy-netlify.md, data-handling.md | `copy-pyodide.mjs`, `nltkWorker.js`; live NLTK box | `pyodide-runtime`, `data-handling-review`, `app-testing` |
| 20 | **Netlify Engineer** (`netlify-engineer`) | Netlify build and deploy: Python pipeline at build time, Node build, functions, headers, failed deploys. | nltk-spacy-netlify.md, architecture.md | `netlify.toml`; clean-clone build checks | `netlify-python-build`, `netlify-deployment`, `data-handling-review` |

## Skills

33 skills shared across the team.

| Skill | What it does | Used by |
|---|---|---|
| `agent-authoring` | Create or improve agent and skill definition files in this project's standard format | Orchestrator, Meta Agent |
| `app-testing` | Functional, regression and browser tests of upload, column mapping, analysis, dashboard, filters and export | Front-End Developer, Back-End Developer, QA Tester, Pyodide Engineer |
| `business-case` | Build a business case for fixing, automating or enhancing something: problem, options, costs, benefits, ROI and recommendation | Product Manager, ERP Manager, ERP Business Analyst |
| `business-process-mapping` | Map a ticket or feature to the end-to-end business process and organizational workflow it affects: departments, hand-offs, approvals and deadlines | Product Manager, ERP Manager, ERP Business Analyst |
| `classifier-evaluation` | Evaluate classifiers on the held-out test set: accuracy, precision, recall, F1 (per class and macro), confusion matrix, and error analysis | ERP QA Developer, NLP Specialist, QA Tester, NLTK Expert |
| `column-mapping` | Map spreadsheet headers to the app's ticket fields, including renamed, missing or extra PHIRE flex-field columns | Data Engineer, Front-End Developer |
| `dashboard-design` | Choose and lay out dashboard charts and tables for ERP support managers | Product Manager, ERP Manager, Front-End Developer |
| `data-handling-review` | Check that no real ticket data is committed, sent or stored, and that ticket processing stays in the browser | Software Architect, Data Engineer, Security Reviewer, Pyodide Engineer, Netlify Engineer |
| `entity-ruler-patterns` | Write spaCy EntityRuler patterns that label PeopleSoft modules, pages, processes, tools, programs, environments and IDs | ERP Functional Analyst, ERP Developer, spaCy Expert |
| `erp-test-scenarios` | Write PeopleSoft test scenarios that reproduce and validate a reported issue: setup data, steps, expected result | ERP Functional Analyst, ERP Developer, ERP QA Developer |
| `excel-report-export` | Write the original ticket rows plus AI-generated columns to a downloadable Excel workbook | Data Engineer, Back-End Developer, QA Tester |
| `functional-specification` | Write PeopleSoft functional specifications: business rules, affected pages and setup tables, configuration changes, data and reporting requirements | ERP Functional Analyst, ERP Developer |
| `issue-area-triage` | Classify a ticket's issue area as Functional, Technical, Security or Administration using the project taxonomy and tie-break rules | ERP Functional Analyst, ERP Developer, PeopleSoft Administrator, ERP QA Developer, NLP Specialist |
| `keyword-extraction` | Extract keywords per ticket (top TF-IDF terms) and contrastive keywords per module or cluster | NLP Specialist, Back-End Developer |
| `netlify-deployment` | Configure the build, headers and Content-Security-Policy and deploy to Netlify after security sign-off | Software Architect, Front-End Developer, Security Reviewer, Netlify Engineer |
| `netlify-python-build` | Run Python at Netlify build time (NLTK + spaCy pipeline) before the Node build | Software Architect, Netlify Engineer |
| `nltk-text-analysis` | Tokenize, remove stopwords, count words (FreqDist) and find key phrases (bigram collocations) with NLTK | NLP Specialist, NLTK Expert |
| `noun-chunk-aspects` | Find ticket aspects with spaCy noun chunks and the dependency parse, scored with NLTK VADER | spaCy Expert |
| `peoplesoft-module-identification` | Decide which PeopleSoft module a ticket concerns from page, process and business vocabulary | ERP Functional Analyst, ERP Developer, NLP Specialist |
| `phire-export-parsing` | Read a PHIRE Excel export into clean ticket records: find the header row, normalize dates and text, recompute Aging | Data Engineer, Back-End Developer, QA Tester |
| `priority-suggestion` | Suggest H / M / L priority from cue phrases and issue area, and flag disagreements with the recorded PHIRE priority | ERP Manager, ERP Business Analyst, NLP Specialist |
| `pyodide-runtime` | Run Python (NLTK) in the browser with self-hosted Pyodide inside a Web Worker | Front-End Developer, Pyodide Engineer |
| `recurring-issue-clustering` | Group tickets into recurring issues with agglomerative clustering and describe each cluster (size, dates, module, keywords) | ERP Manager, ERP Business Analyst, NLP Specialist |
| `requirements-and-acceptance` | Write user stories with testable acceptance criteria (Given / When / Then) | Product Manager, ERP Functional Analyst |
| `scope-and-stakeholder-requirements` | Define scope (in, out, assumptions, constraints) and gather stakeholder requirements at business level | Product Manager, ERP Business Analyst |
| `similar-ticket-search` | Find related and possible duplicate tickets with cosine similarity, plus explicit references to earlier issue numbers in the text | NLP Specialist, Back-End Developer |
| `spacy-entity-extraction` | Extract named entities with spaCy en_core_web_sm and report the model's errors on PeopleSoft text | NLP Specialist, spaCy Expert |
| `synthetic-ticket-generation` | Generate realistic labeled synthetic PHIRE tickets with separate train and test phrasing banks and recurring groups | ERP Functional Analyst, ERP QA Developer, NLP Specialist, Data Engineer |
| `team-coordination` | Break work into tasks, route each to the right agent, and merge the results into one answer | Orchestrator, Product Manager |
| `technical-investigation-hints` | Suggest PeopleSoft technical or administration areas to investigate for a ticket (PeopleCode events, AE traces, SQR, IB monitor, Process Monitor), labeled as hypotheses | ERP Developer, PeopleSoft Administrator |
| `ticket-classification` | Train and run the module and issue-area classifiers: TF-IDF + logistic regression with a multinomial Naive Bayes baseline, exported to JSON for the browser | NLP Specialist, Back-End Developer |
| `uat-support` | Support user acceptance testing: prepare UAT scripts from acceptance criteria, set up test data, guide business testers and triage UAT defects | ERP Functional Analyst, ERP QA Developer |
| `vader-sentiment` | Score ticket sentiment with NLTK's VADER and judge whether it means anything for priority | ERP Manager, NLP Specialist, NLTK Expert |

## Skill matrix

Columns are agent numbers from the roster above. ● = uses the skill.

| Skill | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | Agents |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `agent-authoring` | ● |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `app-testing` |  |  |  |  |  |  |  |  |  |  |  |  | ● | ● | ● |  |  |  | ● |  | 4 |
| `business-case` |  | ● | ● |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 3 |
| `business-process-mapping` |  | ● | ● |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 3 |
| `classifier-evaluation` |  |  |  |  |  |  |  |  | ● |  | ● |  |  |  | ● |  | ● |  |  |  | 4 |
| `column-mapping` |  |  |  |  |  |  |  |  |  |  |  | ● | ● |  |  |  |  |  |  |  | 2 |
| `dashboard-design` |  | ● | ● |  |  |  |  |  |  |  |  |  | ● |  |  |  |  |  |  |  | 3 |
| `data-handling-review` |  |  |  |  |  |  |  |  |  | ● |  | ● |  |  |  | ● |  |  | ● | ● | 5 |
| `entity-ruler-patterns` |  |  |  |  |  | ● | ● |  |  |  |  |  |  |  |  |  |  | ● |  |  | 3 |
| `erp-test-scenarios` |  |  |  |  |  | ● | ● |  | ● |  |  |  |  |  |  |  |  |  |  |  | 3 |
| `excel-report-export` |  |  |  |  |  |  |  |  |  |  |  | ● |  | ● | ● |  |  |  |  |  | 3 |
| `functional-specification` |  |  |  |  |  | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `issue-area-triage` |  |  |  |  |  | ● | ● | ● | ● |  | ● |  |  |  |  |  |  |  |  |  | 5 |
| `keyword-extraction` |  |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  |  |  |  |  | 2 |
| `netlify-deployment` |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  | ● |  |  |  | ● | 4 |
| `netlify-python-build` |  |  |  |  |  |  |  |  |  | ● |  |  |  |  |  |  |  |  |  | ● | 2 |
| `nltk-text-analysis` |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |  |  | ● |  |  |  | 2 |
| `noun-chunk-aspects` |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ● |  |  | 1 |
| `peoplesoft-module-identification` |  |  |  |  |  | ● | ● |  |  |  | ● |  |  |  |  |  |  |  |  |  | 3 |
| `phire-export-parsing` |  |  |  |  |  |  |  |  |  |  |  | ● |  | ● | ● |  |  |  |  |  | 3 |
| `priority-suggestion` |  |  | ● |  | ● |  |  |  |  |  | ● |  |  |  |  |  |  |  |  |  | 3 |
| `pyodide-runtime` |  |  |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |  |  | ● |  | 2 |
| `recurring-issue-clustering` |  |  | ● |  | ● |  |  |  |  |  | ● |  |  |  |  |  |  |  |  |  | 3 |
| `requirements-and-acceptance` |  | ● |  |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `scope-and-stakeholder-requirements` |  | ● |  |  | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `similar-ticket-search` |  |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  |  |  |  |  | 2 |
| `spacy-entity-extraction` |  |  |  |  |  |  |  |  |  |  | ● |  |  |  |  |  |  | ● |  |  | 2 |
| `synthetic-ticket-generation` |  |  |  |  |  | ● |  |  | ● |  | ● | ● |  |  |  |  |  |  |  |  | 4 |
| `team-coordination` | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `technical-investigation-hints` |  |  |  |  |  |  | ● | ● |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `ticket-classification` |  |  |  |  |  |  |  |  |  |  | ● |  |  | ● |  |  |  |  |  |  | 2 |
| `uat-support` |  |  |  |  |  | ● |  |  | ● |  |  |  |  |  |  |  |  |  |  |  | 2 |
| `vader-sentiment` |  |  | ● |  |  |  |  |  |  |  | ● |  |  |  |  |  | ● |  |  |  | 3 |

**Agent numbers:** 1 Orchestrator, 2 Product Manager, 3 ERP Manager, 4 Meta Agent, 5 ERP Business Analyst, 6 ERP Functional Analyst, 7 ERP Developer, 8 PeopleSoft Administrator, 9 ERP QA Developer, 10 Software Architect, 11 NLP Specialist, 12 Data Engineer, 13 Front-End Developer, 14 Back-End Developer, 15 QA Tester, 16 Security Reviewer, 17 NLTK Expert, 18 spaCy Expert, 19 Pyodide Engineer, 20 Netlify Engineer.


## How the team works on a ticket (example)

*Ticket (written for this example):* "Approvers can't approve reported time after pay confirmation. Several departments report the same problem."

| Agent | Contribution |
|---|---|
| ERP Business Analyst | Time-to-pay process, approval step; two departments' approvers blocked before pay confirmation; stakeholders: payroll, department timekeepers, HR |
| ERP Functional Analyst | Module `TL`; possibly a period-lockdown or approval-setup issue |
| ERP Developer | Hypotheses to check: approval PeopleCode, Time Administration run after confirmation |
| PeopleSoft Administrator | Hypotheses to check: Time Admin stuck in Queued, approval workflow notifications |
| ERP QA Developer | Test scenario: report time, confirm pay, attempt approval for two departments |
| ERP Manager (PY + TL + AM portfolio) | Priority H; TL issue that puts PY at risk; escalate before pay confirmation |
| Orchestrator | Consolidates the above, separating what the ticket says from what still needs investigation |