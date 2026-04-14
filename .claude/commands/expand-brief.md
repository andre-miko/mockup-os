---
description: Expand a single brief markdown file via the brief-expander agent.
argument-hint: <project-id> <brief-file-name>
---

Invoke the `brief-expander` agent for the file specified in $ARGUMENTS
(e.g., `expand-brief example-project 01-scope.md`).

Stream the agent's output back to the user. Do NOT save the result —
the BriefTab UX asks the user to review and click Save themselves. If
the user explicitly says "save it", then write the result to
`Projects/<project-id>/brief/<file-name>` after they confirm.
