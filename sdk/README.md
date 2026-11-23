# Agent SDK demo (step 10)

`ask-agent.mjs` calls one of the project's agents from code with the
[Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/typescript). It reads a **synthetic** PHIRE export,
picks the highest-priority open tickets, and asks an agent (the Orchestrator by default) to assess them. The
agent's instructions and model come from `.claude/agents/<agent>.md`, so it is the same team you use in Claude Code.

## Safety

- Only files inside `data/synthetic/` are accepted; anything else is refused before any API call. Real PHIRE
  exports must never be sent to an API (`docs/data-handling.md`).
- User IDs must be `SYNUSERnnnn` placeholders.
- The agent can only read files (`Read`, `Grep`, `Glob`); commands, edits and web access are disabled.
- The API key comes from the `ANTHROPIC_API_KEY` environment variable. Never commit it.

## Run

```bash
cd sdk && npm install
```

```bash
node sdk/ask-agent.mjs --check-agents
```

```bash
node sdk/ask-agent.mjs --dry-run
```

```bash
ANTHROPIC_API_KEY=... node sdk/ask-agent.mjs --agent orchestrator --top 5
```

Options: `--check-agents` (load and verify every agent, no API call), `--agent <id>` (any file in `.claude/agents/`), `--file data/synthetic/<file>.csv`, `--top <1-20>`,
`--dry-run` (print the prompt, send nothing, no key needed).

**No live run has been made for this project** (no API spend). A real run costs a few cents to a few tens of cents depending on the agent's model (the Orchestrator uses Opus);
the script prints the cost at the end.

## Tested

| Check | Result |
|---|---|
| `--check-agents`: SDK imports (`query` is a function) and all 20 agent files load through the script's loader with a valid model, title, name, knowledge-folder first step and data-handling rules | ✅ 20/20 |
| `--dry-run` builds the prompt from the 5 highest-priority open synthetic tickets | ✅ |
| File outside `data/synthetic/` | ✅ refused |
| `data/synthetic/../../README.md` (path trick) | ✅ refused |
| `.xlsx` instead of CSV | ✅ refused with a hint |
| Other agent (`--agent erp-manager`) picks that agent's model | ✅ sonnet |
| Live run | not run: no API key is available in the build environment and the project owner chose not to spend money on API calls. Verified instead that the SDK loads and every agent loads correctly (`--check-agents`). |
