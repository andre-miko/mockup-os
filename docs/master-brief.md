# AI Mockup Kit — Product Brief, System Plan, and Master Agent Prompt

## What this is

This document defines a public open-source **AI Mockup Kit**: a React-based system built specifically so AI agents can generate, refine, validate, and document high-fidelity product mockups as real JSX/TSX screens.

This is **not** a normal prototype app.

It is a **mockup operating system** for designers, product thinkers, engineers, and AI agents.

Its job is to let a human or agent rapidly build mockups that:

- look as close as possible to the final application
- behave coherently across routes and flows
- can hide all builder chrome so the mockup appears exactly like the real product
- stay internally consistent across pages, components, tokens, and layouts
- produce a clean, versioned UI handoff pack for the rest of the team

---

## The problem this solves

Most AI-generated mockup projects fail in predictable ways:

1. Pages are generated in isolation, so the system has no cohesion.
2. Navigation is fake or incomplete.
3. Shared layout and component rules drift between screens.
4. Builder controls contaminate the real viewport and distort the final look.
5. One improvement breaks another screen.
6. Nobody gets a clean handoff pack with documented styles, routes, components, states, and journeys.
7. The result looks good in screenshots but is not reliable as a living UI artifact.

This project must solve those problems by design.

---

## Product vision

Build a React application whose primary purpose is to host, organize, render, validate, and document high-fidelity UI mockups.

The system must support two realities at once:

### Reality 1: Builder mode
A rapid iteration workspace where humans and AI agents can:
- generate and edit screens
- compare variants
- inspect routes, journeys, tokens, and layouts
- discover missing pages and broken flows
- manage versions
- document what exists

### Reality 2: Presentation mode
A zero-noise full-fidelity rendering mode where:
- the shell disappears completely
- the mockup fills the viewport exactly as the real product would
- no sidebars, selectors, overlays, or scaffolding affect layout
- the team sees the mockup as if it were the actual shipped app

That dual-mode design is one of the core differentiators of this system.

---

## Strategic product position

This project should be positioned publicly as:

> An open-source React framework for AI-assisted generation, validation, and handoff of high-fidelity product mockups.

It should appeal to:
- product designers
- UX engineers
- founders
- frontend teams
- AI-assisted product builders
- agencies
- internal innovation teams

---

## Non-goals

This project is not intended to be:

- a low-code page builder
- a generic design tool replacement
- a visual canvas editor like Figma
- a component library for production apps
- a drag-and-drop builder
- a backend-heavy application platform

The focus is **mockup generation, coherence, iteration, and handoff**.

---

## Core design principles

### 1. Mockups are first-class code
Every mockup is a real TSX page or route, not a screenshot or blob.

### 2. Builder chrome must never contaminate the viewport
The shell must be removable without any residual spacing, wrapper effects, or layout shift.

### 3. Shared systems over isolated screens
Routes, tokens, navigation, fixtures, layouts, and components must be governed centrally.

### 4. AI must work within contracts
Agents should not be allowed to generate arbitrary chaos. They should work inside a defined structure with metadata, conventions, and validation.

### 5. Every screen needs context
A screen is not complete unless it includes metadata: purpose, route, journey membership, required states, dependencies, and component usage.

### 6. Handoff is a product, not an afterthought
The system must be able to generate a clear, versioned UI pack.

### 7. Build for tomorrow
This should support current mockup workflows but anticipate agentic workflows where multiple agents analyze, generate, validate, and package UI systems.

---

## The right technical direction

For this project, the best first implementation is:

- **Vite**
- **React**
- **TypeScript**
- **React Router**
- **Tailwind CSS**
- **Zustand** for lightweight builder state
- **shadcn/ui** selectively for shell controls only
- **Lucide icons**
- **Framer Motion** only where useful
- **MDX or Markdown-based docs generation hooks**
- **Vitest**
- **Playwright** for validation and screenshot checks
- **ESLint + Prettier**
- optional **Storybook later**, but not as the primary runtime

### Why this stack
It gives:
- very fast iteration
- great agent compatibility
- plain-file generation
- strong route organization
- easy preview
- easy public GitHub setup
- low friction for contributors
- realistic modern UI development

---

## High-level architecture

The system should be separated into two worlds:

### A. The framework world
This is the permanent application infrastructure:
- app shell
- route engine
- registry
- builder tools
- validation tools
- documentation generation
- fixtures
- tokens
- metadata contracts
- export and packaging logic

