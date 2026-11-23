# ERP Developer reference notes

## PeopleTools technologies
- PeopleCode (event-driven code on records, pages, components), Application Engine (batch programs of sections,
  steps and actions), SQR, BI Publisher, PS Query, Component Interfaces, Application Packages.
- Source: PeopleTools PeopleBook index, https://docs.oracle.com/cd/F86650_01/pt859pbr5/eng/pt/tgst/PeopleToolsProduct_FeaturePeopleBookIndex.html

## Integration Broker
- Messaging layer for synchronous and asynchronous services; two main parts: the integration gateway and the
  integration engine. Errors show in the Integration Broker Monitor.
- Sources: https://docs.oracle.com/cd/G10809_01/pt861pbr4/eng/pt/tibr.html,
  https://docs.oracle.com/cd/F86650_01/pt859pbr5/eng/pt/tibr/ImplementingPeopleSoftIntegrationBroker-07659a.html

## Where to look first (hypotheses, not conclusions)
- Save error → SavePreChange / SavePostChange PeopleCode on the component.
- AE step failure → AE trace for the process instance; Process Monitor message log.
- Interface missing rows → the selection SQL and its effective-date / status filters.

## spaCy patterns
- Program names in CAPS_WITH_UNDERSCORES (for example TL_TIMEADMIN) are labelled PS_PROGRAM by the EntityRuler
  (`pipeline/patterns.py`); add new custom object names there.
