# Roadmap

This document describes where Mockup OS is headed. It is intentionally rough — priorities shift as the project learns what its users actually need. For shipped changes, see [CHANGELOG.md](CHANGELOG.md).

Items are grouped by milestone, not by date. Dates are avoided on purpose: this is a spare-time open-source project and committing to calendar-bound promises leads to either disappointment or rushed work.

## Legend

- **Now** — actively being worked on.
- **Next** — queued for the next milestone.
- **Later** — agreed direction, not yet scheduled.
- **Considering** — interesting, not yet decided.

---

## v0.1 — Public launch (now)

The goal of v0.1 is to get the project into a state where a curious stranger can clone it, run it, understand what it is, and contribute.

- [x] Multi-project shell with auto-discovery.
- [x] Fastify sidecar as the sole file writer.
- [x] `defineScreen(...)` registry and validator.
- [x] `.claude/` agents, slash commands, and skills.
- [x] Left panel (all five tabs) and right panel inspector.
- [x] Handoff v1 per project under `artifacts/handoff/v<n>/`.
- [x] Example product: `finch`.
- [ ] Community-health files: `README`, `LICENSE`, `CONTRIBUTING`, `SECURITY`, `GOVERNANCE`, `ROADMAP`, `CHANGELOG`, `CODEOWNERS`.
- [ ] Screenshot and a short recording of builder → presentation → handoff.
- [ ] First tagged release on GitHub.

## v0.2 — Handoff v2 (next)

The handoff pack is currently minimal. v0.2 makes it genuinely useful for a downstream engineering team.

- [ ] Snapshot every screen (DOM + computed styles) into the manifest.
- [ ] Embed a `README.md` in each handoff pack summarising what changed.
- [ ] **Brief lock**: when a handoff is built, the brief markdowns are frozen into the pack so the pack is a standalone artifact.
- [ ] Include token maps and a component index per pack.
- [ ] Handoff diff tool — compare `v<n-1>` to `v<n>` and report added / changed / removed screens.

## v0.3 — Example breadth (next)

One example product isn't enough to prove the framework generalises. v0.3 adds a second product that exercises different layout families.

- [ ] Second example product — candidate: a B2B admin console or a mobile-first consumer app.
- [ ] Promotion of any shared patterns discovered during that work into `mockups/_system/`.
- [ ] Documentation: "How to start a new product" worked walkthrough.

## v0.4 — Multi-viewport (later)

- [ ] Per-screen viewport matrix in the inspector (mobile / tablet / desktop side-by-side).
- [ ] Screenshot matrix baked into the handoff pack.
- [ ] Viewport-aware linting: warn when a screen claims `responsive` but only has one state screenshotted.

## v0.5 — Sidecar hardening (later)

- [ ] Comprehensive path-safety tests against traversal, symlinks, and UNC paths on Windows.
- [ ] Signed AI-adapter requests so agents can be sandboxed per project.
- [ ] Rate limits and a kill-switch for runaway agent loops.
- [ ] Structured audit log of every sidecar write.

## v0.6 — Docs and examples (later)

- [ ] Video walkthrough (10 minutes, end-to-end).
- [ ] "Recipes" folder in `docs/` with worked examples: auth flow, wizard, empty-state pattern, permission-gated modal, etc.
- [ ] An "agent authoring" guide: how to write your own `.claude/` agent for a specific workflow.

## v1.0 — Stable surface (later)

v1.0 means: the registry schema is stable, the agent API is documented and stable, the handoff manifest format is versioned and stable, and breaking changes from this point forward require a new major version.

- [ ] `defineScreen` schema frozen (additive changes only within v1.x).
- [ ] Handoff manifest format frozen at `v2`.
- [ ] Agent API (command contracts, sidecar endpoints) frozen and documented.
- [ ] Deprecation policy published.

---

## Considering (no commitment)

- **Plugin system for custom inspector tabs.** Third-party panels that render against the registry.
- **Headless mode.** Run the sidecar + registry without the Vite UI — useful for CI.
- **Figma import.** Read a Figma file and propose a sitemap of ghost screens.
- **Storybook interop.** Treat individual states as Storybook stories for external tooling.
- **Screenshot regression testing.** Wire Playwright snapshots into CI to catch unintended visual changes between handoff versions.
- **Translations.** i18n-aware fixtures so a mockup can demo the same flow in multiple locales.

If any of these sound interesting, open a discussion — interest from users is the strongest signal for what gets promoted out of *considering*.

## Explicit non-goals

For clarity, these are *not* on the roadmap and will not be, absent a very compelling case:

- Support for runtime frameworks other than React.
- A bundler other than Vite.
- A backend beyond the existing sidecar.
- A hosted SaaS offering from the Miko organisation.
- A WYSIWYG visual editor. Mockup OS is deliberately code-first — the AI agents are the "visual editor".

See [CONTRIBUTING.md](CONTRIBUTING.md#what-is-out-of-scope-right-now) for the current scope boundary on PRs.
