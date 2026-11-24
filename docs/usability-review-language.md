# Usability review: Language page (version 2, round 2, item 5)

Reviewer: Noor (UX Designer). Method: Nielsen's 10 heuristics and WCAG 2.2 AA, read from `app/src/components/Language.jsx`
and `app/src/styles.css`, plus two screenshots of the current local build (`entity-eval.png`, `vader-panel.png`).
Data: synthetic demo tickets only. No application code was changed.

**User and task.** A first-time ERP support analyst opens the Language page to answer two questions: "Can I trust the
entity tagging?" (Entity accuracy) and "Do unhappy tickets sit in particular issue areas or priorities?" (Sentiment).

**Severity scale (0-4, Nielsen).** 4 blocks the task, 3 major, 2 minor, 1 cosmetic, 0 not a problem.
**Small fix** = CSS or text only, doable this round.

## Findings, ranked

| ID | Heuristic / WCAG | Sev | Evidence (observed) | Suggested fix | Small fix? |
|---|---|---|---|---|---|
| L1 | WCAG 1.4.10 Reflow, 2.1.1 Keyboard (scrollable region), H7 | 3 | `vader-panel.png`: last column "URGENCY W..." is cut off and its values (H, M, L rows) are not visible at all. The `.table-wrap` scrolls sideways (`overflow-x:auto`), but nothing signals that more exists and the wrapper has no `tabindex`, so a keyboard user cannot scroll it. The priority table sits inside a half-width `g2` panel, so it clips on many desktop widths, not just phones. | (a) Shorten headers: "Tickets", "Mean VADER", "% negative", "% urgent". (b) Set `th`/`td` padding smaller inside this panel and allow header wrap (`white-space: normal`). (c) Add `tabindex="0"`, `role="region"` and `aria-label="PHIRE priority sentiment table"` to the wrapper. Hypothesis: with (a) and (b) the table fits at about 480 px panel width; check at 360 px phone width. | (a), (b) yes (text/CSS); (c) is one attribute, include if the developer agrees |
| L2 | WCAG 1.4.3 Contrast (text) | 3 | `.faint`, `.eyebrow` and `th` use `--ink-3` `#7a879b` on white. My calculation gives about 3.6:1, below the 4.5:1 needed for small text. These carry real content: the Entity accuracy caveat ("indicative only"), the "112 hand-labelled entities in 30 tickets" scope, table headers, and the "number = mean compound" key. In the screenshots they look pale. Dark theme (`#7d8ba1` on `#111c2d`, about 4.9:1) passes. | Darken light-theme `--ink-3` to about `#5b677a` (verify at 4.5:1 or better with a contrast checker). Raise the caveat text from `.8rem` to `.85rem`. | Yes (CSS variable) |
| L3 | WCAG 1.4.1 Use of color, 1.1.1 / 1.3.1 for the chart | 3 | In Sentiment by issue area, negative vs positive is red vs green only. Counts are in `title` tooltips on each segment, which need a mouse; keyboard and touch users and screen readers get only the single mean number. The neutral segment (`--line` `#dbe1ea` on white, about 1.3:1) is nearly invisible against the track, so a bar with no neutral share looks the same as a short bar. | Add visible text to each row: e.g. "52% neg / 44% neu / 4% pos" in a visually secondary line or as the row's `aria-label`/`role="img"` label. Give the neutral segment a darker fill (for example `--ink-3` at 40%) and a 1 px divider between segments. | Text and CSS yes; `aria-label` is a one-line JSX edit |
| L4 | H2 Match with the real world, H10 Help | 3 | Entity accuracy shows "Precision / Recall / F1" and "en_core_web_sm alone" with no explanation. An ERP analyst cannot tell what 0.23 vs 0.69 means or whether 0.65 is good. The key sentence ("Exact text and label must match... model alone has no PeopleSoft labels") sits below the table in the faintest style. | Add a one-line plain reading above the table, built from the data: "Out of every 100 entities spaCy tagged with the EntityRuler, about 69 were right (precision); it found about 62 of every 100 that a person labelled (recall)." Rename rows to "spaCy model only" and "PeopleSoft EntityRuler + spaCy model" with the technical name in smaller text. Move the "exact match" note directly under the heading. | Yes (text; derive numbers from `data.entityEval`) |
| L5 | H1 Visibility, H6 Recognition, WCAG 1.3.1 | 2 | Entity accuracy table has no `<caption>`, no `scope="col"` on headers, and no emphasis on the better row. Numbers are plain; the 0.11 vs 0.65 gap, which is the whole point of the panel, takes reading four numbers. The panel gives only overall scores, though the data has 12 labels (per-label results would answer "which kinds are weak"). | Add `<caption class="sr-only">` and `scope="col"`. Bold the F1 of the better row or add a small inline bar under F1. Per-label table is a version 2 follow-up, not this round. | Caption/scope and bold: yes. Per-label view: no |
| L6 | H2 Match with the real world, WCAG 1.3.1 | 2 | Priority table headers "Negative" and "Urgency words" do not say they are percentages of tickets; values show "45%" but the header is ambiguous. "Mean VADER" is jargon; the panel legend says "mean compound", a third term for the same number. Mean VADER is about -0.2 for H, M and L, which a reader may take as "priority H is not more negative", a result the page does not interpret. | Use one term everywhere ("Mean sentiment (VADER compound)"). Headers: "% negative", "% with urgency words". Add one sentence under the table stating the observation, for example "Mean sentiment barely differs between H, M and L; urgency words are a better cue" only if `n.urgencyEval` supports it (verify; do not claim cause). | Yes (text) |
| L7 | WCAG 1.4.3, 1.4.11 for the library badges and numbers | 2 | `.lib.nltk` is `#2f8f5b` text on a 16% tint of itself; `.lib.spacy` is `#2f6fdb` on its tint. At `.68rem` bold these are likely close to or under 4.5:1 (hypothesis; measure). Mean values use `--bad`/`--good` text at `.86rem`; `--good` `#1c8a4a` is about 4.5:1 on white, borderline. | Measure with a checker; if below 4.5:1, darken badge text by about 15%. Keep the sign character ("-0.28") as it is, which already carries the meaning without color. | Yes (CSS) |
| L8 | WCAG 2.4.4 / 3.2.5 Link purpose, H4 Consistency | 1 | "Evaluation and errors" is styled as a button, opens a new tab and goes to GitHub, but nothing says it leaves the app. Elsewhere on the page the same document is referenced as "see the evaluation" in plain text with no link. | Add "(opens GitHub, new tab)" as visually hidden text and an icon; link the two "see the evaluation" mentions to the same URL or to the Resources page. | Yes (text) |
| L9 | H8 Minimalist design, WCAG 1.4.10 | 1 | The page is nine panels long with no in-page navigation; the two panels this round cares about (Sentiment, Entity accuracy) are at the top and bottom of the scroll. Sentiment panel stacks bars, legend, table and a 3-line caveat in one card. | Not this round. Version 2 suggestion: a short "Jump to" row of anchor links under the intro, and move the lexicon note into a collapsed "How the sentiment is tuned" disclosure. | No |
| L10 | H3 User control, WCAG 2.5.8 Target size | 1 | `NltkBox` has no "Clear" or "Reset to example" control after the user edits the text; textarea `rows={4}` is short for real tickets. Buttons look at or above 24 px; not measured. | Add "Reset to example" secondary button. Check the `.btn` height is 24 px or more at phone width. | No (small JSX) |

