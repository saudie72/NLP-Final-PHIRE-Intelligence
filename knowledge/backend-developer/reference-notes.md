# Back-End Developer reference notes

## Netlify Functions (chat)
- One v2 function at `/api/chat` (`export const config = { path: "/api/chat" }`); keep helper modules outside
  `netlify/functions/`.
- Source: https://docs.netlify.com/functions/overview/

## Anthropic API
- Stream responses (`client.beta.messages.stream`) and read text deltas; cache the fixed system prompt with
  `cache_control: { type: "ephemeral" }`.
- Sources: https://platform.claude.com/docs/en/build-with-claude/streaming,
  https://platform.claude.com/docs/en/build-with-claude/prompt-caching

## Browser engine parity
- The JS engine must match scikit-learn within 1e-3 (tests/parity.test.js); NLTK parity is guaranteed by running
  the same `nltk_core.py` in Pyodide.
