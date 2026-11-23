# Orchestrator reference notes

## Claude Code subagents (how this team works)
- Project subagents live in `.claude/agents/<name>.md`: YAML front matter (`name`, `description`, `tools`, `model`,
  `skills`) plus a system prompt. Claude delegates to a subagent whose `description` matches the task.
- A subagent can preload skills listed in `skills:`. Whether a subagent can start other subagents depends on the
  environment; when it cannot, apply the specialists' documented roles and say so.
- Sources: https://code.claude.com/docs/en/sub-agents, https://code.claude.com/docs/en/skills

## Routing summary (from docs/expert-roster.md)
- ERP questions → erp-functional-analyst (module, configuration), erp-developer (code), peoplesoft-admin
  (scheduler, environments, security), erp-manager (priority), erp-business-analyst (business case, scope).
- Language features → nltk-expert (VADER, frequency, collocations), spacy-expert (entities, EntityRuler, aspects).
- Platform → pyodide-engineer (NLTK in the browser), netlify-engineer (build, deploy).
- Quality → erp-qa-developer (labels), qa-tester (app), security-reviewer (data, CSP).

## The two guides this project follows
- Build a team of synthetic employees with Claude Code: https://claude.ai/artifact/NTCut33EUofio3qY7ZNCXQ
- NLP Final Exam guide (NLTK + spaCy requirements): https://claude.ai/artifact/K55JqCeSxXULMmzki6yv73
