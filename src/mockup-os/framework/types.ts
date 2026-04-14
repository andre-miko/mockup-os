/**
 * AI Mockup Kit — core metadata contracts.
 *
 * Every mockup is described by a ScreenDefinition. The registry is the
 * single source of truth; routes, docs, validation, and handoff all
 * derive from it. Keep this file stable — breaking changes here ripple
 * through every downstream consumer.
 */

import type { ComponentType, LazyExoticComponent } from 'react';

/** Lifecycle of a screen as it moves from draft to handoff. */
export type ScreenStatus =
  | 'draft'
  | 'in-review'
  | 'approved'
  | 'shipped'
  | 'deprecated';

/** Coarse layout family. Used for consistency checks and docs grouping. */
export type LayoutFamily =
  | 'auth'
  | 'dashboard'
  | 'detail'
  | 'list'
  | 'wizard'
  | 'empty'
  | 'modal'
  | 'marketing'
  | 'settings';

/** Intended viewport. Informs presentation-mode defaults. */
export type ViewportIntent = 'mobile' | 'tablet' | 'desktop' | 'responsive';

/** A named visual/data state a screen can present (e.g. loading, empty). */
export interface ScreenState {
  id: string;
  label: string;
  description?: string;
  /** Fixture ids this state depends on. */
  fixtures?: string[];
}

/** Reference to a reusable mockup component. */
export interface ComponentReference {
  id: string;
  name: string;
  /** Import path, relative to src/. Used for docs, not runtime. */
  path: string;
}

/** A known gap that intentionally hasn't been designed yet. */
export interface KnownGap {
  id: string;
  description: string;
  severity: 'info' | 'warn' | 'blocker';
}

/**
 * Structured metadata for a single mockup screen.
 *
 * `component` is the actual React component rendered at `route`. Keep it
 * lazy wherever practical so the builder boots fast even with hundreds of
 * screens.
 */
export interface ScreenDefinition {
  id: string;
  title: string;
  /** React Router path. Must start with a forward slash. */
  route: string;
  description: string;
  layoutFamily: LayoutFamily;
  viewport: ViewportIntent;
  /** Journey ids this screen belongs to. */
  journeys: string[];
  states: ScreenState[];
  /** Default state id — picked on first load. */
  defaultStateId?: string;
  /** Fixture ids available to this screen. */
  fixtures: string[];
  /** Components referenced by this screen. */
  components: ComponentReference[];
  status: ScreenStatus;
  /** Semantic-ish version. Bumped on intentional change. */
  version: string;
  /** Other screen ids this one links to or complements. */
  relatedScreens: string[];
  knownGaps: KnownGap[];
  /** Permission ids this screen honours. Must match entries in project.config. */
  permissions?: string[];
  /** Section ids this screen belongs to. Must match entries in project.config. */
  sections?: string[];
  /** The rendered component. Lazy preferred; eager allowed for tiny pages. */
  component: ComponentType | LazyExoticComponent<ComponentType>;
}

/** An ordered user journey across one or more screens. */
export interface JourneyDefinition {
  id: string;
  title: string;
  description: string;
  /** Ordered screen ids. Validator ensures every id resolves. */
  steps: string[];
  /** Optional tag used to group related journeys. */
  group?: string;
  /**
   * Provenance — whether this journey came from a markdown file under
   * `docs/journeys/` or from a TS `defineJourney(...)` call. Markdown wins
   * on id conflict. Unset when the consumer didn't populate it.
   */
  source?: 'markdown' | 'ts';
}

/** Static data used to hydrate a screen in a given state. */
export interface FixtureDefinition<T = unknown> {
  id: string;
  /** Optional screen scoping. Omit for shared fixtures. */
  screenId?: string;
  description?: string;
  data: T;
}

/** Design token surface — kept minimal; extend per product needs. */
export interface DesignTokens {
  color: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  font: Record<string, string>;
}

/**
 * How a denied permission should be expressed in the UI. Authors pick per
 * call-site — hide-vs-disable is a design choice, not a framework one.
 */
export type PermissionMode = 'hidden' | 'disabled' | 'denied-message' | 'read-only';

/**
 * A permission the project's UI can gate on. Declared centrally in
 * `project.config.ts` and referenced by screens via `ScreenDefinition.permissions`.
 * Authors render conditionally via the `usePermission(id)` hook (Phase 4).
 */
export interface Permission {
  id: string;
  label: string;
  description: string;
  /** True if the permission is granted by default in the builder. */
  default: boolean;
  /** Modes the builder offers for this permission. */
  modes: ReadonlyArray<PermissionMode>;
  /** Mode applied when the permission is denied and no override is set. */
  defaultMode: PermissionMode;
}

/**
 * A user-defined organisational grouping of screens. Purely metadata — a
 * screen can belong to zero, one, or many sections. The Sitemap tab
 * (Phase 5) renders a "By Section" subview from these.
 */
export interface Section {
  id: string;
  label: string;
  description?: string;
  /** Authoritative list of screen ids that belong to this section. */
  screenIds: string[];
}

/**
 * Product-level route layout entry. Each layout wraps every screen whose
 * route starts with the given prefix. Empty array means every screen
 * renders bare.
 */
export interface ProductLayoutEntry {
  prefix: string;
  layout: ComponentType;
}

/**
 * Per-project configuration loaded from `Projects/<id>/project.config.ts`.
 * Everything is optional so projects can adopt features incrementally.
 */
export interface ProjectConfig {
  permissions?: ReadonlyArray<Permission>;
  sections?: ReadonlyArray<Section>;
  layouts?: ReadonlyArray<ProductLayoutEntry>;
  /** Optional override for the landing screen id when the project is selected. */
  defaultScreenId?: string;
}

/**
 * A screen the project *intends to ship* but hasn't implemented yet.
 * Authored in `Projects/<id>/docs/sitemap.md` (parsed client-side), or
 * proposed by the `sitemap-planner` agent in Phase 10. The Sitemap tab
 * renders these alongside real screens so coverage gaps are visible.
 */
export interface GhostScreen {
  /** Deterministic id — either the `✅ <id>` from the sitemap, or a slug from the route. */
  id: string;
  title: string;
  /** Intended route (may contain `:params`). Unique within a project. */
  route: string;
  /** Section id (if the sitemap placed the entry under a `## Section:` heading). */
  sectionId?: string;
  /** Free-form reason from a sitemap `- Why:` bullet. */
  rationale?: string;
  source: 'sitemap.md' | 'ai-suggestion';
}
