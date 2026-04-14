---
description: Scaffold a new mockup screen end-to-end via the mockup-generator agent.
argument-hint: <project-id> "<screen intent>"
---

Use the `mockup-generator` agent to add one new screen to the project.

Arguments: $ARGUMENTS

Establish project id and screen intent from the arguments. If either is
missing or ambiguous, ask in one short message before proceeding. Then
follow the agent's contract:

1. Pick a route, layout family, and id (`<product>.<dotted-id>`).
2. Create the screen TSX under
   `Projects/<id>/mockups/screens/<PascalCase>.tsx`.
3. Append a `defineScreen({...})` block to the project's
   `mockups/index.ts`.
4. Run `npm run validate` from `src/mockup-os/`.
5. Hand back a 3-5 line report (id, route, files touched, journey hookup).
