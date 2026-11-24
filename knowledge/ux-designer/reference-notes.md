# UX Designer reference notes

## Nielsen's 10 usability heuristics
Ten general rules of thumb for interaction design, used for a heuristic evaluation (an expert walks the interface and
lists problems against each rule).

| # | Heuristic | What to look for in this app |
|---|---|---|
| 1 | Visibility of system status | Progress and result messages while a file is parsed and analyzed; the live NLTK box loading state |
| 2 | Match between system and the real world | PeopleSoft terms (module codes, issue areas, pay confirmation) used as support staff say them |
| 3 | User control and freedom | Undo a column mapping, clear filters, start over without reloading |
| 4 | Consistency and standards | Same words and colors for module, issue area and priority on every screen |
| 5 | Error prevention | Warn about missing required columns before analysis, not after |
| 6 | Recognition rather than recall | Show active filters and the current mapping; do not make users remember them |
| 7 | Flexibility and efficiency of use | Keyboard use, saved portfolio filter (for example PY + TL + AM) |
| 8 | Aesthetic and minimalist design | Summary first, detail on demand; no decoration that hides numbers |
| 9 | Help users recognize, diagnose and recover from errors | Plain-language messages for a bad file, with the next step |
| 10 | Help and documentation | Resources page, short inline hints on the mapping screen |

Source: https://www.nngroup.com/articles/ten-usability-heuristics/

## WCAG 2.2 (accessibility)
- The Quick Reference lists every success criterion with the techniques to meet it, filterable by level (A, AA, AAA)
  and by topic. Target level AA for the app (to confirm with the product manager).
- Checks that matter most for a dashboard and table app: keyboard operation and visible focus, contrast of text and
  chart marks, text alternatives or data tables for charts, labels for form fields, no meaning by color alone,
  minimum target size, reflow at narrow widths.
- Source: https://www.w3.org/WAI/WCAG22/quickref/

## Web accessibility in practice (MDN)
- MDN's accessibility hub covers semantic HTML, keyboard navigation, ARIA roles and attributes, color and contrast,
  and how to test with assistive technology. Prefer native elements (button, label, table) over custom ones with ARIA.
- Source: https://developer.mozilla.org/en-US/docs/Web/Accessibility

## React basics for design handoff
- The app is built with React: screens are made of components that take props and keep state. Write wireframes as
  component-sized regions (for example a ticket row with an action area) so the Front-End Developer can map each
  region to a component.
- Source: https://react.dev/learn

## How these notes are used in this project
- Review output uses the severity scale High / Medium / Low defined in the `usability-review` skill (project convention).
- Version 2 wireframes (for example "Ask the expert" buttons on ticket rows) are text layouts and tables, built from
  synthetic tickets, and must keep all ticket processing in the browser.
