---
name: isolation-rules
description: Module-boundary rules for Mockup OS — which folders may import from which. Use whenever generating, refactoring, or moving code between framework / shell / mockups / sidecar.
---

# Isolation rules

These boundaries keep presentation mode pristine, the registry portable
across projects, and the sidecar the *only* component that touches the
filesystem.

## Allowed import edges

| From                       | May import from                                                | Notes |
|---                         |---                                                              |---    |
| `Projects/<id>/mockups/`   | `@framework/hooks`, `@framework/tokens`, `@framework/permissions`, `@framework/types`, `@framework/defineScreen`, `@mockups/_system` | Screens. Never reach into shell or store. |
| `Projects/<id>/data/`      | (no imports — JSON files)                                       | Pure data. |
| `Projects/<id>/docs/`      | (no imports — markdown)                                         | Pure prose. |
| `src/mockup-os/framework/` | itself                                                         | The framework's own internals. |
| `src/mockup-os/shell/`     | `@framework/*`, `@shell/*`, `react`, `react-router-dom`        | Builder UI. Never reach into a project's mockups directly — go through the registry. |
| `src/mockup-os/app/`       | `@framework/*`, `@shell/*`                                     | Router glue. |
| `scripts/sidecar/`         | `node:*`, dev deps, `@framework/types` (types only)            | Server. The only writer of files. |
| `scripts/lib/`, scripts    | `node:*`, `@framework/*` (types + pure helpers only)           | Build-time tools. |

## Forbidden edges

- ❌ `mockups/*` → `@shell/*` — would break presentation mode.
- ❌ `mockups/*` → `@framework/store` — couples screens to builder state. Use hooks.
- ❌ `shell/*` → `Projects/*` — projects must reach the shell only via the registry.
- ❌ Any frontend code → `node:fs` or any sidecar source. Browser code never touches disk; it talks to the sidecar.
- ❌ Cross-project imports (project A → project B). If something is shared, lift it into `@mockups/_system`.

## When in doubt

Reach for an existing import from a sibling file in the same folder. If the
sibling proves the import is allowed, your file can use the same import.
