# Research index

Background research for **PeopleSoft PHIRE Ticket Intelligence**. These files are shared context for the
16-agent team (PeopleSoft ERP specialists plus software development and NLP specialists) built in later steps.

Conventions used in every file:

- **Sourced** facts link to their source at the end of the section.
- **Observed** means it was seen in the sample PHIRE export (headers and 4 rows, reviewed but not stored here).
- **To confirm** marks an assumption that must be checked against a full PHIRE export or the PHIRE administrator.
- No real ticket text, names or ticket numbers from the sample appear anywhere in this repository.

| # | File | Topic | Main readers |
|---|---|---|---|
| 1 | [phire-overview.md](phire-overview.md) | What PHIRE is, issues vs. change requests, workflow | ERP Manager, ERP Business Analyst, Product Manager |
| 2 | [phire-export-format.md](phire-export-format.md) | The 16 export columns, types, observed values, app mapping | Data Engineer, Back-End Developer, Software Architect |
| 3 | [peoplesoft-modules.md](peoplesoft-modules.md) | HCM and FSCM modules, codes, pages, processes, vocabulary | ERP Functional Analyst, NLP Specialist |
| 4 | [peoplesoft-technical.md](peoplesoft-technical.md) | PeopleCode, App Engine, IB, SQR, Process Scheduler, PUM, migrations | ERP Developer, PeopleSoft Administrator |
| 5 | [peoplesoft-security.md](peoplesoft-security.md) | User profiles, roles, permission lists, row-level security | PeopleSoft Administrator, Security Reviewer |
| 6 | [ticket-taxonomy.md](ticket-taxonomy.md) | Module + issue area labels, cue words, examples | NLP Specialist, ERP QA Developer, ERP Functional Analyst |
| 7 | [nlp-methods.md](nlp-methods.md) | Classification, keywords, similarity, clustering, priority, evaluation | NLP Specialist, QA Tester |
| 8 | [data-handling.md](data-handling.md) | Confidentiality, synthetic-only rule, browser-local processing | Security Reviewer, all agents |
| 9 | [synthetic-dataset-plan.md](synthetic-dataset-plan.md) | How the synthetic train/test/demo data will be generated | Data Engineer, NLP Specialist, ERP QA Developer |
| 10 | [expert-roster.md](expert-roster.md) | The 16 agents, their jobs, deliverables and shared skills | Orchestrator, Meta Agent, all agents |
| 11 | [how-to-talk-to-your-experts.md](how-to-talk-to-your-experts.md) | Example prompts: one agent, the whole team, and four team workflows | Project owner, Orchestrator |
| 12 | [agent-brains.md](agent-brains.md) | Each agent's model, the reason, and its name, voice and working style | Project owner, Meta Agent |
| 13 | [agent-test-results.md](agent-test-results.md) | Knowledge-folder test of the ERP Functional Analyst: questions, rounds, answers | Project owner, QA |
| 14 | [erp-qa-review.md](erp-qa-review.md) | ERP QA Developer's review of misclassified test tickets | NLP Specialist, Data Engineer |
| 15 | [security-review.md](security-review.md) | Security Reviewer's checklist and sign-off for version 1 | Security Reviewer, project owner |
| 16 | [requirements.md](requirements.md) | Version 1 scope, stakeholders, user stories with acceptance criteria mapped to tests | Product Manager, QA |
| 17 | [architecture.md](architecture.md) | Stack, data flow, components and key decisions | Software Architect, developers |
| 18 | [version-2.md](version-2.md) | What version 1 delivers, how it was built, and the version 2 backlog | Project owner, Orchestrator |

## Open questions for the project owner

Collected from the "to confirm" notes in each file:

1. The full list of **Module** codes used in your PHIRE instance (observed: `HR`, `PY`, `TL`).
2. The full **Status** list and its numbering (observed values include two different statuses that both start with `2-`).
3. The full **Issue Type** list (observed: Enhancement Request, Production Support Item).
4. The **Priority** scale (observed: `H`; assumed `H` / `M` / `L`).
5. The **Resolution Code** list (observed: one value).
6. How **Aging** and **Due Date** are calculated (observations suggest Aging = days open as of the export date, and Due Date = Open Date + 5 days for `H`).
7. Whether **Assigned To**, **Opened By** and **Developer** are blank in the real export or were blanked for the sample.
