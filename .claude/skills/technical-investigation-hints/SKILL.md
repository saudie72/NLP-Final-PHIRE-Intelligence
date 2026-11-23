---
name: technical-investigation-hints
description: "Suggest PeopleSoft technical or administration areas to investigate for a ticket (PeopleCode events, AE traces, SQR, IB monitor, Process Monitor), labeled as hypotheses."
---

# technical-investigation-hints

**Purpose:** Give developers and administrators a head start without pretending to diagnose.

**Used by:** ERP Developer, PeopleSoft Administrator

**Inputs:** A Technical or Administration ticket.

## Steps

1. Identify named objects (component, AE program, SQR, queue, server).
2. Map symptoms to where to look (save error -> SavePreChange/SavePostChange; AE step failure -> AE trace for the process instance; Queued -> scheduler server status; IB error -> IB monitor queue).
3. Phrase every item as 'check ...', never as a conclusion.

## Output

Bullet list of checks with the reason for each.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/peoplesoft-technical.md`
- `docs/peoplesoft-security.md`
