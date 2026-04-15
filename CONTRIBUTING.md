# Contributing to Mockup OS

Thanks for considering a contribution. Mockup OS is young and under active development, so a little coordination goes a long way. This document tells you how to set up, what's in scope, and what a mergeable PR looks like.

## Conduct

We expect contributors and maintainers to behave professionally and respectfully in all project forums — issues, pull requests, discussions, and any synchronous channels we may run. Personal attacks, harassment, and discriminatory language are not acceptable and will result in removal from the project's spaces. See [GOVERNANCE.md](GOVERNANCE.md#code-of-conduct) for the full policy and reporting channel.

## Ways to contribute

- **Bug reports.** Open an issue with repro steps, expected vs. actual, and the output of `npm run validate`.
- **Feature proposals.** Open an issue *before* you write code. We'd rather discuss scope than reject a PR.
- **Documentation.** Typos, clarifications, worked examples, and new prompt templates are all welcome.
- **Example products.** New products under `/Projects/<id>/` that exercise a different layout family are especially useful.
- **Agent recipes.** New `.claude/agents/` and `.claude/commands/` that encode a repeatable workflow.
- **Tests.** Unit tests in `src/mockup-os/tests/` and Playwright smoke tests are always appreciated.

## What is *out* of scope right now

To keep the surface area manageable before v1.0:

- New runtime frameworks (Vue, Svelte, Solid, etc). The core is React-only.
- New bundlers. We are on Vite and will stay on Vite.
- Backend integrations beyond the sidecar. Mockup OS is a *mockup* system by design.
- Design tokens that aren't expressible through `framework/tokens.ts`.
- Features that require the shell to leak into presentation mode. See the shell contract in [README.md](README.md#the-two-contracts-that-hold-the-system-together).

If you want one of these, please open a discussion first.

## Development setup

Prerequisites: Node 20+, npm 10+, and a recent Claude Code or Anthropic API key *only* if you want the AI sidecar live (the rest of the system runs without it).

```sh
git clone https://github.com/miko/mockup-os.git
cd mockup-os/src/mockup-os
npm install
npm run dev:all
```

Verify your setup:

```sh
npm run typecheck
npm run lint
npm run test
npm run validate
```

All four must pass before you open a PR.

## Project conventions you must respect

Read these files before mutating code. They are short and load-bearing:

- [docs/architecture.md](docs/architecture.md) — layer contracts.
- [docs/authoring.md](docs/authoring.md) — how to add a screen.
- [docs/conventions.md](docs/conventions.md) — naming and style.
- [CLAUDE.md](CLAUDE.md) — agent dispatching and the shape of the `.claude/` directory.
- Skills under `.claude/skills/`:
  - `isolation-rules.md` — which folder may import from which.
  - `design-tokens.md` — colours and spacing go through `framework/tokens.ts`.
  - `appframe-patterns.md` — the standard screen shape inside a product layout.
  - `permissions-authoring.md` — declare and gate permissions.
  - `fixture-authoring.md` — where fixtures live and how they're typed.

Two rules are non-negotiable:

1. **Mockups never import from `@shell` or `@framework/store`.** Use `@framework/hooks` and `@framework/tokens` only.
2. **The frontend never touches `node:fs`.** All file writes go through the sidecar (`/api/projects/...`).

Breaking either rule breaks presentation mode or the AI safety story, and the PR will be asked to change.

## Pull request checklist

Before opening a PR, please confirm:

- [ ] The change has a clear purpose and is scoped to that purpose.
- [ ] An issue exists for anything larger than a typo. Link it in the PR description.
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run validate` passes.
- [ ] If you added a screen, you ran `/new-screen` or followed [docs/authoring.md](docs/authoring.md).
- [ ] If you added a component, it is in the correct folder (`_system/` vs product-scoped).
- [ ] If you added a permission, it is declared in `project.config.ts` and gated per call-site.
- [ ] If you added a fixture, JSON is in `data/`, bound in `mockups/fixtures.ts`, typed with the schema.
- [ ] The PR description explains *why*, not just *what*. The diff is the *what*.
- [ ] You have updated [CHANGELOG.md](CHANGELOG.md) under `## [Unreleased]` for user-facing changes.

## Commit messages

We prefer [Conventional Commits](https://www.conventionalcommits.org/), loosely applied:

```text
feat(example-project): add TransferScheduled screen
fix(sidecar/fs): reject paths that escape the project root
docs(contributing): clarify PR checklist
chore(deps): bump vite to 7.1
refactor(framework/registry): split validator into pure module
```

Types we actually use: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`, `build`, `ci`.

## Branching

- Branch off `main`. Use `feat/<short-name>`, `fix/<short-name>`, or `docs/<short-name>`.
- Keep branches short-lived. Rebase on `main` before you open the PR if it's been a few days.
- Squash-merge is the default. One PR → one commit in history.

## Reviewing and landing

- All PRs need at least one approving review from a maintainer (see [CODEOWNERS](.github/CODEOWNERS) and [GOVERNANCE.md](GOVERNANCE.md)).
- CI must be green. No exceptions.
- If you are a maintainer reviewing a PR from a contributor, be generous with your time. First-time contributors especially benefit from a specific, kind review.

## Releasing

Only maintainers publish releases. The process is documented in [GOVERNANCE.md](GOVERNANCE.md#releases). Contributors don't need to think about versioning — we'll handle it.

## Questions?

Open a [discussion](https://github.com/miko/mockup-os/discussions) or drop a note in an existing issue. Please don't email maintainers directly for project questions — keep the conversation in the open so the next person benefits.

Thanks for helping build Mockup OS.
