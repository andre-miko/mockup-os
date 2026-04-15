# Architecture

## Layers

```text
app/        — thin entry point: <BrowserRouter> → <Shell> → <AppRouter>
shell/      — builder chrome; removable with zero layout residue
framework/  — types, registry, validation, tokens, hooks, zustand store
mockups/    — product mockups (screens + metadata)
  _system/  — shared mockup-side primitives
  <product> — one product per folder; single index registers everything
docs/       — handwritten guides
scripts/    — Node scripts for validate / docs / handoff / preflight / snapshot
  sidecar/  — Fastify server; the ONLY process that writes to disk
```

## The registry is the source of truth

The `registry` is built from the aggregate `@mockups/index` export. Adding a screen is a single declarative step; the router, left panel, metadata inspector, docs generator, and handoff pack all derive from that one declaration.

When the registry references a route that isn't yet registered (typically because it's listed in `docs/sitemap.md` as a proposed screen), the router renders a `GhostPlaceholder` — a first-class "Proposed screen" stub with the rationale from the sitemap. Ghost screens are navigable, surface-able in the sitemap tab, and are the integration point for the `/new-screen` flow.

## The shell contract

The shell **must not** leak layout into the mockup. When `presentationMode` is true, `Shell` returns its children inside a single `<div id="mockup-root">` with no padding, no flex, no margin. That `<div>` exists only so keybind handling can work — it is otherwise inert.

## The sidecar is the only process that writes to disk

The browser frontend never touches `node:fs`. All file mutations — fixture saves, brief edits, screen CRUD, handoff snapshots — go through the Fastify sidecar at `:5179`. The sidecar:

- Wraps file IO in path-safety helpers (`scripts/sidecar/fs/`).
- Exposes AST-level screen CRUD via `ts-morph` (`screens-ast.ts`): duplicate, delete, set status, edit known gaps — all preserve formatting and fail atomically if parsing breaks.
- Mediates AI calls through a pluggable adapter (`claude-code` | `anthropic` | `none`) with a streaming response contract surfaced in the prompt bar.
- Exposes `/api/projects/:id/ai/status` so the UI can explain itself when AI is not configured.

## Fixture overrides

`useFixture(id)` first checks a per-project × per-fixture override in the zustand store; if present it returns the override, otherwise the bundled fixture. The Data panel writes into this store as you type. "Save" flushes the override to disk through the sidecar; "Revert" clears the override. This means the shell never has to reload for a fixture edit to take effect, and disk stays untouched until you commit the change.

## Isolation rules

- `@mockups/*` **may not** import from `@shell/*`.
- `@mockups/*` may import from `@framework/*` but only via `@framework/hooks` and `@framework/tokens`. The zustand store is off-limits.
- `@shell/*` **may** import from `@framework/*`.
- `@framework/*` is the only layer allowed to import the registry aggregate.
- The frontend as a whole **may not** import `node:fs`. File writes go through the sidecar.

These rules are enforced by `npm run preflight` (the `isolation` check group) and respected by the example products.

## Validation

`validateRegistry` runs at dev-time (via the test suite), in CI (via `npm run validate`), and as part of `npm run preflight`. It catches the structural problems that AI-generated mockups are especially prone to: duplicate ids, broken references, orphans, and inconsistent states. Preflight also runs a *negative* test that intentionally breaks the registry to confirm the validator actually fails on broken input.
