/**
 * Authoring helpers.
 *
 * `defineScreen`, `defineJourney`, and `defineFixture` are the canonical
 * way to declare mockup metadata. They exist purely for type inference
 * and a single point to hang future validation on.
 */

import type {
  FixtureDefinition,
  JourneyDefinition,
  ProjectConfig,
  ScreenDefinition,
} from './types';

export const defineScreen = (screen: ScreenDefinition): ScreenDefinition => screen;
export const defineJourney = (journey: JourneyDefinition): JourneyDefinition => journey;
export const defineFixture = <T>(fixture: FixtureDefinition<T>): FixtureDefinition<T> =>
  fixture;
export const defineProjectConfig = (config: ProjectConfig): ProjectConfig => config;
