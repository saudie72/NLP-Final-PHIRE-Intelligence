# Meta Agent reference notes

## Subagent files
- `.claude/agents/<name>.md` with YAML front matter: `name` (unique), `description` (when to delegate), optional
  `tools`, `model` (`sonnet`, `opus`, `haiku`, `inherit`), `skills` (list to preload). The body is the system prompt.
- Quote descriptions that contain colons, or the YAML front matter breaks (found in step 5).
- Source: https://code.claude.com/docs/en/sub-agents

## Skill files
- `.claude/skills/<skill-name>/SKILL.md` with `name` and `description` front matter; supporting files can sit next to it.
- Source: https://code.claude.com/docs/en/skills

## CLAUDE.md
- Project memory loaded at session start; keep the team table and rules there.
- Source: https://code.claude.com/docs/en/memory

## House template (this project)
- Mandatory first action (read `knowledge/<id>/`), name/voice/style line, Read first, Deliverables, Do not, Skills,
  Data-handling rules, How to answer. Update `docs/expert-roster.md`, `docs/agent-brains.md` and `CLAUDE.md`.
