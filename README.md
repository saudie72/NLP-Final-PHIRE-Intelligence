# PeopleSoft PHIRE Ticket Intelligence

An AI-powered PeopleSoft support ticket analysis platform, built by a team of specialized AI agents.

Final project for the NLP course: build an AI agent team in Claude Code, have the agents develop an
application, deploy it to Netlify, and submit the GitHub repository and live application links.

## Project overview

| Item | Description |
|---|---|
| Platform | PeopleSoft HCM 9.2 and FSCM 9.2 |
| Source data | Excel export of PHIRE tickets (synthetic tickets for this project) |
| Primary purpose | Analyze, classify, prioritize, and identify recurring support issues |
| AI development platform | Claude Code with 16 specialized agents |
| Application | React web application |
| Deployment | GitHub and Netlify |
| NLP capabilities | Text classification, keyword extraction, semantic similarity, issue clustering |

## What the application will do

A user uploads an Excel spreadsheet exported from PHIRE. The application maps its columns, analyzes the
ticket descriptions, and produces:

- **Classification** by PeopleSoft module (Core HR, Payroll, Time & Labor, GL, AP, Purchasing, ...) and by
  issue type (functional, technical, security, administration)
- **Keyword extraction** for each ticket and each module
- **Duplicate and related-ticket detection** using semantic similarity
- **Recurring issues** found by clustering
- **Priority suggestions** compared against the ticket's recorded priority
- **A dashboard** of ticket trends, module analysis and recurring issues
- **An Excel report**: the original rows plus the AI-generated columns

## Research

Background research for the agent team is in [`docs/`](docs/README.md): PHIRE, the export format, PeopleSoft modules, technical and security components, the ticket taxonomy, NLP methods, data handling and the synthetic dataset plan.

## Data handling

Real PHIRE records can contain employee names, IDs, payroll and access details. This project is built,
tested and deployed with **synthetic PeopleSoft tickets only**. Real exports must not be committed to this
repository or uploaded to the public deployment; `.gitignore` blocks spreadsheets outside `data/synthetic/`.
Ticket analysis is planned to run in the browser so ticket text does not leave the user's device.

## Agent team (16)

| Group | Agents |
|---|---|
| Project management and coordination | Orchestrator, Product Manager, ERP Manager, Meta Agent |
| PeopleSoft ERP specialists | ERP Business Analyst, ERP Functional Analyst, ERP Developer, PeopleSoft Administrator, ERP QA Developer |
| Application development and NLP | Software Architect, NLP Specialist, Data Engineer, Front-End Developer, Back-End Developer, QA Tester, Security Reviewer |

## Version 1 scope

- [x] Create GitHub repository
- [x] Research documentation (`docs/`)
- [x] Build all 16 agents, skills, and knowledge folders
- [ ] PHIRE Excel upload and column mapping
- [ ] Classify tickets by module and issue type
- [ ] Identify similar tickets and recurring issues
- [ ] Dashboard and ticket details
- [ ] Export analyzed results to Excel
- [ ] Evaluate accuracy, precision, recall, and F1 on a held-out test set
- [ ] QA and security testing
- [ ] Deploy to Netlify with a Resources page

## Links

- Live application: _added at deployment_
- Repository: https://github.com/saudie72/NLP-Final-PHIRE-Intelligence
