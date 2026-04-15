<div align="center">

# Mockup OS

**Build the frontend properly — then hand it off with zero ambiguity.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Alpha](https://img.shields.io/badge/status-alpha-orange.svg)](ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

![Mockup OS demo](docs/assets/demo.gif)

[Quick start](#quick-start) · [What it is](#what-is-mockup-os) · [Output](#what-comes-out-of-mockup-os) · [Architecture](#architecture) · [Contributing](CONTRIBUTING.md)

</div>

---

## Building UI shouldn’t be this slow

Most teams don’t struggle with ideas.  
They struggle turning those ideas into something real.

You sketch it.  
You mock it up.  
You explain it.  
Then someone rebuilds it from scratch.

That cycle is slow, lossy, and unnecessary.

---

## What Mockup OS actually does

Mockup OS helps you build a **complete, working frontend experience** — without a backend — so you can:

- See the product as it will actually feel  
- Validate every screen, state, and flow  
- Iterate quickly with AI assistance  
- Lock everything down before development starts  

This is not about design.

This is about removing ambiguity before engineering begins.

---

## Important: What this is (and is not)

### ✅ What this IS

- A system for building **high-fidelity, working UI mockups**
- A way to define **every screen, state, and flow**
- A tool to **validate the frontend before backend work begins**
- A generator of **structured handoff packages for engineers**

### ❌ What this is NOT

- Not a full application builder  
- Not a backend system  
- Not something you deploy to production as-is  

Mockup OS does not replace engineering.

It prepares engineering.

---

## The shift

Instead of:

idea → design → redesign → dev → rework → ship

You get:

idea → working UI → validate → export → build → ship

---

## What is Mockup OS?

Mockup OS is a **code-first mockup system built on real React applications.**

Every mockup is:
- A real route  
- A real component  
- A real flow  

Everything behaves like a real product — but without backend dependencies.

AI operates within a **validated structure**, ensuring consistency across the entire system.

---

## What comes out of Mockup OS

Mockup OS produces a **versioned frontend specification bundle** that can be handed directly to a development team.

Each output includes:

- JSX screens (real routes)
- Shared components
- Layouts and UI patterns
- Themes and design tokens
- Feature definitions
- Fixture data
- Product brief
- Snapshot artifacts

This is not a mockup.

It’s a **clear, structured definition of the UI**.

---

## What engineering does next

Engineering teams take the output and:

- Connect it to backend systems  
- Implement persistence and business logic  
- Optimize for production  

There is no reinterpretation phase.

The UI is already defined.

---

## Where it fits

|                             | Static Mockups | AI Pages | **Mockup OS** |
| --------------------------- | -------------- | -------- | ------------- |
| Looks real                  | Sometimes      | Yes      | **Yes**       |
| Works like a product        | No             | Sometimes| **Yes**       |
| Covers full flows           | No             | No       | **Yes**       |
| Consistent across screens   | Hard           | No       | **Enforced**  |
| Ready for engineering       | No             | Partial  | **Yes**       |

---

## Key features

- Code-first mockup system  
- Real routing and navigation  
- Validated screen registry  
- AI-assisted generation and auditing  
- Fastify sidecar (safe file operations)  
- Live fixture editing  
- Versioned handoff packs  
- Ghost screens for missing flows  
- Strict isolation rules  

---

## Who this is for

- Engineers who want to eliminate UI ambiguity  
- Founders building products without design teams  
- Product managers validating ideas early  
- Teams that want faster, cleaner handoffs  

---

## This is NOT for

- Building full production applications  
- Replacing backend systems  
- Pixel-perfect design tooling  
- Non-React stacks (for now)  

---

## Quick start

```bash
git clone https://github.com/Miko-Earth/mockup-os.git
cd mockup-os
npm install
npm run dev:all
```

Open http://localhost:5173

---

## Example workflow

```
/new-screen "Transfer confirmation"
/audit-journeys
/generate-data accounts.wealthy
/handoff
```

---

## Architecture

```
Projects/<id>/
  mockups/
  data/
  docs/
  brief/
  artifacts/

src/mockup-os/
  app/
  framework/
  shell/

scripts/
  sidecar/
  validation/

.claude/
  agents/
  commands/
  skills/
```

---

## Core principles

1. Define the UI completely before backend work  
2. Remove ambiguity from handoff  
3. Generate systems, not screenshots  

---

## Contributing

See:
- CONTRIBUTING.md  
- GOVERNANCE.md  
- SECURITY.md  

---

## License

MIT License

---

<div align="center">

Built by Miko Earth

</div>
