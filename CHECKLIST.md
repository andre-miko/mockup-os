# Manual verification checklist

One-time sweep to confirm every feature Mockup OS claims actually works, before the first tagged release. Tick a box only when you've seen the behaviour with your own eyes.


## 3. Left panel — all five tabs

Open the left panel. The actual tabs are `sitemap, journeys, patterns, data, brief` (per `framework/store.ts`).

### 3.1 Sitemap tab

- [ ] Renders the section structure from `project.config.ts` (Overview, Accounts, Transfer, Settings).
- [ ] Shows ghost entries from `docs/sitemap.md` alongside implemented screens.
- [ ] Clicking a screen entry navigates the viewport to that route.
- [ ] Known-gap / proposed markers (✨ vs ✅) are visually distinct.

### 3.2 Journeys tab

- [ ] Lists both journeys: `finch.daily-check` and `finch.send-money`.
- [ ] Each journey expands to show its ordered screen steps.
- [ ] Clicking a step navigates the viewport to that screen.
- [ ] Orphan / missing-screen warnings surface here (if any are intentionally introduced for testing, see §1 negative check idea).

### 3.3 Patterns tab

- [ ] Lists cross-project components (from `mockups/_system/`).
- [ ] Shows where each is used across screens.

### 3.4 Data tab

- [ ] Lists every fixture (keys like `finch.accounts.default`, `finch.transactions.recent`, etc.).
- [ ] Selecting a fixture shows its JSON payload.
- [ ] Editing a fixture value and saving writes through the sidecar → the JSON file on disk is updated (`Projects/example-project/data/*.json`).
- [ ] The running mockup reflects the new value (hot reload or manual refresh).

### 3.5 Brief tab

- [ ] Lists each `brief/*.md` section (scope, audience, constraints).
- [ ] Opens the section in a read view.
- [ ] Edit → save writes through the sidecar → `Projects/example-project/brief/*.md` is updated on disk.
- [ ] The "Expand with AI" button invokes the `brief-expander` agent and updates the section. *(Skip if no Claude/Anthropic credentials configured — see §7.)*

---

## 4. Right panel inspector

Select any screen in the viewport. The right panel should populate.