### B. The mockup world
This is where generated mockups live:
- screens
- feature layouts
- flows
- page-specific components
- example datasets
- variant states
- handoff notes

This separation is critical.

The framework should remain stable while mockups evolve rapidly.

---

## Recommended repository structure

```text
ai-mockup-kit/
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ providers/
│  │  ├─ router/
│  │  ├─ shell/
│  │  ├─ modes/
│  │  └─ guards/
│  │
│  ├─ framework/
│  │  ├─ registry/
│  │  ├─ metadata/
│  │  ├─ fixtures/
│  │  ├─ tokens/
│  │  ├─ validation/
│  │  ├─ journeys/
│  │  ├─ export/
│  │  ├─ docs/
│  │  ├─ state/
│  │  ├─ commands/
│  │  └─ utils/
│  │
│  ├─ shell/
│  │  ├─ components/
│  │  ├─ panels/
│  │  ├─ overlays/
│  │  ├─ command-bar/
│  │  └─ store/
│  │
│  ├─ mockups/
│  │  ├─ _system/
│  │  │  ├─ layouts/
│  │  │  ├─ components/
│  │  │  ├─ patterns/
│  │  │  └─ page-templates/
│  │  │
│  │  ├─ product-name/
│  │  │  ├─ routes/
│  │  │  ├─ flows/
│  │  │  ├─ components/
│  │  │  ├─ fixtures/
│  │  │  ├─ variants/
│  │  │  ├─ docs/
│  │  │  └─ metadata/
│  │
│  ├─ docs/
│  │  ├─ generated/
│  │  └─ authored/
│  │
│  ├─ tests/
│  │  ├─ unit/
│  │  ├─ integration/
│  │  └─ e2e/
│  │
│  ├─ main.tsx
│  └─ index.css
│
├─ scripts/
│  ├─ generate-doc-pack/
│  ├─ validate-routes/
│  ├─ validate-journeys/
│  ├─ export-ui-pack/
│  └─ snapshot-mockups/
│
├─ prompts/
│  ├─ master/
│  ├─ generators/
│  ├─ validators/
│  └─ handoff/
│
├─ examples/
├─ .github/
├─ README.md
└─ CONTRIBUTING.md
```

---

## Core product features

## 1. Full shell with true zero-impact hide mode

The shell must include:
- mockup selector
- page list
- route tree
- journey viewer
- component inventory
- screen metadata panel
- state/fixture selector
- viewport controls
- theme toggles
- annotation toggle
- export tools
- validation status
- AI prompt helpers

But the shell must also support:
- full collapse
- fullscreen presentation mode
- clean browser-like mode
- screenshot mode
- embedded review mode

### Critical rule
When shell is hidden, it must leave **zero** layout trace:
- no padding
- no reserved width
- no top bar gap
- no wrapper border
- no scaling
- no clipping side effects

This is a hard requirement.

---

## 2. Registry-driven mockup system

Every mockup must be registered centrally.

Each screen should declare metadata such as:
- id
- title
- route
- parent flow
- journey membership
- description
- layout type
- viewport assumptions
- required fixtures
- required states
- components used
- status
- owner
- version
- last updated
- related routes
- known gaps
- notes

This metadata allows the system to:
- organize screens
- detect missing flow steps
- show relationships
- validate route integrity
- generate documentation

### Example shape

```ts
export interface MockupDefinition {
  id: string;
  title: string;
  route: string;
  flowId?: string;
  journeyIds?: string[];
  description: string;
  layout: "app" | "auth" | "settings" | "marketing" | "modal-only" | "custom";
  viewport: "desktop" | "tablet" | "mobile" | "responsive";
  fixtures?: string[];
  states?: string[];
  components?: string[];
  status: "draft" | "review" | "approved" | "archived";
  version: string;
  relatedRoutes?: string[];
  knownGaps?: string[];
}
```

---

## 3. Route-aware generation and navigation integrity

One of the biggest failures in AI-generated mockups is fake navigation.

This project must enforce:
- real React Router routes
- link validation
- route inventory
- orphaned page detection
- dead-end journey detection
- duplicate intent detection
- missing next-step detection

### The system should answer questions like:
- What screens exist?
- Which screens are not reachable?
- Which journeys are incomplete?
- Which links point nowhere?
- Which pages overlap in purpose?
- Which major product paths are missing?

This is where the product becomes far more powerful than a folder of pretty pages.

---

## 4. Journey map support

Mockups must be understandable not only as screens, but as user journeys.

Support:
- flows
- entry points
- alternate branches
- success states
- empty states
- failure states
- permission states
- mobile variants
- review/approval states

