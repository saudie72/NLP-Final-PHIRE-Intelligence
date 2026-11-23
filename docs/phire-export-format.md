# 2. PHIRE export format

Source: the sample export provided by the project owner (one sheet named `sheet1`, 16 columns, 4 data rows).
Only structure and value *patterns* are recorded here. No row content is copied.

## Columns

| # | Column | Type | Observed pattern | App field | Used for |
|---|---|---|---|---|---|
| 1 | Module | code (2 letters) | `HR`, `PY`, `TL` | `module` | Ground-truth label for module classifier; dashboard grouping |
| 2 | Priority | code (1 letter) | `H` | `priority` | Compared with AI-suggested priority |
| 3 | Issue Type | text | `Enhancement Request`, `Production Support Item` | `issueType` | Dashboard filter; feature for priority |
| 4 | Issue Num | text ID | `IN` + 6 digits | `id` | Unique key; link target for related tickets |
| 5 | Title | short text | 3–10 words | `title` | **NLP input** (weighted higher) |
| 6 | Description | long text, multi-line | 1–15 lines; may contain line breaks, aligned date tables, BU codes, pay-period dates, references to earlier issue numbers | `description` | **NLP input** |
| 7 | Status | numbered text | `<n>-<label>`, e.g. `5-Ready for Test` | `status` | Open/closed split; workflow chart |
| 8 | Assigned To | person | blank in sample | `assignedTo` | Workload view; suggested assignment |
| 9 | Opened By | person | blank in sample | `openedBy` | Requester view |
| 10 | Open Date | date | Excel date | `openDate` | Volume trends |
| 11 | Closed Date | date | blank for open tickets | `closedDate` | Resolution time |
| 12 | Aging | integer (days) | equals export date − Open Date for open tickets | `aging` | Backlog aging chart |
| 13 | Resolution Code | text | `New Rqmt/Approved Enhancement`; blank when open | `resolutionCode` | Historical outcome; dashboard |
| 14 | CR | text ID | `CR` + 6 digits or blank | `cr` | Has-development-work flag |
| 15 | Due Date | date | Open Date + 5 days for `H` in all sample rows | `dueDate` | Overdue flag |
| 16 | Developer | person | blank in sample | `developer` | Technical workload |

## Parsing rules for the Data Engineer

- Read the **first sheet** by default; let the user choose another sheet.
- Treat the first row as headers. Match headers case-insensitively and ignore extra spaces.
- **Column mapping screen:** auto-map the 16 known headers; any missing or renamed column can be mapped
  by the user. Only **Title or Description** is required; everything else is optional.
- Dates may arrive as Excel serial numbers, JavaScript dates or text (`mm/dd/yyyy`). Normalize to ISO dates.
- Keep Description line breaks for display; collapse whitespace for NLP.
- Never trust Aging blindly. Recompute it from Open Date and Closed Date (or today) and flag disagreements.
- Unknown extra columns (PHIRE flex fields) are kept and passed through to the Excel report unchanged.

## To confirm

- Full value lists for Module, Priority, Issue Type, Status and Resolution Code (see [README](README.md)).
- Whether the person columns are blank in production exports or were blanked for sharing.
- Whether exports can contain notes, attachments lists or flex fields as extra columns.
