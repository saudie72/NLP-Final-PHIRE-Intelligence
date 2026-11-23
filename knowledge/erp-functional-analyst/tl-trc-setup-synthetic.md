# Time and Labor TRC setup (SYNTHETIC)

> **Synthetic test document.** Invented for testing that the ERP Functional Analyst reads its knowledge folder.
> It does not describe any real organization's configuration. Codes, workgroups and dates are fictional.

As of 11/01/2026. Time Reporting Codes (TRCs) and where each one goes.

| TRC | Description | Earnings code (PY) | Absence take (AM) | Workgroups | Notes |
|---|---|---|---|---|---|
| `REG` | Regular hours | `REG` | — | all | |
| `OT15` | Overtime 1.5x | `OT1` | — | all hourly | |
| `OT20` | Overtime 2.0x | `OT2` | — | FR_24HR | |
| `CMPER` | Comp time earned | — (banked) | — | PW_HOURLY, PR_HOURLY | **Quirk B** |
| `CMPTK` | Comp time taken | `CMP` | — | PW_HOURLY, PR_HOURLY | Reduces comp balance |
| `SCK` | Sick leave | `SCK` | `SICK_TAKE` | all except CE_FIELD | Reduces sick balance |
| `SCKCE` | Sick leave, Code Enforcement field inspectors | `REG` until 01/04/2027, then `SCK` | none until 01/04/2027, then `SICK_TAKE` | CE_FIELD | **Quirk A** |
| `VAC` | Vacation | `VAC` | `VAC_TAKE` | all | |
| `HOL` | Holiday not worked | `HOL` | — | all | |
| `HOLWK` | Holiday worked | `HWK` | — | all except FR_24HR | |
| `HOLFR` | Holiday worked, Fire Rescue 24-hour | `HWF` | — | FR_24HR | **Quirk C** |
| `BRV` | Bereavement | `BRV` | `BRV_TAKE` | all | |

## Known quirks

**Quirk A: `SCKCE` (Code Enforcement sick leave).** When Code Enforcement field inspectors moved to the CE_FIELD workgroup on
09/14/2026, the new `SCKCE` TRC was created with an effective-dated row that maps to earnings `REG` and has
**no absence take** until **01/04/2027**. The corrected row (earnings `SCK`, absence take `SICK_TAKE`) was entered
with the wrong effective date. Until then, sick leave reported with `SCKCE` is paid as regular hours and does
**not** reduce the sick balance. Fix: insert a correct row effective the original 09/14/2026 date and run
retro for the affected pay periods. Configuration only, no code.

**Quirk B: `CMPER` comp time cap.** Workgroup PW_HOURLY has a comp time bank cap of **80 hours** in rule program
`PW_RULES`. Comp time earned above the cap is converted automatically to `OT15` (paid overtime 1.5x) by the
rule. This is working as designed, but users often report it as an error.

**Quirk C: `HOLFR` (Fire Rescue holiday worked).** `HOLFR` is **excluded** from rule program `FR_RULES`, so Time
Administration does not create payable time for it. Payroll enters it on Paysheets manually each pay period.
Missing holiday-worked pay for Fire Rescue 24-hour staff usually means the manual Paysheet entry was missed.