- [ ] **States panel** — lists all declared states for the screen, lets you switch active state, and the viewport updates.
- [ ] **Data panel** — shows fixtures bound to this screen; each resolves.
- [ ] **Permissions panel** — lists permissions declared for the screen (from `project.config.ts`), with per-call-site modes visible.
- [ ] **Journey membership** — lists journeys this screen participates in; clicking one jumps to the Journeys tab with that journey focused.
- [ ] **Status dropdown** — lets you change the screen's status (draft / in-review / approved) and persists via the sidecar.
- [ ] Known gaps are surfaced somewhere on the right panel (verify the chosen location — add a TODO here if you can't find them).

---

## 5. Sidecar (file-writing pipeline)

Sidecar runs on `:5179`. Hit it via the UI actions above, or directly via curl to confirm.

- [ ] `curl http://localhost:5179/api/health` returns 200.
- [ ] Brief edit via the UI lands on disk at `Projects/example-project/brief/*.md`.
- [ ] Fixture edit via the UI lands on disk at `Projects/example-project/data/*.json`.
- [ ] Sitemap edit (if exposed through UI) lands on disk at `Projects/example-project/docs/sitemap.md`.
- [ ] Screen rename / move via `/new-screen` (see §7) lands on disk at the expected TSX path and updates `mockups/index.ts`.
- [ ] **Path-safety check** *(automated by preflight `sidecar` group)* — attempts a crafted request that tries to escape the project root. Sidecar must answer 4xx. Run manually: start the sidecar, then `npm run preflight -- --only sidecar`.
- [ ] **No frontend fs** *(automated by preflight `isolation` group)* — confirmed by preflight. Equivalent grep: `git grep -n "node:fs\|from 'fs'" -- src/mockup-os/ | grep -v tests/`.

---

## 6. AI adapter (three modes)

Adapter lives in `scripts/sidecar/ai/`. Mode is selectable; confirm each works.

- [ ] **`none` mode** — any AI call returns a deterministic stub. No network traffic.
- [ ] **`claude-code` mode** — routes through a local Claude Code CLI subprocess. Round-trip a prompt; confirm output arrives.
- [ ] **`anthropic` mode** — routes through `@anthropic-ai/sdk` with an `ANTHROPIC_API_KEY`. Round-trip a prompt; confirm output arrives.
- [ ] Switching modes without restart (if supported) — or document that a restart is required.
- [ ] Missing-credentials path produces a useful error, not a silent hang.

---

## 7. Agents & slash commands

Invoke each one against `example-project` and confirm the reported output.

### Agents (direct invocation or via their slash command)

- [ ] `mockup-generator` — creates a TSX, registers it, runs validate. File appears on disk.
- [ ] `journey-auditor` — emits a report; no file writes.
- [ ] `sitemap-planner` — rewrites `docs/sitemap.md` with proposed ghosts.
- [ ] `docs-writer` — writes into `docs/features|components|styles|layouts/`.
- [ ] `permission-analyst` — writes `docs/permissions/<id>.md` and proposes modes.
- [ ] `data-generator` — writes a fixture JSON to `data/<fid>.json`. **No prose output**.
- [ ] `component-curator` — reports duplicated patterns; optionally lifts to `_system`.
- [ ] `brief-expander` — rewrites one brief section in place.
- [ ] `handoff-reviewer` — pre-flight report; no file writes unless issues fixed.

### Slash commands (wrappers around the agents)

- [ ] `/new-screen example-project "<intent>"` — produces a screen end-to-end.
- [ ] `/audit-journeys example-project` — audit report.
- [ ] `/audit-sitemap example-project` — sitemap refresh.
- [ ] `/generate-data <fixtureId> "<description>"` — writes fixture JSON.
- [ ] `/expand-brief <section>` — expands one brief section.
- [ ] `/handoff example-project` — runs the pre-flight review + build.
- [ ] `/new-journey example-project "<intent>"` — scaffolds `docs/journeys/<id>.md`.

---

## 8. Handoff pipeline

Run in this order, from `src/mockup-os/`.

- [ ] `npm run docs:build` — generates `Projects/example-project/artifacts/docs/` with per-screen markdown. Files exist and look reasonable.
- [ ] `npm run snapshot -- --project example-project` — writes PNGs to `Projects/example-project/artifacts/snapshots/`. Open a couple — builder chrome is absent (presentation mode was toggled via `P`).
- [ ] `npm run handoff -- --project example-project` — produces `Projects/example-project/artifacts/handoff/v<n>/` containing:
  - [ ] `manifest.json` — lists every screen with metadata.
  - [ ] `README.md` — human-readable summary, TOC, embedded screenshots.
  - [ ] `brief.md` — concatenated + frozen copy of `brief/*.md` (brief lock).
  - [ ] `data/` — full copy of every fixture JSON.
  - [ ] `docs/` — selected authored markdown (sitemap, journeys, permissions).
  - [ ] `snapshots/` — PNGs copied in (if `npm run snapshot` ran first).
- [ ] **Idempotency**: rerun `npm run handoff` with the same inputs → same output version or a clean bump (document the actual behaviour here).
- [ ] **Skip-validation escape hatch** works (`--skip-validation`) and is noisy about the risk.

---

## 9. Isolation contracts *(automated by preflight)*

All three are checked by `npm run preflight` under the `isolation` group.

- [ ] **No mockup imports `@shell`** — equivalent: `git grep -n "@shell" -- Projects/` returns nothing.
- [ ] **No mockup imports `@framework/store`** — equivalent: `git grep -n "@framework/store" -- Projects/` returns nothing.
- [ ] **Only sidecar touches `node:fs`** — see §5.

---

## 10. End-to-end smoke

- [ ] `npm run e2e` — Playwright smoke suite green.
- [ ] Manual walkthrough of the send-money journey: open `/finch`, follow `finch.transfer.initiate` → `review` → `confirmed`. No broken routes, no missing fixtures, no console errors.

---

## 11. Documentation sanity

Spot-check that the narrative docs still match reality.

- [ ] [README.md](README.md) quick start works as written for a fresh clone (document any deviation).
- [ ] [CLAUDE.md](CLAUDE.md) repo map matches the actual folder structure.
- [ ] [docs/architecture.md](docs/architecture.md) layer contracts still hold.
- [ ] [docs/authoring.md](docs/authoring.md) paths and imports match the example project.
- [ ] [docs/conventions.md](docs/conventions.md) naming rules are still followed by the example project.

---

## 12. Release gate

Only tick these when every section above is green.

- [ ] Screenshot and short recording captured for the README and the first GitHub release.
- [ ] [CHANGELOG.md](CHANGELOG.md) `[Unreleased]` → `[0.1.0]` with today's date.
- [ ] Version bumped in `src/mockup-os/package.json`.
- [ ] Tag `v0.1.0` pushed and a GitHub release drafted.

---

## Using this checklist

- Work top-down. Earlier sections surface issues that would otherwise noise up later ones.
- When something fails, **don't fix and tick in one move**. Record what broke (a line here or an issue), then fix, then rerun the step, then tick.
- Anything marked "document the behaviour" / "document the exact curl" is an invitation to tighten this file on the next pass — this document gets more useful the more you run it.