The builder should have a journey viewer that can show:
- ordered route path
- missing steps
- branch conflicts
- repeated screens doing the same job
- transitions that feel wrong

---

## 5. Fixture and state system

Mockups need realistic states.

The project should support:
- fixture packs
- state presets
- empty/loading/error/success variants
- role-based view variants
- feature-flag variants
- realistic seeded data

This must be easy for agents to use.

### Example
A page should be able to say:
- show dashboard with empty data
- show dashboard with mature data
- show dashboard with admin role
- show dashboard with validation errors
- show dashboard with right sidebar open
- show dashboard on mobile

That allows the system to reveal missing UI work early.

---

## 6. Design tokens and theme discipline

Mockups must not drift visually.

Centralize:
- colors
- type scale
- spacing
- radii
- shadows
- surface styles
- motion rules
- layout widths
- z-index rules
- breakpoint rules

The agent must build inside those tokens rather than inventing styling page by page.

---

## 7. Shared mockup component library

There should be a clear distinction between:

### framework shell components
These support the tool itself.

### mockup system components
These support generated product UI, for example:
- top nav
- app sidebar
- data table
- filter bar
- metric cards
- forms
- tabs
- command bars
- drawers
- toasts
- timelines
- activity feeds
- detail panels
- settings panels

Agents should prefer reusing and extending these instead of rebuilding from scratch.

---

## 8. Pixel-perfect inspection helpers

To make this genuinely useful, include:
- viewport presets
- zoom controls
- background grid toggle
- spacing inspection overlay
- token display
- outline/debug mode
- contrast checks
- screenshot capture
- side-by-side comparison
- before/after compare
- variant compare

These tools should help during iteration but remain completely removable in presentation mode.

---

## 9. Documentation generation as a first-class feature

The system should generate a clean UI handoff pack containing:
- route inventory
- screen catalog
- journey map summary
- component inventory
- layout descriptions
- state matrix
- fixture summary
- token summary
- interaction notes
- unresolved gaps
- version notes
- screenshot references
- change log

This output should be versioned and exportable.

---

## 10. Versioned UI pack releases

The system should support releases like:
- `v0.1.0` initial concept system
- `v0.2.0` dashboard flow expansion
- `v0.3.0` approval workflow refinement

Each release should include:
- changed routes
- changed components
- new screens
- removed screens
- token changes
- known issues
- screenshots
- handoff documentation

This makes the mockup kit suitable for real team workflows.

---

## Advanced forward-thinking features worth adding

These are not all required on day one, but they are strategically correct.

## A. Screen contract files
Each page has an adjacent metadata file that defines:
- purpose
- route
- states
- dependencies
- links
- layout type
- acceptance notes

This gives agents structure.

## B. Route graph visualizer
A simple graph showing route relationships and unreachable pages.

## C. Journey gap auditor
A tool that flags missing steps in common journeys.

## D. Duplicate intent detector
Helps identify when two pages do the same thing.

## E. Component usage map
Shows which pages use which shared components.

## F. Design drift detector
Flags page-level style divergence from tokens.

## G. Snapshot approval workflow
Supports “candidate vs approved” comparisons.

## H. Prompt recipes inside the app
Built-in prompt helpers for:
- create screen
- refine layout
- expand flow
- document page
- compare variants
- identify missing paths

## I. Annotated review mode
Allows the mockup to be displayed with optional labeled callouts for product reviews.

## J. Handoff export pack
Generates a versioned folder with docs, metadata, route map, and screenshots.

---

## What the MVP should include

The MVP should be disciplined.

It should include:

1. Stable app shell
2. True hideable presentation mode
3. Route registry
4. Mockup metadata contract
5. Sample mockup project
6. Fixture/state switching
7. Journey definitions
8. Validation scripts for route integrity
9. Generated UI documentation pack
10. Exportable versioned handoff output

That is enough to create a powerful first release.

---

## What should wait until later

Do not overload V1 with:
- drag-and-drop visual editing
- multi-user collaboration
- cloud sync
- database persistence
- complicated auth
- AI API integration inside the app itself
- plugin marketplace

These can come later. The first goal is an elite local-first open-source workflow.

---

## The most important system rules

These should be treated as non-negotiable.

### Rule 1
Framework code and generated mockup code must be separated clearly.

### Rule 2
The shell must never affect presentation mode layout.

### Rule 3
Every screen must be route-backed and metadata-backed.

### Rule 4
Agents must reuse shared layouts, components, and tokens unless explicitly justified.

