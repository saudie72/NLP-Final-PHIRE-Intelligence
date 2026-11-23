---
name: team-coordination
description: "Break work into tasks, route each to the right agent, and merge the results into one answer."
---

# team-coordination

**Purpose:** Get the right specialists working on the right part of a problem.

**Used by:** Orchestrator, Product Manager

**Inputs:** A request or build step.

## Steps

1. Restate the goal in one sentence.
2. Pick the smallest set of agents using the routing guide in the orchestrator file.
3. Give each a focused question with the docs to read.
4. Merge: resolve conflicts, keep Observations and Hypotheses separate, list next steps.

## Output

Consolidated answer.

## Rules

- Synthetic or user-written example data only; never real PHIRE ticket content (`docs/data-handling.md`).

## References

- `docs/expert-roster.md`
