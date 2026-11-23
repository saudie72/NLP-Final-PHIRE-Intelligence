# How to talk to your experts

Ready-to-use prompts for the PeopleSoft PHIRE Ticket Intelligence agent team. Every ticket below is
**synthetic** (written for this guide). Never paste real PHIRE ticket text into a prompt (see
[data-handling.md](data-handling.md)).

Agents are mentioned as `@agent-<id>`. In Claude Code, type `@` and pick the agent from the list.

## Ask the whole team

Start with the Orchestrator. It picks the smallest set of specialists, gives each a focused question, and returns
one answer with **Observations**, **Hypotheses to investigate**, **Module / Issue area / Suggested priority**,
**Recommended next steps** and **Sources**.

```
@agent-orchestrator <your question or synthetic ticket>
```

You do not need to name the specialists. If you want specific ones, say so: "include the ERP Developer".

**Note on how the Orchestrator runs.** When you call `@agent-orchestrator` from a normal session, it runs as a
subagent, and depending on the environment it may not be allowed to start other subagents. In that case it
picks the team, applies each specialist's documented role itself, and says so at the top of its answer (seen in
testing). For a run where each specialist answers separately, either:

- start a session with the Orchestrator as the main agent: `claude --agent orchestrator`, or
- ask the main session to consult the specialists one by one: "Ask @agent-erp-functional-analyst,
  @agent-erp-manager and @agent-erp-business-analyst about this ticket, then combine their answers."

## Ask one expert

```
@agent-erp-functional-analyst Which module and issue area is this synthetic ticket, and is it configuration or
development? Title: "Comp time not converting to payable time for Workgroup PW_HOURLY". Description: "Since the
last Time Administration run, comp time earned by hourly Public Works staff is not showing as payable time.
Overtime TRCs look fine."
```

A good answer: module `TL`; issue area Functional (likely rule program or TRC setup) with the cue words that
decided it; which setup pages to check; a note that it becomes Technical only if a custom rule or code is involved.

```
@agent-erp-manager I oversee Payroll, Time and Labor and Absence Management. From the synthetic test set in
data/synthetic/phire_test.xlsx, what should I escalate this week and why?
```

A good answer: a short list of tickets across PY + TL + AM ranked by payroll risk and deadline (pay confirmation,
month-end), cross-module issues called out, priority disagreements flagged, and an escalation recommendation per
item. (Works once the synthetic data exists.)

## Team prompts

### 1. Ticket assessment (cross-module, PY + TL + AM portfolio)

```
@agent-orchestrator Assess this synthetic ticket for the PY + TL + AM portfolio.
Title: "Sick leave taken not reducing balance and overpaying employees"
Description: "Business Unit = HS. For the last two pay periods, sick leave entered on timesheets by Health
Services employees is paid as regular hours and is not reducing their sick balance. Payroll found the difference
during the payroll register review. Pay confirmation is Thursday. Similar issue was reported last year."
```

| Agent that should respond | What a good answer contains |
|---|---|
| ERP Functional Analyst | Module `AM` vs. `TL` decision with reasons (absence entered on timesheet → TRC to absence take mapping); issue area Functional unless a code defect is found; setup to check |
| ERP Developer *or* PeopleSoft Administrator | Hypotheses only: TRC/absence take mapping, Absence Conversion to payable time not run or failing, Time Admin results |
| ERP Manager | Priority **H**: overpayment and pay confirmation deadline; escalation path across the portfolio |
| ERP Business Analyst | Time-to-pay process map with the failing hand-off; stakeholders (Health Services, Payroll, Absence admin); "reported last year" → candidate for a business case |
| Orchestrator | One answer with Observations vs. Hypotheses, Module/Area/Priority, next steps, Sources |

### 2. Recurring-issue business case

```
@agent-orchestrator Holiday work schedule changes are requested by a different department almost every holiday
(synthetic recurring group RG-style tickets: "Update work schedules for holiday week", "Temporary schedule change
for observed holiday"). Build a business case for a permanent fix, then a functional spec and user stories for
the recommended option.
```

| Agent | What a good answer contains |
|---|---|
| ERP Business Analyst | Business case: problem, current cost (ticket count, analyst hours, assumptions labeled), options (keep manual / self-service schedule tool / holiday schedule templates), ROI and recommendation; stakeholders and scope |
| ERP Manager | Portfolio view: TL workload and payroll risk from late schedule changes; agrees or challenges the priority |
| ERP Functional Analyst | Functional spec for the recommended option (pages, setup tables, business rules, configuration vs. development) and user stories with Given / When / Then acceptance criteria |
| ERP QA Developer | ERP test scenarios and UAT scripts for the new setup |

### 3. Feature build planning (version 1)

```
@agent-orchestrator Plan the column-mapping screen for version 1: users upload a PHIRE export whose headers may
differ from the standard 16 columns. Give me the user stories, the design, the data flow, and the tasks for each
developer.
```

| Agent | What a good answer contains |
|---|---|
| Product Manager | Scope for this feature and user stories with acceptance criteria (only Title or Description required; mapping remembered) |
| Software Architect | Where mapping sits in the data flow (file → parse → map → analyze), interface between import and engine, browser-only |
| Data Engineer | Header normalization and synonym list; validation rules; handling of flex-field columns |
| Front-End Developer | Screen layout: detected header → app field dropdown, required-field warnings, preview of first rows |
| Back-End Developer | Mapping applied before analysis; unit tests |
| QA Tester | Test cases: renamed headers, missing optional columns, extra columns, no Title or Description |

Swap in "similar-ticket search" to bring in the NLP Specialist instead of the Data Engineer.

### 4. Quality gate before deployment

```
@agent-orchestrator We are about to deploy version 1. Run the quality gate: review the misclassified test tickets
in nlp/results.md, test the app end to end with data/synthetic/phire_demo_export.xlsx, and do the security review.
Tell me if we are ready to deploy.
```

| Agent | What a good answer contains |
|---|---|
| ERP QA Developer | For each misclassified ticket: is the label wrong or the model wrong, from a PeopleSoft point of view; patterns (for example TL/AM confusion) |
| QA Tester | Pass/fail for upload, mapping, dashboard, ticket detail, export, edge cases; defects with steps |
| Security Reviewer | Data-handling checklist: no spreadsheets outside data/synthetic, no ticket content in network requests, CSP `connect-src 'self'`, no secrets; sign-off or blocking findings |
| Orchestrator | Go / no-go with the blocking items listed |

(Works once the app and results exist.)

## Change the team

```
@agent-meta-agent Add a Benefits specialist agent for open enrollment and carrier file issues, give it the right
skills, and update docs/expert-roster.md and CLAUDE.md.
```

## Tips

- Paste one synthetic ticket at a time with its Title and Description; add Module and Priority if you want them
  checked against the model's suggestion.
- Ask for "Observations only" when you just want the facts restated, or "hypotheses ranked by likelihood" when
  you want a starting point for investigation.
- Name your module portfolio when talking to the ERP Manager.
