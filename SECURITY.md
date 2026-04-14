# Security policy

## Reporting a vulnerability

**Please do not open a public issue for security-sensitive reports.**

If you believe you've found a security vulnerability in Mockup OS — in the runtime, the Fastify sidecar, the AI adapter, or any of the supporting scripts — please report it privately so we can fix it before it's disclosed broadly.

### How to report

Use GitHub's private vulnerability reporting for this repository:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Fill in the form with as much detail as you can.

GitHub's private vulnerability reporting routes the report directly to the maintainers without exposing it publicly. Full instructions: <https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability>.

If private reporting is not available for any reason, contact the maintainers listed in [GOVERNANCE.md](GOVERNANCE.md) via a private channel (not a public issue, not a public discussion, not a tweet).

### What to include

A useful report typically has:

- A clear description of the vulnerability and its impact.
- The affected version (commit hash, tag, or branch).
- Step-by-step reproduction instructions — ideally a minimal repro.
- A proof-of-concept if you have one, but please keep it defensive.
- Any suggested remediation, if you have an idea.
- Your preferred credit line if you'd like to be named in the fix.

### What to expect

- **Acknowledgement within 72 hours.** A maintainer will confirm receipt.
- **Triage within 7 days.** We'll either accept, reject (with reasoning), or ask for more information.
- **Fix timeline.** Critical vulnerabilities are prioritised. Less urgent issues are worked into the regular release cadence.
- **Coordinated disclosure.** We will agree on a disclosure date with you before anything is published. You will be credited unless you ask not to be.

## Scope

In scope:

- The Mockup OS runtime (`src/mockup-os/`).
- The Fastify sidecar (`scripts/sidecar/`) — especially path-traversal, SSRF, and prompt-injection paths.
- The AI adapter (`scripts/sidecar/ai/`) — key handling, request routing, output handling.
- The repo-root tooling under `scripts/` — `validate-registry.ts`, `build-docs.ts`, `build-handoff.ts`.
- `.claude/` agents and commands shipped in this repository.

Out of scope:

- Vulnerabilities in third-party dependencies — please report those upstream. We will upgrade promptly once a fix lands.
- Vulnerabilities that require the attacker to already have shell access to the machine running the sidecar.
- Issues in example products under `/Projects/example-*` that are clearly intentional demo artifacts.
- Social-engineering attacks that don't involve the software.

## Safe harbour

We support good-faith security research. If you:

- make a good-faith effort to avoid privacy violations, data destruction, and service interruption;
- only test against your own local instance of Mockup OS or an instance you have explicit permission to test;
- give us reasonable time to fix issues before public disclosure;

then we will not pursue or support any legal action against you, and we will work with you to resolve the issue quickly.

Thank you for helping keep Mockup OS and its users safe.