### Rule 5
Navigation links should be real and validated.

### Rule 6
Every major screen should support multiple realistic states.

### Rule 7
Documentation must be generated from source structure wherever possible, not maintained manually only.

### Rule 8
The system should make missing screens and broken journeys visible.

---

## Which agent should you use next?

Use **Claude Code first** for this phase.

### Why Claude Code is the correct next agent
This next step is greenfield system scaffolding plus long-form structural reasoning. Claude Code is well-suited to:
- generating many files coherently from one large spec
- creating repo structure
- writing boilerplate cleanly
- building initial shell, registry, contracts, and docs
- handling large context instructions

### Then use Codex in VS Code after the repo exists
Once the base repo exists, switch to Codex for:
- precise implementation
- local refactors
- fixing breakages
- improving type safety
- tightening file-by-file execution
- smaller iterative work

### Correct order
1. ChatGPT: strategy and system design
2. Claude Code: generate the initial scaffold and system foundation
3. Codex: refine, fix, extend, and productionize inside the repo
4. Claude Code: generate docs and release artifacts as needed
5. ChatGPT: review architecture and identify next-level improvements

---

## How to work with agents without losing cohesion

Do not ask agents vague things like:
- build a dashboard
- add a page
- make this prettier

Instead ask them to work from system contracts.

Every request should specify:
- route
- purpose
- journey
- layout family
- states
- fixtures
- required reused components
- interaction expectations
- documentation update requirements
- validation expectations

That is how you prevent drift.

---

## Master prompt for the next agent

Use the following with **Claude Code**.

---

# MASTER PROMPT — Build the AI Mockup Kit

You are a senior UX engineer, senior frontend architect, and elite open-source framework designer.

Your task is to design and scaffold a production-quality open-source React project called **AI Mockup Kit**.

This is not a normal app and not a toy prototype.

It is a React-based framework whose explicit purpose is to let humans and AI agents generate, refine, validate, present, and document high-fidelity product mockups as real JSX/TSX routes.

The project must be structured so that generated mockups remain cohesive across pages, routes, flows, layouts, and components.

## Core objective

Build a local-first React application that provides:

1. A stable application shell for managing mockups
2. A content area where mockups render as real app screens
3. A shell that can be hidden completely so the mockup appears exactly like the final real product, with zero layout residue
4. A central registry for screens, routes, journeys, metadata, and fixtures
5. Strong separation between framework code and generated mockup code
6. Tooling to detect route gaps, broken links, missing journeys, and inconsistent screens
7. Generated documentation and versioned UI handoff pack output

## Required stack

Use:
- Vite
- React
- TypeScript
- React Router
- Tailwind CSS
- Zustand
- ESLint
- Prettier
- Vitest
- Playwright

Prefer simple, maintainable patterns.
Do not introduce unnecessary complexity.
Keep the project highly contributor-friendly and GitHub-ready.

## Product rules

These rules are mandatory.

### 1. Framework and mockups must be separated
The framework that powers the builder must live separately from the generated mockup screens and assets.

### 2. Hidden shell must leave zero layout impact
When the shell is hidden, the rendered mockup must look exactly like the final application would. No padding, no extra wrappers, no reserved space, no toolbar gaps.

### 3. Every mockup must be route-backed
Each screen must be accessible through real React Router routes.

### 4. Every mockup must be metadata-backed
Each screen must declare structured metadata such as:
- id
- title
- route
- description
- layout family
- viewport intent
- journey membership
- available states
- fixture references
- components used
- status
- version
- related screens
- known gaps

### 5. Shared systems must prevent drift
Create central support for:
- design tokens
- reusable mockup components
- route registry
- journey definitions
- fixture packs
- validation helpers
- docs generation

### 6. The system must support real iteration
Provide a shell that can expose:
- route list
- mockup selector
- metadata panel
- journey viewer
- state selector
- viewport controls
- validation status
- export actions

But this shell must also be fully removable.

### 7. The system must produce handoff outputs
Design the project so documentation and release artifacts can be generated into a clean, versioned UI pack.

## What to build

Design the repository and scaffold an initial working implementation that includes:

### A. App shell
Build a clean shell with:
- left navigation or panel system
- top actions or utility area
- main content viewport
- shell visibility toggle
- presentation mode toggle
- viewport size controls
- screen metadata display
- state/fixture selection controls

### B. Route registry
Create a central registry system for all mockup pages.

### C. Metadata contract
Define TypeScript types and conventions for screen definitions, journey definitions, fixture definitions, and component references.

