import { describe, expect, it } from 'vitest';
import { getRegistry } from '@framework/registry';
import { projects } from '@framework/projects';
import { validateRegistry } from '@framework/validation';

describe('registry', () => {
  it('discovers at least one project', () => {
    expect(projects.length).toBeGreaterThan(0);
  });

  for (const project of projects) {
    describe(`project: ${project.meta.id}`, () => {
      const { screens, journeys, fixtures } = project;
      const registry = getRegistry(project.meta.id);

      it('is internally consistent', () => {
        const report = validateRegistry({
          screens,
          journeys,
          fixtures,
          config: project.config,
        });
        expect(report.errors, JSON.stringify(report.errors, null, 2)).toHaveLength(0);
      });

      it('can resolve every journey step', () => {
        for (const j of registry.journeys) {
          for (const step of j.steps) {
            expect(registry.getScreen(step), `${j.id} → ${step}`).toBeDefined();
          }
        }
      });

      it('every screen is reachable by id and route', () => {
        for (const s of registry.screens) {
          expect(registry.getScreen(s.id)?.id).toBe(s.id);
          expect(registry.getScreenByRoute(s.route)?.id).toBe(s.id);
        }
      });
    });
  }
});
