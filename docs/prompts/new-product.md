# Prompt: scaffold a new product

Use this when asking an AI agent to add a *new mocked product* (e.g., a second app alongside Finch).

---

You are adding a product to an **AI Mockup Kit** project.

1. Create `src/mockup-os/mockups/<product>/` with:
   - `index.ts` — the single registration surface (screens, journeys, fixtures).
   - `<Product>Layout.tsx` — a persistent layout that renders `<Outlet />` inside the product's `AppFrame`.
   - `fixtures.ts` — all sample data.
   - `screens/` — one file per screen.

2. Register the layout in `src/mockup-os/mockups/index.ts` by adding to `productLayouts` with a `prefix` matching every screen route.

3. Route convention: every screen lives under `/<product>/...`. IDs are namespaced `<product>.<screen>`.

4. Ship with at least:
   - A primary landing screen.
   - A list → detail flow.
   - A multi-step journey (e.g., a wizard) with at least three screens.
   - Realistic empty and populated states on the landing screen.

5. Run `npm run validate` and fix all error-level issues before returning.

6. Update `docs/` with a one-page `product-<name>.md` describing the product and its audience.

Do NOT:
- Import from other products.
- Modify `@framework` or `@shell` code.
- Invent new design tokens — extend `_system` if something is genuinely shared.
