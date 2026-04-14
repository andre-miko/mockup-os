---
description: Run the journey-auditor agent against a project; emit a markdown report.
argument-hint: [project-id]
---

Invoke the `journey-auditor` agent for the project named in $ARGUMENTS
(or the only project if exactly one exists, or ask the user to pick).

Pass the agent its inputs. Surface its full markdown report to the user
verbatim — don't summarise. The auditor never edits files, so no
follow-up validate is required.
