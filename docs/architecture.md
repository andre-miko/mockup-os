# Architecture

## Layers

```
app/        — thin entry point: <BrowserRouter> → <Shell> → <AppRouter>
shell/      — builder chrome; removable with zero layout residue
framework/  — types, registry, validation, tokens, hooks, zustand store
mockups/    — product mockups (screens + metadata)
  _system/  — shared mockup-side primitives
  <product> — one product per folder; single index registers everything
docs/       — handwritten guides
scripts/    — Node scripts for validate / docs / handoff
```

## The registry is the source of truth

The `registry` is built from the aggregate `@mockups/index` export. Adding a screen is a single declarative step; the router, left panel, metadata inspector, docs generator, and handoff pack all derive from that one declaration.

## The shell contract

The shell **must not** leak layout into the mockup. When `shellVisible` is false or `presentationMode` is true, `Shell` returns its children inside a single `<div id="mockup-root">` with no padding, no flex, no margin. That `<div>` exists only so keybind handling can work — it is otherwise inert.

## Isolation rules

- `@mockups/*` **may not** import from `@shell/*`.
- `@mockups/*` may import from `@framework/*` but only via `@framework/hooks` and `@framework/tokens`. The zustand store is off-limits.
- `@shell/*` **may** import from `@framework/*`.
- `@framework/*` is the only layer allowed to import the registry aggregate.

These rules are not enforced by ESLint yet (see next steps) but are respected by the example product and should be respected by all additions.

## Validation

`validateRegistry` runs at dev-time (via the test suite) and in CI (via `npm run validate`). It catches the structural problems that AI-generated mockups are especially prone to: duplicate ids, broken references, orphans, and inconsistent states.
