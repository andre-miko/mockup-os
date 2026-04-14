---
description: Run handoff-reviewer; if clean, build the per-project handoff pack via npm run handoff.
argument-hint: <project-id>
---

Two-step gate for a project handoff. Project id is in $ARGUMENTS; if
missing, ask once.

1. **Audit.** Invoke the `handoff-reviewer` agent. Surface its full
   markdown report to the user.
2. **Decide.** If the report's verdict is `BLOCK`, stop. Tell the user
   what to fix and quit. If `PROCEED-WITH-WARNINGS` or `CLEAN`, ask
   "Build the handoff pack now? (y/n)".
3. **Build.** On `y`, run `npm run handoff` from `src/mockup-os/` (with
   the project filter once Phase 11 supports `--project`). Surface the
   resulting `manifest.json` path.

Never build silently after a warning verdict — always confirm.
