# Changelog

All notable changes to Mockup OS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are in ISO 8601 (`YYYY-MM-DD`).

## [Unreleased]

### Added

- Community-health files for the public launch: `README.md` (expanded), `LICENSE` at repo root, `CONTRIBUTING.md`, `SECURITY.md`, `GOVERNANCE.md`, `ROADMAP.md`, `CHANGELOG.md`, and `.github/CODEOWNERS`.

### Changed

- `LICENSE` now lives at the repository root to match GitHub's community-profile expectations. The copy under `docs/LICENSE` is no longer the canonical one.

### Planned for v0.2

See [ROADMAP.md](ROADMAP.md) for the full plan. Highlights:

- Handoff v2 with snapshots, embedded README, and brief lock (Phase 11).
- Second example product beyond `finch`.
- Hardened sidecar path-safety tests.

## [0.1.0] — TBD

The first tagged release. Cut when the community-health files are in, the registry validator is stable, and the handoff pipeline produces a clean v2 artifact.

### Delivered in the initial drop (pre-tag)

- Multi-project shell rendering any product under `/Projects/<id>/`.
- Fastify sidecar as the sole file writer (`scripts/sidecar/`).
- AI adapter with `claude-code`, `anthropic`, and `none` modes.
- `defineScreen(...)` registry with schema validation (`npm run validate`).
- Left panel tabs: sitemap, journeys, screens, briefs, prompts.
- Right panel inspector: states, fixtures, components, permissions, journeys, known gaps.
- ts-morph-based screen CRUD through the sidecar.
- `.claude/` agents, commands, and skills for agent-driven authoring:
  - `mockup-generator`, `journey-auditor`, `sitemap-planner`, `docs-writer`,
    `permission-analyst`, `data-generator`, `component-curator`,
    `brief-expander`, `handoff-reviewer`.
- Slash commands wrapping the agents: `/new-screen`, `/audit-journeys`,
  `/audit-sitemap`, `/generate-data`, `/expand-brief`, `/handoff`,
  `/new-journey`.
- Presentation mode (`H` / `P` keybinds) with structural isolation of the shell.
- Example product: `finch` (banking dashboard with transfer flow).
- Handoff v1: per-project versioned manifest under `artifacts/handoff/v<n>/`.
- Docs: architecture, authoring, conventions, master brief, prompt templates.

---

[Unreleased]: https://github.com/miko/mockup-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/miko/mockup-os/releases/tag/v0.1.0
