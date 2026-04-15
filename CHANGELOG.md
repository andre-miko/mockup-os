# Changelog

All notable changes to Mockup OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are in ISO 8601 (`YYYY-MM-DD`).

## [Unreleased]

### Added

- **Community-health files** for the public launch: expanded `README.md`, `LICENSE` at repo root, `CONTRIBUTING.md`, `SECURITY.md`, `GOVERNANCE.md`, `ROADMAP.md`, `CHANGELOG.md`, and `.github/CODEOWNERS`.
- **Handoff v2 (partial)**: per-screen PNG snapshots via `scripts/snapshot-screens.ts` (Playwright, in presentation mode), an embedded `README.md` in each handoff pack, and a frozen `brief.md` (concatenation of `brief/*.md`) so the pack is a standalone artifact.
- **Left panel — five fully working tabs**: Sitemap (by-section / by-URL views, live search, ghost-screen surfacing, status legend), Journeys (tree navigation with cross-panel focus), Patterns (shared-component detection), Data (per-project fixture browser with JSON preview and generate / regenerate buttons), Brief (renders authored markdown sections with an "Expand with AI" button per section that dispatches the `brief-expander` agent).
- **Fixture override system**. The Data panel in the right inspector now has an inline JSON editor (`JsonTree`). Edits land in an in-memory override store per project × fixture, taking effect immediately. "Save" writes through the sidecar; "Revert" clears the override and restores the on-disk value. `useFixture(id)` checks the override store before falling back to the bundled fixture.
- **Right panel — Known Gaps**. `KnownGapsPanel` + `InlineEdit` let you add / edit / remove known gaps per screen, persisted through the sidecar.
- **Right panel — Journey Membership** and **States** panels refined for focus tracking across left and right panels.
- **ts-morph-based screen CRUD**. The sidecar can duplicate, delete, set status, and edit known gaps on any screen by mutating the project's `mockups/index.ts` at the AST level. Mutations preserve formatting and comments and fail atomically if parsing breaks. Endpoints live under `/api/projects/:id/screens/...`.
- **Prompt bar — progress indicator**. A spinner with elapsed seconds, plus a slow-hint after 10 s when the `claude-code` backend is warming up. Streaming AI responses land in a collapsible drawer pinned bottom-right, showing prompt, status, model metadata, and elapsed time.
- **Ghost screen placeholder**. Routes that are referenced by `docs/sitemap.md` but not yet registered render a first-class "✨ Proposed screen" stub (`GhostPlaceholder.tsx`) with the rationale from the sitemap and a call to run `/new-screen`.
- **Panel resizer**. Drag handles on the inner edge of the left and right builder panels. Double-click resets to default; widths persist in `localStorage`. Pointer-event based (works on touch), keyboard-accessible with `role="separator"`.
- **Project picker** popover with outside-click / Escape dismissal; single-project mode renders a static label.
- **Second example product**: `Projects/habit-tracker/` — a minimal consumer habit tracker ("Sprout") with two implemented screens (`Today`, `Habits`), a fixture, a layout, and a `project.config.ts`. Used to exercise multi-project switching in the shell.
- **Preflight check script** (`npm run preflight`, `scripts/preflight.ts`). Runs grouped checks — env, install, static (typecheck / lint / vitest), registry validation (including a negative test that confirms the validator actually fails on intentionally-broken input), isolation (no mockup ↔ `@shell`/`@framework/store` imports, no frontend `node:fs`), and optional sidecar probes. Flags: `--skip`, `--only`, `--sidecar-url`, `--no-negative`.
- **Sample fixture variations**: `docs/samples/finch.accounts.sample-minimal.json`, `.sample-wealthy.json`, and `.sample.json` show data variation under the same schema for the example product.
- `/new-journey` slash command for scaffolding new journey markdowns.
- New store fields (`framework/store.ts`): `leftPanelTab` (persisted), `journeyFocus`, `fixtureOverrides`, `optimisticStatus`, `permissionOverrides`.
- AI status probe (`GET /api/projects/:id/ai/status`) reports `backend`, `configured`, optional `reason`, and optional `model` so the prompt bar can explain itself when the backend is `none`.

### Changed

- **`CHECKLIST.md` removed.** The manual feature-verification pass has been superseded by the automated `preflight` script.
- **`LICENSE`** now lives at the repository root to match GitHub's community-profile expectations. The copy under `docs/LICENSE` is no longer canonical.
- **Documentation drift** fixed: top-level narrative docs (README, ROADMAP, CHANGELOG, CONTRIBUTING, `docs/authoring.md`) now consistently refer to the example product folder as `example-project`. The "Finch" name is retained as the *brand* of that example (routes, screen ids, fixtures keep their `finch.*` namespace to show what a real product's conventions look like).
- **Router** groups entries by layout family; unknown routes fall through to `GhostPlaceholder` if they match the sitemap, else `NotFound`.

### Fixed

- AI prompt status probing is now resilient to slow or missing backends; the prompt bar explains how to enable AI when `backend: none`.
- Committed stray JS/DTS artifacts under `Projects/example-project/mockups/` are gone; TSX is now the single source of truth.

### Planned for v0.2

See [ROADMAP.md](ROADMAP.md) for the full plan. Remaining items:

- Token map and component index per handoff pack.
- Handoff diff tool (`v<n-1>` vs `v<n>`).
- DOM + computed styles capture alongside the PNG snapshots.
- Fleshing out the second example product (`habit-tracker`) across a different layout family.
- Hardened sidecar path-safety tests.

## [0.1.0] — TBD

The first tagged release. Cut when the community-health files are in, the registry validator is stable, and the handoff pipeline produces a clean v2 artifact.

### Delivered in the initial drop (pre-tag)

- Multi-project shell rendering any product under `/Projects/<id>/`.
- Fastify sidecar as the sole file writer (`scripts/sidecar/`).
- AI adapter with `claude-code`, `anthropic`, and `none` modes.
- `defineScreen(...)` registry with schema validation (`npm run validate`).
- Left panel tabs: sitemap, journeys, patterns, data, brief.
- Right panel inspector: states, data (fixtures), permissions, journey membership, and a status dropdown.
- ts-morph-based screen CRUD through the sidecar.
- `.claude/` agents, commands, and skills for agent-driven authoring:
  - `mockup-generator`, `journey-auditor`, `sitemap-planner`, `docs-writer`,
    `permission-analyst`, `data-generator`, `component-curator`,
    `brief-expander`, `handoff-reviewer`.
- Slash commands wrapping the agents: `/new-screen`, `/audit-journeys`,
  `/audit-sitemap`, `/generate-data`, `/expand-brief`, `/handoff`,
  `/new-journey`.
- Presentation mode (`H` / `P` keybinds) with structural isolation of the shell.
- Example product: `example-project` (a simulated consumer banking product branded "Finch", with a transfer flow).
- Handoff v1: per-project versioned manifest under `artifacts/handoff/v<n>/`.
- Docs: architecture, authoring, conventions, master brief, prompt templates.

---

[Unreleased]: https://github.com/miko/mockup-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/miko/mockup-os/releases/tag/v0.1.0
