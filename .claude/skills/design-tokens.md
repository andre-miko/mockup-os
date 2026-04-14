---
name: design-tokens
description: Reference for the Mockup OS design token surface. Use whenever choosing colours, spacing, radii, or fonts inside a screen or shared component.
---

# Design tokens

The single source of truth for visual language is `src/mockup-os/framework/tokens.ts`.
Every project shares this surface; never inline colours or arbitrary spacing values
in screen TSX. If a token is missing, propose adding it to `tokens.ts` rather than
hardcoding the value.

## Categories

- `tokens.color.*` — semantic colours (`bg`, `surface`, `border`, `text`, `accent`, `success`, `warn`, `danger` …).
- `tokens.spacing.*` — `xs|sm|md|lg|xl|2xl`. Use these for paddings/margins inside primitives.
- `tokens.radius.*` — `sm|md|lg|xl|pill`.
- `tokens.font.*` — `sans` (Inter), `mono`.

## Tailwind mapping

The shell uses Tailwind. Token-equivalent classes are already wired in
`tailwind.config.js`:

- `text-shell-text`, `bg-shell-bg`, `bg-shell-panel`, `border-shell-border`,
  `text-shell-muted`, `text-shell-accent`, `bg-shell-accent`.
- Standard tailwind for product-side colours (e.g., `bg-emerald-500` for shipped
  status). When in doubt: use the shell-* classes inside shell chrome, plain
  tailwind inside mockups.

## Don't

- Don't introduce new colour hexes inside screen files.
- Don't override `tokens` values per-product. Add a new token if you need
  variant treatment.
- Don't import from `@framework/store` to read tokens; tokens are static —
  import directly from `@framework/tokens`.

## Do

- Reuse `_system/ui.tsx` primitives (`Card`, `Button`, `Stat`, `EmptyState`,
  `PageHeader`) before reaching for raw Tailwind utilities. The primitives
  embed tokens correctly.
