<div align="center">

# Mockup OS

**An authoring platform for high-fidelity product mockups — built for humans and AI agents working together.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)](ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Quick start](#quick-start) · [Why Mockup OS](#why-mockup-os) · [Architecture](#architecture) · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## What is Mockup OS?

**Mockup OS is a React-based operating system for product mockups.** Each mockup is a real `.tsx` route — not an image, not a Figma frame, not a vibe-coded throwaway. A single shell renders every project, a metadata registry keeps screens coherent, and a Fastify sidecar lets AI agents safely generate, refine, validate, and document the work.

The result: mockups that *look* like the final product, *behave* like the final product, and produce a clean handoff pack when the design work is done.

> A mockup in Mockup OS is a real React route backed by structured metadata. The shape of that metadata is the guardrail that keeps AI-generated screens coherent across pages, flows, and iterations.

## Why Mockup OS exists

Today's options for producing high-fidelity mockups all fail in predictable ways:

| Approach                | What breaks                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| **Figma**               | Frames drift from code. Flows are faked with arrows. Handoff is a screenshot.        |
| **Screenshots / decks** | No interaction, no state model, no navigation, no consistency guardrails.            |
| **Vibe-coded pages**    | Gorgeous in isolation, incoherent as a system. Broken routes. Missing states.        |
| **Raw AI codegen**      | Fast but chaotic. Style drift between screens. No registry, no validation, no audit. |

Mockup OS takes the middle path:

- Every mockup is **a real React route**, rendered by the same shell as every other screen.
- Every route is **declared with `defineScreen(...)`** — id, title, states, fixtures, permissions, journeys, layout family, known gaps, status.
- The metadata is **validated on every change**. Broken registry = exit non-zero = agents can't land a broken change.
- A **presentation mode** hides all builder chrome so the mockup looks *exactly* like the final product — no padding, no reserved space, no toolbar gaps.
- An **AI sidecar** mediates all file writes. The frontend never touches `node:fs`. Agents get a typed surface; the disk stays safe.

## Key features

- **Multi-project shell.** One runtime, many products under `/Projects/<id>/`.
- **Screen registry with validation.** `defineScreen(...)` + `npm run validate` catches drift immediately.
- **Presentation mode.** Toggle `H` and `P` to strip the builder chrome. The mockup fills the viewport like the shipped app.
- **Metadata-driven inspector.** Right panel shows states, fixtures, components, permissions, journeys, known gaps.
- **AI agent surface.** `.claude/` agents scaffold screens, audit journeys, plan sitemaps, expand briefs, and build handoff packs.
- **Fastify sidecar.** The only process that writes to disk. AI calls and file mutations flow through one safe pipe.
- **Versioned handoff packs.** `npm run handoff` produces `artifacts/handoff/v<n>/` with docs, screenshots, and a brief lock.
- **Fixture system.** Typed JSON in `data/`, bound through `mockups/fixtures.ts`, swappable per state.
- **Permissions model.** Declare in `project.config.ts`, gate per call-site with `usePermission`.
- **Isolation rules.** Mockups can never import from the shell. Presentation mode stays pristine by construction.

## Screenshot

<!-- TODO: replace with real screenshot/GIF before public launch -->

> **Coming soon.** A screenshot and a short recording of builder mode → presentation mode → handoff will ship with the first tagged release. Track progress in [ROADMAP.md](ROADMAP.md).

## Quick start

```sh
git clone https://github.com/miko/mockup-os.git
cd mockup-os/src/mockup-os
npm install
npm run dev:all
```

Open <http://localhost:5173>. You'll land on the example product.

Keybinds:

- `H` — hide the shell (presentation mode on/off).
- `P` — toggle presentation mode explicitly.
- `?` — show all keybinds.

Scripts (run from `src/mockup-os/`):

| Command              | Purpose                                                   |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Vite dev server                                           |
| `npm run sidecar`    | Fastify sidecar on `:5179` (AI calls + file writes)       |
| `npm run dev:all`    | Both, in parallel                                         |
| `npm run build`      | Typecheck + production build                              |
| `npm run typecheck`  | TypeScript only                                           |
| `npm run lint`       | ESLint                                                    |
| `npm run test`       | Vitest (unit + registry validation)                       |
| `npm run e2e`        | Playwright smoke tests                                    |
| `npm run validate`   | Validate the registry, exit non-zero on errors            |
| `npm run docs:build` | Generate Markdown docs into `artifacts/docs/`             |
| `npm run handoff`    | Build a versioned handoff pack under `artifacts/handoff/` |

## Example workflow with AI agents

Mockup OS ships with a `.claude/` directory of named agents, slash commands, and skills. A typical session looks like:

```text
You:    /new-screen example-project "Transfer scheduled confirmation"
Claude: → mockup-generator agent
          • writes Projects/example-project/mockups/screens/TransferScheduled.tsx
          • registers it in Projects/example-project/mockups/index.ts
          • declares defineScreen(...) with states, fixtures, journeys
          • runs `npm run validate` — green

You:    /audit-journeys example-project
Claude: → journey-auditor agent
          • reads docs/journeys/*.md
          • cross-references the registry
          • reports: "transfer-scheduled" journey references 4 screens, 1 is a ghost

You:    /audit-sitemap example-project
Claude: → sitemap-planner agent
          • refreshes docs/sitemap.md
          • adds 3 ghost screens to cover the gap

You:    /handoff example-project
Claude: → handoff-reviewer agent (pre-flight)
        → npm run handoff
          • artifacts/handoff/v3/ written
          • brief locked, screens snapshotted, manifest signed
```

The agents are defined in [.claude/agents/](.claude/agents/). Slash commands are in [.claude/commands/](.claude/commands/). Read [CLAUDE.md](CLAUDE.md) to see how the pieces fit together.

## Architecture

```text
Projects/<id>/                     one product per folder
  brief/*.md                       authored brief sections
  docs/                            sitemap, journeys, features, permissions
  data/<fid>.json                  fixture payloads (sidecar-managed)
  mockups/                         TSX screens + fixtures + layout
  artifacts/                       generated (docs, handoff packs) — gitignored

src/mockup-os/                     the runnable Vite + React project
  app/                             Router glue
  framework/                       types, registry, validation, hooks, store, tokens
  shell/                           TopBar, PromptBar, Left/RightPanel, tabs
  mockups/_system/                 cross-project primitives
  tests/                           Vitest + Playwright

scripts/
  sidecar/                         Fastify server — the ONLY file writer
    ai/                            adapter: claude-code | anthropic | none
    fs/                            path-safe filesystem helpers
    handlers/                      HTTP routes
  validate-registry.ts             registry validator
  build-docs.ts                    per-project docs generator
  build-handoff.ts                 per-project handoff pack builder

.claude/                           agents, slash commands, skills
docs/                              architecture, authoring, conventions, master-brief
```

### The two contracts that hold the system together

1. **Mockups may not import from `@shell` or `@framework/store`.** They use `@framework/hooks` and `@framework/tokens` only. This is what lets presentation mode be pixel-identical to the shipped app — the mockup genuinely doesn't know the shell exists.

2. **The frontend never touches `node:fs`.** All file writes go through the sidecar (`/api/projects/...`). This is what makes AI agent actions auditable, reversible, and safe to run unattended.

Full architectural discussion: [docs/architecture.md](docs/architecture.md).

## Why not Figma? Why not screenshots? Why not vibe-coded pages?

**Why not Figma?** Figma is excellent for exploration. It's a poor fit for the *last mile* of a mockup, where every route must be coherent, every state must be inspectable, and handoff must be lossless. Figma frames drift from the code that gets shipped. Mockup OS *is* the code that gets shipped, minus the backend.

**Why not screenshots or Keynote decks?** Screenshots have no state model. A deck can't tell you which permission gated the button that's missing. A deck can't be validated. A deck can't be diffed. You can't `grep` for a deprecated screen in a deck.

**Why not just vibe-code pages with an AI?** Because AI-generated pages in isolation produce gorgeous, incoherent systems. Style drift between screens. Invented routes. Missing empty and error states. No registry, no validation, no audit trail. Mockup OS is what you get when you force AI codegen to land its output into a typed, validated registry *every single time*.

**Why not just ship the real app?** Because the real app has a backend. Mockup OS lets you design, iterate, and get stakeholder sign-off on the entire product surface — every screen, every state, every flow — before a single backend engineer writes a line of code.

## Contributing

We welcome contributions. Before you open a PR, please read:

- [CONTRIBUTING.md](CONTRIBUTING.md) — how to set up, what's in scope, style rules, and the PR checklist.
- [GOVERNANCE.md](GOVERNANCE.md) — who decides what, and how decisions are made, including the conduct expectations.
- [SECURITY.md](SECURITY.md) — how to responsibly report a vulnerability.

Good first issues are tagged [`good first issue`](https://github.com/miko/mockup-os/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## Roadmap

High-level direction lives in [ROADMAP.md](ROADMAP.md). Dated changes live in [CHANGELOG.md](CHANGELOG.md). Near-term highlights:

- **v0.2** — Handoff v2 with snapshots, README, and brief lock.
- **v0.3** — Second example product beyond the current `example-project`.
- **v0.4** — Multi-viewport screenshot matrix in handoff packs.
- **v1.0** — Stable registry schema, documented agent API, published handoff manifest format.

## License

Mockup OS is released under the [MIT License](LICENSE). You may use it freely in commercial and non-commercial work. Attribution is appreciated but not required.

---

<div align="center">

Built by [Miko](https://github.com/miko) and contributors.

</div>
