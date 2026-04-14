# Prompt: add a new screen

Use this when asking an AI agent to create a new mockup screen.

---

You are adding a screen to an **AI Mockup Kit** project. Follow these rules.

1. Create a component in `src/mockup-os/mockups/<product>/screens/<Name>.tsx`. The component must:
   - Render using the product's `AppFrame` primitives (header + body).
   - Read data via `useFixture(id)` and state via `useScreenState(screenId)` from `@framework/hooks`.
   - **Never** import from `@shell/*` or `@framework/store`.
   - Be plain JSX/TSX — no dynamic HTML, no dangerouslySetInnerHTML.

2. Register the screen in `src/mockup-os/mockups/<product>/index.ts` using `defineScreen(...)`. Provide every required field, including:
   - a unique `id` namespaced by product (e.g. `finch.new-screen`)
   - a valid `route` starting with `/`
   - at least one journey OR an explanation in `description`
   - realistic `states` and a `defaultStateId`
   - known gaps if any

3. Run `npm run validate`. Fix any error-level issues before returning.

4. Respect existing design tokens (`src/mockup-os/framework/tokens.ts`) and the `_system` UI primitives. Do not introduce new spacing or colors unless asked.

5. Keep the screen **structurally consistent** with existing screens in the product — same page header pattern, same spacing, same empty-state treatment.

Deliver:
- the new component file
- the diff to the product `index.ts`
- a one-paragraph rationale for the states and known gaps you declared
