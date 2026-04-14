---
description: Scaffold a new markdown journey under docs/journeys for the active project.
argument-hint: <project-id> "<journey title>"
---

Create a new journey markdown for the project specified in $ARGUMENTS.

1. Resolve the project id from the args. If missing, ask once.
2. Choose a slug (kebab-case) for the file name and a dotted id
   (`<product>.<slug>`) for the journey id.
3. Write `Projects/<id>/docs/journeys/<slug>.md` with the format the
   parser expects:

   ```markdown
   ---
   id: <product.<slug>>
   title: <Human title>
   group: <product>
   ---
   <One paragraph description.>

   ## Steps
   1. <screen.id>
   2. <screen.id>
   ```

4. Populate steps from existing screens in the registry. Use only
   real screen ids — no ghost references.
5. Run `npm run validate`. Surface any new orphan-screen warnings that
   this journey now resolves.
