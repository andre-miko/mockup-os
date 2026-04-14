---
name: fixture-authoring
description: How to declare and shape fixtures (sample data) for Mockup OS screens. Use whenever creating a screen that needs data, generating new fixture data, or wiring a screen state to a fixture.
---

# Fixture authoring

Fixtures are static sample payloads injected into screens. They make
empty/populated/edge-case states authorable without bolting on a fake API.

## File layout

- `Projects/<id>/data/<fixtureId>.json` — the JSON payload (Phase 8 onwards).
- `Projects/<id>/mockups/fixtures.ts` — the registration surface that
  imports each JSON and wraps it in `defineFixture`.
- The TS schema (e.g., `interface Account { ... }`) lives next to the
  fixture binding so screens get full type inference via `useFixture<Account[]>(id)`.

## Naming convention

`<product>.<noun>.<variant>` — e.g., `finch.accounts.default`,
`finch.accounts.empty`, `finch.transactions.recent`. Keep ids
self-descriptive; the Data tab and handoff manifest both surface them.

## Authoring a new fixture

1. Create `Projects/<id>/data/<fixtureId>.json` with the payload.
2. Add a binding in `Projects/<id>/mockups/fixtures.ts`:

   ```ts
   import myData from '../data/my.fixture.json';

   export const myFixture = defineFixture<MyType>({
     id: 'my.fixture',
     description: 'One-line explanation surfaced in the Data tab',
     data: myData as MyType,
   });

   // Don't forget to add to allFixtures:
   export const allFixtures = [..., myFixture];
   ```

3. Reference from `defineScreen`:

   ```ts
   defineScreen({
     // ...
     fixtures: ['my.fixture'],
   })
   ```

## State-scoped fixtures

A screen can swap fixtures per state. Declare per-state binding inside
`states[].fixtures` (overrides the screen-level list). The Data tab's
"Used by" reverse-map already accounts for this, and the right-panel
`States` accordion shows the diff between active and default state.

```ts
states: [
  { id: 'populated', label: 'Populated', fixtures: ['accounts.default'] },
  { id: 'empty',     label: 'Empty',     fixtures: ['accounts.empty'] },
],
```

## Don't

- Don't generate fixtures with PII even by accident. Use invented values
  that look real but are clearly mockup data (`Avery Kim`, `acc_1`, `4021`).
- Don't put behaviour inside fixtures (no methods, no React types). They
  are pure JSON-serialisable values.
- Don't reference a fixture id that isn't in `allFixtures`. Validation
  will fail with `screen-fixture-missing`.

## Realism guidelines

- Money in cents *or* dollars-with-decimals — pick one per project and stay
  consistent. Finch uses dollars-with-decimals.
- Dates in ISO 8601 (`YYYY-MM-DD` for date-only).
- Arrays should have ≥3 elements unless representing an explicit empty/single state.
- Mix positive and negative deltas / values so the UI exercises both styles.
