---
description: Generate fixture JSON via the data-generator agent and write it to data/<fixtureId>.json.
argument-hint: <project-id> <fixtureId> "<short description>"
---

Invoke the `data-generator` agent with the args in $ARGUMENTS.

After the agent produces JSON, save it atomically to
`Projects/<project-id>/data/<fixtureId>.json` (the JSON value the agent
emits goes verbatim into the file — do not wrap it).

Run `npm run validate` to catch any binding mismatches. If the fixture
isn't yet bound in `mockups/fixtures.ts`, remind the user to add the
`defineFixture<T>(...)` entry — this command writes data, it does NOT
register fixtures.
