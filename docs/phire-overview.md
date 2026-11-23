# 1. PHIRE overview

## What PHIRE is

PHIRE is a third-party **application change management (ACM)** product for PeopleSoft. It is built on
PeopleTools and runs alongside the PeopleSoft applications it manages. Organizations use it to:

- record **issues** (production support problems, enhancement requests, service requests),
- link issues to **change requests (CRs)** that carry the actual development work,
- **version and migrate** PeopleTools objects (PeopleCode, records, pages, App Engine programs, SQRs,
  PS Queries) between environments such as DEV → TST → PRD,
- route work through a **workflow** of statuses with approvals and notifications.

Oracle also ships its own *PeopleSoft Change Management* module (part of CRM). That is a different product.
Oracle does not formally certify third-party change management tools for PeopleSoft, so PHIRE behavior is
defined by the vendor and by each customer's configuration.

Sources: [University of Colorado: PHIRE](https://cu.edu/print/uis/access-it-security/request-access/it-applications/phire),
[Phire podcast episode](https://share.transistor.fm/s/9719d2a0),
[Quest Blueprint 4D 2026: PHIRE users discussion](https://questoraclecommunity.org/learn/recordings-presentations/bp4d26-phire-users-discussion-best-practices-and-idea/),
[Oracle: Understanding Change Request Management](https://docs.oracle.com/cd/F95753_01/crm92pbr22/eng/crm/ccal/UnderstandingChangeRequestManagement-096df6.html),
[My Oracle Support Doc ID 2925728.1](https://support.oracle.com/knowledge/PeopleSoft%20Enterprise/2925728_1.html) (login required).

## Issues vs. change requests

| Concept | Identifier pattern (observed) | What it represents |
|---|---|---|
| Issue | `IN` + 6 digits | A ticket raised by the business or support team |
| Change request | `CR` + 6 digits | Development or configuration work that fixes or implements an issue |

An issue does not always have a CR. In the sample, tickets that needed a build or a migration had a CR,
and others did not. One issue can reference earlier issues in its description ("this has been done before,
reference IN…"), which is a strong signal of a **recurring issue**.

## PHIRE issue features relevant to this project

- **Issue types** with their own description templates (to confirm which types your instance uses).
- **Flex fields**: customer-defined fields, which is why the column-mapping screen must be flexible.
- **Notifications** on issue opened, assignee change, new note, status change and issue closed.
  Notes are not in the export we have, so the application works from Title and Description only.

Source: secondary documentation summarized from [Scribd: Defining Application Codes](https://www.scribd.com/document/495402337/Defining-Application-Codes) (treat as unconfirmed).

## Ticket workflow (observed and assumed)

Status values in the export carry a number prefix that orders the workflow. Observed values:

| Status | Observed |
|---|---|
| `2-Assigned/In Queue` | yes |
| `2-Pending Validation` | yes |
| `5-Ready for Test` | yes |
| `11-Migrated to Production` | yes |

**To confirm:** the full list. The synthetic data will fill the gaps with plausible statuses (New, In
Development, Migrated to Test, In Testing, Approved for Production, On Hold, Cancelled, Closed) and the
docs will be updated once the real list is known. Two different statuses share the `2-` prefix, so the
application must treat Status as text, not parse the number as a unique step.

## Why PHIRE data suits NLP

Title and Description are free text written by business users and analysts. They mix PeopleSoft terms
(page names, process names, TRCs, ChartFields) with business language ("pay period end", "mass update"). This makes them a good fit for supervised classification (module, issue area) and for
similarity search (related and recurring tickets). The structured columns (dates, status, priority) support
the dashboard and give labels to compare against.