### D. Mockup separation
Create a dedicated mockups area where product mockups live independently from framework code.

### E. Example mockup set
Provide one realistic example mockup flow with multiple related pages and linked navigation so the system demonstrates cohesion.

### F. Validation utilities
Add initial utilities or scripts that can detect:
- broken route references
- orphaned pages
- missing journey steps
- duplicate route ids or screen ids

### G. Documentation foundation
Set up generated docs output structure and authoring conventions.

## Recommended repository structure

Use this structure as the starting intent, refining it only if there is a clearly better implementation:

```text
src/
  app/
  framework/
  shell/
  mockups/
  docs/
  tests/
scripts/
prompts/
examples/
```

Inside `src/mockups`, include a `_system` area for shared mockup-side patterns and a sample product area for example routes, components, fixtures, and metadata.

## UX expectations

The UI must feel modern, clean, and serious.
The builder chrome should support productivity but not dominate the experience.
The presentation mode should feel like a real product preview, not a design tool.

## Implementation expectations

- Use clean file naming and foldering
- Keep components small and composable
- Use strong type definitions
- Avoid magic strings where practical
- Provide sensible comments where they add value
- Do not overengineer
- Do not leave the system as vague placeholders
- Create enough working code that a developer can run the project and immediately understand the architecture

## Deliverables

Produce:

1. The full repo scaffold
2. Working shell and content rendering structure
3. Metadata and registry contracts
4. Example pages and journeys
5. Validation utilities
6. Documentation starter files
7. A high-quality README explaining the purpose, architecture, and workflow

## Important design intent

This project exists because current AI-generated mockups tend to be visually impressive but structurally unreliable.

Your implementation must be intentionally designed to reduce:
- page inconsistency
- broken navigation
- missing flows
- style drift
- undocumented states
- poor handoff quality

## After scaffolding, also provide

At the end of your work, include:

1. A concise architecture summary
2. A list of key design decisions and why they were made
3. A list of suggested next steps for phase two
4. Any assumptions or tradeoffs you chose

Do not produce a throwaway toy.
Produce a serious, extensible open-source foundation.

---

## Additional prompts you should use later

## Prompt: Generate a new screen inside the system

Create a new mockup screen inside the existing AI Mockup Kit architecture.

Requirements:
- Route:
- Screen title:
- Purpose:
- Journey:
- Layout family:
- Required reused components:
- Required states:
- Fixture pack:
- Related routes:
- Notes:

Rules:
- Follow the established metadata contract
- Register the route properly
- Reuse existing tokens and shared components where possible
- Do not break existing navigation
- Update docs and validation references where needed

## Prompt: Analyze the current mockup system for missing paths

Analyze the current mockup registry, routes, journeys, metadata, and linked navigation.

Identify:
- missing screens in major journeys
- broken or one-way flows
- pages with overlapping intent
- routes that exist but are not discoverable
- missing empty/error/loading states
- components that should be shared but currently diverge
- style drift from shared tokens

Provide findings grouped by:
- critical
- important
- polish

## Prompt: Generate handoff documentation pack

Generate a versioned UI handoff pack for the current mockup set.

Include:
- route inventory
- screen catalog
- journeys
- component inventory
- state matrix
- fixtures summary
- design token summary
- known gaps
- change log
- version notes

Output into the project’s documentation export structure.

---

## My direct recommendation

The better way is not to ask one agent to “make mockups.”

The better way is to build a governed mockup system that:
- forces coherence
- makes routes real
- makes flows inspectable
- makes shell chrome disappear completely
- turns every screen into a documented asset
- gives your team something they can trust

That is what this project should become.

If you do this right, you will not just have a prototype repo.

You will have a **UI generation and handoff framework**.

That is a far stronger open-source idea.

---

## Suggested public README positioning

Possible headline:

> Build high-fidelity product mockups with AI, without losing system coherence.

Possible subtext:

> AI Mockup Kit is an open-source React framework for generating, organizing, validating, and shipping high-fidelity product mockups as real routes and components.

Possible key value points:
- Real routes, not fake screens
- Hide the shell completely for true product preview
- Keep pages coherent with registry, metadata, fixtures, and journeys
- Generate versioned UI handoff packs
- Designed for AI-assisted iteration

---

## Final note

Do not let this project drift into a generic prototype sandbox.

Its unique strength is this combination:

- code-based mockups
- true shellless preview
- centralized governance
- route and journey awareness
- documentation and handoff generation
- agent-friendly structure

That combination is the moat.
