# Changelog

All notable changes to Mockup OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are in ISO 8601 (`YYYY-MM-DD`).

## [Unreleased]

### Added

- Community-health files for the public launch: `README.md` (expanded), `LICENSE` at repo root, `CONTRIBUTING.md`, `SECURITY.md`, `GOVERNANCE.md`, `ROADMAP.md`, `CHANGELOG.md`, and `.github/CODEOWNERS`.
- Handoff v2 (partial): per-screen PNG snapshots via `scripts/snapshot-screens.ts`, an embedded `README.md` in each handoff pack, and a frozen `brief.md` (concatenation of `brief/*.md`) so the pack is a standalone artifact.
- `/new-journey` slash command for scaffolding new journey markdowns.
- `CHECKLIST.md` — manual feature-verification pass to run before the first tagged release.

### Changed

- `LICENSE` now lives at the repository root to match GitHub's community-profile expectations. The copy under `docs/LICENSE` is no longer the canonical one.
- Documentation drift fixed: top-level narrative docs (README, ROADMAP, CHANGELOG, CONTRIBUTING, `docs/authoring.md`) now consistently refer to the example product folder as `example-project`. The "Finch" name is retained as the *brand* of that example (routes, screen ids, fixtures keep their `finch.*` namespace to show what a real product's conventions look like).

### Planned for v0.2

See [ROADMAP.md](ROADMAP.md) for the full plan. Remaining items:

- Token map and component index per handoff pack.
- Handoff diff tool (`v<n-1>` vs `v<n>`).
- DOM + computed styles capture alongside the PNG snapshots.
- Second example product beyond `example-project`.
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
