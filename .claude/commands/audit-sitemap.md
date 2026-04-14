---
description: Run the sitemap-planner agent to refresh docs/sitemap.md against the registry + brief.
argument-hint: [project-id]
---

Invoke the `sitemap-planner` agent for the project in $ARGUMENTS (or the
only project, or ask once). The agent will rewrite
`Projects/<id>/docs/sitemap.md` and run validate. Surface the agent's
hand-back report verbatim.

After the file is updated, remind the user that the Sitemap tab in the
OS hot-reloads — they can switch to it to see the new ghosts.
