# Mockup OS — Claude context

This is **Mockup OS**, an authoring platform for product mockups. Each
folder under `/Projects/` is one product. The shell at `src/mockup-os/`
renders every project; a Fastify sidecar at `scripts/sidecar/` mediates
file writes and AI calls.

## How to help in this repo

`.claude/agents/`, `.claude/commands/`, and `.claude/skills/` are the
canonical entry points. Prefer dispatching to a named agent when the
user's request matches its description — that keeps behaviour
predictable across sessions.

| Agent | Use for |
|---|---|
| `mockup-generator` | Add a new screen (TSX + registration + validate). |
| `journey-auditor` | Read-only audit of journey markdowns vs registry. |
| `sitemap-planner` | Refresh `docs/sitemap.md` with new ghost screens. |
| `docs-writer` | Author `docs/features|components|styles|layouts/*.md`. |
| `permission-analyst` | Propose permissions for a screen + narrative docs. |
| `data-generator` | Emit fixture JSON only — no prose, ever. |
| `component-curator` | Spot duplicated patterns; propose `_system` lifts. |
| `brief-expander` | Rewrite ONE brief markdown section in place. |
| `handoff-reviewer` | Pre-flight gate before `npm run handoff`. |

Slash commands wrap the agents (`/new-screen`, `/audit-journeys`,
`/audit-sitemap`, `/generate-data`, `/expand-brief`, `/handoff`,
`/new-journey`).

## Repo map

```
Projects/<id>/
  brief/*.md             — authored brief sections
  docs/                  — authored UX docs (sitemap, journeys, features…)
  data/<fid>.json        — fixture payloads (writeable via sidecar)
  mockups/               — TSX screens + fixtures + Layout
  artifacts/             — generated output (gitignored)
src/mockup-os/
  framework/             — types, registry, hooks, validation, AI client
  shell/                 — TopBar, PromptBar, Left/RightPanel, tabs/, common/
  app/                   — Router glue
  mockups/_system/       — cross-project primitives
scripts/
  sidecar/               — Fastify server (the only file writer)
    ai/                  — adapter (claude-code | anthropic | none)
    fs/                  — path-safe filesystem helpers
    handlers/            — HTTP routes
  build-docs.ts          — generates per-project artifacts/docs/
  build-handoff.ts       — generates per-project artifacts/handoff/v<v>/
  validate-registry.ts   — registry validator (run on every change)
.claude/                 — agents/commands/skills (this file's siblings)
```

## Run commands (from `src/mockup-os/`)

- `npm run dev` — Vite dev server. Auto-discovers projects, hot-reloads on file changes.
- `npm run sidecar` — Fastify on `:5179`. Required for AI, file writes, brief editing.
- `npm run dev:all` — both in parallel.
- `npm run validate` — exit-non-zero on registry errors. Run after EVERY file mutation.
- `npm run docs:build` — regen `Projects/<id>/artifacts/docs/`.
- `npm run handoff` — build versioned manifests under each project's `artifacts/handoff/v<version>/`.
- `npm test` — vitest. Should always pass; if it doesn't, the change isn't done.

## Conventions you must respect

Read these in `.claude/skills/` before mutating code:

- **isolation-rules.md** — which folder may import from which. Violating these breaks presentation mode.
- **design-tokens.md** — colours/spacing through `framework/tokens.ts`, never inline.
- **appframe-patterns.md** — the standard screen shape inside a product layout.
- **permissions-authoring.md** — declare in `project.config.ts`, gate per-call-site with `usePermission`.
- **fixture-authoring.md** — JSON in `data/`, bind in `mockups/fixtures.ts`, type with the schema.

Two non-negotiables:

1. **Mockups never import from `@shell` or `@framework/store`.** They use `@framework/hooks` and `@framework/tokens` only. This rule keeps presentation mode pristine — without it, the `H` keybind would visibly affect the rendered mockup.
2. **The frontend never touches `node:fs`.** All file writes go through the sidecar (`/api/projects/...`). Tests live in `src/mockup-os/tests/` — vitest with jsdom — and use temp dirs for any disk work.

## Status

Phases 0–10 complete (multi-project, sidecar, AI adapter, all 5 left-panel
tabs, full right-panel inspector, ts-morph CRUD on screens, `.claude/`
agents/commands/skills). Phase 11 (handoff v2 with snapshots + README +
brief lock) is pending.
