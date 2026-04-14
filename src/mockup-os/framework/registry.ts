/**
 * Per-project registry.
 *
 * Each discovered project (see `./projects.ts`) gets its own `MockupRegistry`
 * keyed by project id. Consumers should call `getRegistry(projectId)` rather
 * than relying on a global. The shell threads the active project id through
 * via `useActiveProject()`.
 */

import type {
  FixtureDefinition,
  JourneyDefinition,
  ScreenDefinition,
} from './types';
import { getProject, projects } from './projects';

export interface MockupRegistry {
  screens: ReadonlyArray<ScreenDefinition>;
  journeys: ReadonlyArray<JourneyDefinition>;
  fixtures: ReadonlyArray<FixtureDefinition>;
  getScreen(id: string): ScreenDefinition | undefined;
  getScreenByRoute(route: string): ScreenDefinition | undefined;
  getJourney(id: string): JourneyDefinition | undefined;
  getFixture(id: string): FixtureDefinition | undefined;
  screensInJourney(journeyId: string): ScreenDefinition[];
}

function indexBy<T, K extends string | number>(
  items: ReadonlyArray<T>,
  key: (t: T) => K,
): Map<K, T> {
  const m = new Map<K, T>();
  for (const item of items) m.set(key(item), item);
  return m;
}

export function createRegistry(
  screens: ReadonlyArray<ScreenDefinition>,
  journeys: ReadonlyArray<JourneyDefinition>,
  fixtures: ReadonlyArray<FixtureDefinition>,
): MockupRegistry {
  const byId = indexBy(screens, (s) => s.id);
  const byRoute = indexBy(screens, (s) => s.route);
  const journeyById = indexBy(journeys, (j) => j.id);
  const fixtureById = indexBy(fixtures, (f) => f.id);

  return {
    screens,
    journeys,
    fixtures,
    getScreen: (id) => byId.get(id),
    getScreenByRoute: (route) => byRoute.get(route),
    getJourney: (id) => journeyById.get(id),
    getFixture: (id) => fixtureById.get(id),
    screensInJourney(journeyId) {
      const j = journeyById.get(journeyId);
      if (!j) return [];
      return j.steps
        .map((id) => byId.get(id))
        .filter((s): s is ScreenDefinition => Boolean(s));
    },
  };
}

const EMPTY_REGISTRY: MockupRegistry = createRegistry([], [], []);

const registriesByProject = new Map<string, MockupRegistry>();
for (const p of projects) {
  registriesByProject.set(
    p.meta.id,
    createRegistry(p.screens, p.journeys, p.fixtures),
  );
}

/**
 * Get the registry for a given project. Returns an empty registry if the
 * project id is unknown — callers should prefer `getProject(id)` first if
 * they need to distinguish "no such project" from "project with no screens".
 */
export function getRegistry(projectId: string | undefined): MockupRegistry {
  if (!projectId) return EMPTY_REGISTRY;
  return registriesByProject.get(projectId) ?? EMPTY_REGISTRY;
}

export function getProjectLayouts(projectId: string | undefined) {
  if (!projectId) return [];
  return getProject(projectId)?.layouts ?? [];
}
