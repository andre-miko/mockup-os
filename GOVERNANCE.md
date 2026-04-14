# Governance

This document describes how Mockup OS is governed: who makes decisions, how decisions are made, and how someone becomes a maintainer. It is deliberately lightweight — the project is young, and heavyweight governance at this stage would cost more than it protects.

## Ownership

Mockup OS is owned by the **[Miko](https://github.com/miko) organisation** on GitHub and released under the [MIT License](LICENSE). The copyright is held collectively by Miko and the project's contributors.

## Roles

### Users

Anyone who runs Mockup OS, reads the docs, files an issue, or asks a question. Users drive the project's direction through their reports and feedback. You don't need permission to be a user.

### Contributors

Anyone who has had a pull request merged — code, docs, tests, examples, or tooling. Contributors are credited in the git history and, for significant contributions, in release notes.

### Maintainers

A small group with commit access to the repository. Maintainers:

- review and merge pull requests;
- triage issues and discussions;
- cut releases;
- set and enforce the project's technical direction;
- respond to security reports (see [SECURITY.md](SECURITY.md));
- are listed in [`.github/CODEOWNERS`](.github/CODEOWNERS).

Maintainers are expected to act in the interest of the project and its users, not any employer or personal agenda.

### Project lead (BDFL-for-now)

While the project is young, the **project lead** holds a tiebreaker vote on contested decisions. The current project lead is the founding maintainer listed first in [`.github/CODEOWNERS`](.github/CODEOWNERS). This role is expected to dissolve into a simple maintainer-majority model once the maintainer group reaches three or more active members.

## Decision making

### The default: lazy consensus

Most decisions are made by lazy consensus on pull requests and issues:

- A maintainer proposes a change (PR, issue, or discussion).
- If no other maintainer objects within a reasonable window (typically 72 hours for non-urgent changes), the change is accepted.
- Any maintainer can request that a change wait for explicit approval by saying so in a comment.

Lazy consensus is fast, but it depends on maintainers watching the repository. Don't abuse it for controversial changes.

### Significant changes

For any of the following, open an issue or discussion *before* the PR and reach explicit agreement among at least two maintainers:

- Breaking changes to `defineScreen`, the registry schema, or the handoff manifest format.
- New top-level directories.
- Changes to the two non-negotiable rules (mockup isolation, sidecar-only writes) — see [README.md](README.md#the-two-contracts-that-hold-the-system-together).
- Changes to governance, licensing, or branding.
- Adoption of new runtime dependencies that aren't already transitive.

### Tiebreakers

If maintainers disagree and cannot reach consensus, the project lead decides. The decision is recorded in the relevant issue or discussion so it can be referenced later.

## Becoming a maintainer

Maintainers are added by invitation from the existing maintainer group. The informal criteria are:

- A sustained history of high-quality contributions.
- Good judgement in reviews — kind, specific, and focused on the project's goals.
- Demonstrated understanding of the two non-negotiable rules and the shell contract.
- Willingness to respond to issues and PRs in a reasonable timeframe.

We'd rather have a small, active maintainer group than a large, absent one. If you're interested, the path is simple: contribute, review other contributors' work, and help triage issues. An invitation will follow naturally.

## Stepping down

Maintainers who are no longer active are moved to an **emeritus** list after a quiet period of roughly six months. Emeritus status is a mark of appreciation, not a demotion — it reflects reality, and the door is always open to return.

## Releases

- **Versioning.** We follow [Semantic Versioning](https://semver.org/) starting from `v0.1.0`. The registry schema and the handoff manifest format are the two interfaces whose stability the version number reflects.
- **Cadence.** Minor releases ship whenever there's meaningful new functionality. Patch releases ship for bug fixes as needed. There is no fixed calendar.
- **Release notes.** Every tagged release has a corresponding entry in [CHANGELOG.md](CHANGELOG.md).
- **Who cuts releases.** Any maintainer can cut a release. The process is: bump `package.json`, update `CHANGELOG.md`, tag, push, draft a GitHub release.

## Code of conduct

This project expects contributors and maintainers to behave professionally and respectfully in all project forums — issues, pull requests, discussions, and any synchronous channels we may run. Personal attacks, harassment, and discriminatory language are not acceptable and will result in removal from the project's spaces.

Maintainers are responsible for enforcing these expectations. Reports of unacceptable behaviour should be sent privately to the maintainers via the same channel described in [SECURITY.md](SECURITY.md#how-to-report).

## Changing this document

Governance changes follow the "significant changes" rules above: open a discussion first, reach explicit agreement among at least two maintainers, then PR. The project lead has a tiebreaker vote while the lead role exists.
