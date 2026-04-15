<div align="center">

# Mockup OS

**The missing layer between Figma and production code.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)](ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Quick start](#quick-start) · [What it is](#what-is-mockup-os) · [Architecture](#architecture) · [Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md)

</div>

---

## What is Mockup OS?

**Mockup OS is a code-first mockup workspace for visually designing a cohesive user experience — every screen, every state, every flow — as real React code that looks like the shipped app.** A validated metadata registry keeps dozens of screens coherent as the product grows. AI agents scaffold new screens, audit flows, fill gaps, and build versioned handoff packs through a typed surface that won't let them land broken changes. A "presentation mode" strips the builder chrome so each mockup renders pixel-identically to what ships.

Use it when Figma isn't enough, when stakeholders need to *believe* the product works, and when you want to pin down every empty state, error, and permission-gated edge case before a single backend engineer writes a line of code.

### Where it fits

|                             | Figma / design tools    | Screenshots & decks    | Vibe-coded AI pages        | **Mockup OS**                                     |
| --------------------------- | ----------------------- | ---------------------- | -------------------------- | ------------------------------------------------- |
| Looks like the product      | Mostly                  | Yes (until it doesn't) | Yes                        | **Yes — it *is* the code that would ship**        |
| Real routing & state        | No                      | No                     | Sometimes                  | **Yes**                                           |
| Coherent across 30+ screens | With heroic discipline  | No                     | No                         | **Enforced by a validated registry**              |
| Safe for AI to author       | No (it's a canvas)      | N/A                    | Not really                 | **Yes — typed surface, sidecar mediation**        |
| Handoff to engineering      | Screenshot + prayer     | Screenshot + prayer    | Lift-and-shift a prototype | **Versioned pack: code + snapshots + brief lock** |
| Needs a backend             | No                      | No                     | Often yes                  | **No — sidecar is design-time only**              |

> A mockup in Mockup OS is a real React route backed by structured metadata. That metadata is the guardrail that keeps AI-generated screens coherent across pages, flows, and iterations.

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

- **Multi-project shell.** One runtime, many products under `/Projects/<id>/`. Auto-discovered, hot-reloaded, switchable via the project picker.
- **Screen registry with validation.** `defineScreen(...)` declares id, title, route, states, fixtures, permissions, journeys, layout family, known gaps, and status. `npm run validate` catches drift immediately.
- **Presentation mode.** Toggle `H` (hide chrome) or `P` (explicit toggle) and the mockup fills the viewport with zero layout residue — pixel-identical to what ships.
- **Metadata-driven right-panel inspector.** States, fixtures (with inline JSON editing + per-session overrides), permissions, journey membership, status dropdown, and **inline-editable known gaps** — all persisted through the sidecar via ts-morph AST mutations that preserve formatting.
- **Five-tab left panel.** Sitemap (by-section or by-URL, with ghost-screen surfacing), Journeys, Patterns, Data (fixture browser with generate/regenerate), and Brief (authored markdown with "Expand with AI" per section).
- **AI agent surface.** `.claude/` ships nine named agents, seven slash commands, and five authoring skills. Agents scaffold screens, audit journeys, plan sitemaps, expand briefs, generate fixtures, curate shared components, and gate handoffs. Streaming progress shows in the prompt bar with a drawer pinned bottom-right.
- **Fastify sidecar.** The only process that writes to disk. AI calls and every file mutation flow through one safe pipe (path-safety, atomic writes, AST-level CRUD for screens).
- **Fixture overrides.** Edit fixture JSON live in the Data panel; changes take effect immediately via in-memory overrides. "Save" writes through the sidecar, "Revert" restores the on-disk value.
- **Versioned handoff packs.** `npm run handoff` produces `artifacts/handoff/v<n>/` with per-screen PNG snapshots, an embedded README, and a frozen `brief.md` so the pack is a standalone artifact.
- **Ghost screens.** Routes referenced by `docs/sitemap.md` but not yet implemented render a first-class "Proposed screen" placeholder prompting you to run `/new-screen`.
- **Preflight script.** `npm run preflight` runs typecheck, lint, vitest, registry validation (plus a negative test), isolation checks, and optional sidecar probes before you tag.
- **Permissions model.** Declare in `project.config.ts`, gate per call-site with `usePermission`, toggle live from the inspector.
- **Isolation rules.** Mockups can never import from the shell or the zustand store. Presentation mode stays pristine by construction — it's not a CSS trick.

## Screenshot

<!-- TODO: replace with real screenshot/GIF before public launch -->

> **Coming soon.** A screenshot and a short recording of builder mode → presentation mode → handoff will ship with the first tagged release. Track progress in [ROADMAP.md](ROADMAP.md).

## Quick start

```sh
git clone https://github.com/Miko-Earth/mockup-os.git
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

| Command              | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `npm run dev`        | Vite dev server                                                           |
| `npm run sidecar`    | Fastify sidecar on `:5179` (AI calls + file writes)                       |
| `npm run dev:all`    | Both, in parallel                                                         |
| `npm run build`      | Typecheck + production build                                              |
| `npm run typecheck`  | TypeScript only                                                           |
| `npm run lint`       | ESLint                                                                    |
| `npm run test`       | Vitest (unit + registry validation)                                       |
| `npm run e2e`        | Playwright smoke tests                                                    |
| `npm run validate`   | Validate the registry, exit non-zero on errors                            |
| `npm run docs:build` | Generate Markdown docs into `artifacts/docs/`                             |
| `npm run snapshot`   | Capture per-screen PNG snapshots (Playwright, presentation on)            |
| `npm run handoff`    | Build a versioned handoff pack under `artifacts/handoff/`                 |
| `npm run preflight`  | Run the full pre-release gate (typecheck, lint, test, isolation, sidecar) |

## Example workflow with AI agents

Mockup OS ships with a `.claude/` directory of named agents, slash commands, and authoring skills. A typical session looks like:

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
          • adds 3 ghost screens to cover the gap (now visible as placeholders in the shell)

You:    /generate-data finch.accounts wealthy
Claude: → data-generator agent
          • writes Projects/example-project/data/finch.accounts.wealthy.json
          • inline-preview lands in the Data tab; the Data panel picks it up live

You:    /handoff example-project
Claude: → handoff-reviewer agent (pre-flight)
        → npm run handoff
          • artifacts/handoff/v3/ written
          • brief locked, screens snapshotted, README embedded, manifest signed
```

Nine agents ship out of the box: `mockup-generator`, `journey-auditor`, `sitemap-planner`, `docs-writer`, `permission-analyst`, `data-generator`, `component-curator`, `brief-expander`, `handoff-reviewer`. Seven slash commands wrap them: `/new-screen`, `/new-journey`, `/audit-journeys`, `/audit-sitemap`, `/generate-data`, `/expand-brief`, `/handoff`.

The agents are defined in [.claude/agents/](.claude/agents/). Slash commands are in [.claude/commands/](.claude/commands/). Authoring skills (isolation rules, design tokens, appframe patterns, permissions, fixtures) are in [.claude/skills/](.claude/skills/). Read [CLAUDE.md](CLAUDE.md) to see how the pieces fit together.

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

Good first issues are tagged [`good first issue`](https://github.com/Miko-Earth/mockup-os/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## License

Mockup OS is released under the [MIT License](LICENSE). You may use it freely in commercial and non-commercial work. Attribution is appreciated but not required.

---

<div align="center">

Built by [Miko Earth](https://github.com/Miko-Earth) and contributors.

</div>
