# Front-End Developer reference notes

## Accessibility
- WCAG 2.2: visible focus, keyboard operation, sufficient contrast, labels for inputs.
- Theme switch uses `role="radiogroup"` with `role="radio"` and `aria-checked`.
- Sources: https://www.w3.org/WAI/WCAG22/quickref/, https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/radiogroup_role

## React
- Keep heavy work out of render (Web Workers for analysis and Pyodide).
- Source: https://react.dev/learn

## Labelling NLTK vs spaCy (assignment requirement)
- Every language panel shows a badge: NLTK (green), spaCy (blue) or NLTK + spaCy (amber); entity highlights mark
  EntityRuler spans (amber) separately from en_core_web_sm spans (blue).
- Source: https://claude.ai/artifact/K55JqCeSxXULMmzki6yv73
