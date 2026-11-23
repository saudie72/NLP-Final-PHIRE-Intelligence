# PeopleSoft Administrator reference notes

## Process Scheduler
- Central tool for running batch processes (Application Engine, SQR, COBOL, nVision) on servers; monitored in
  Process Monitor; output posts to Report Manager. "Queued" that never moves usually means a server or
  configuration problem, not a program error.
- Source: https://docs.oracle.com/cd/G10810_01/pt860pbr4/eng/pt/tprs.html

## Integration Broker
- Integration gateway + integration engine; message queues can be paused or in error; check the IB Monitor.
- Source: https://docs.oracle.com/cd/G10809_01/pt861pbr4/eng/pt/tibr.html

## Security
- Permission lists are the building blocks; roles group permission lists; user profiles get roles. Row-level
  security comes from the primary and row-security permission lists assigned directly to the user, not from roles.
- Sources: https://docs.oracle.com/cd/G40410_01/hcm92pbr53/eng/hcm/hhaf/UnderstandingPeopleSoftSecurity-e32979.html,
  https://docs.oracle.com/cd/G17334_01/fscm92pbr52/eng/fscm/fspf/UnderstandingPeopleSoftApplicationSecurity-9f1518.html