## What already works

- Plain-language caveat on Entity accuracy ("One labeller, synthetic text: indicative only") sets honest expectations; keep it, just make it more readable (L2, L4).
- `:focus-visible` outline (2 px, `--focus`) is defined globally; light and dark themes both exist; reduced motion is respected.
- Library badges (NLTK / spaCy) are consistent across panels, and text, not color alone, says which library produced a result.
- Sentiment means use a real minus sign and a signed format, so direction does not rely on color.
- Everything on this page is computed at build time or in the browser; nothing here sends ticket text anywhere.
- Panels use real `<h2>`, `<table>`, `<th>` and `<ol>` elements, so structure is exposed to assistive technology.

## Hand-offs

- **Front-End Developer, this round (CSS/text only):** L1 (a, b), L2, L3 (visible text + neutral color), L4, L5 (bold + sr-only caption), L6, L7, L8.
- **QA Tester:** add checks at 360 px and 1024 px that all five priority-table columns are reachable; keyboard scroll test of `.table-wrap`; contrast run on light and dark themes with an automated checker (axe) for the Language page.
- **Agree with Front-End Developer and QA Tester:** target is WCAG 2.2 AA (still "to confirm" with the product manager per `knowledge/ux-designer/reference-notes.md`).

## Limits of this review

Contrast ratios above are my own calculations from the CSS color variables, not measured in a browser. Screenshots were
reviewed at one width each. No screen reader or phone-width run was done; L1 phone behavior is inferred from the CSS.

## Sources

- `knowledge/ux-designer/README.md`, `knowledge/ux-designer/reference-notes.md`
- `.claude/skills/usability-review/SKILL.md`
- `docs/agent-run-v2-round1.md` (item 5)
- `app/src/components/Language.jsx`, `app/src/styles.css`
