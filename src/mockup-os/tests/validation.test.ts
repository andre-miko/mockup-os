import { describe, expect, it } from 'vitest';
import { validateRegistry } from '@framework/validation';
import type { ScreenDefinition } from '@framework/types';

function makeScreen(partial: Partial<ScreenDefinition> & { id: string; route: string }): ScreenDefinition {
  return {
    title: partial.id,
    description: '',
    layoutFamily: 'dashboard',
    viewport: 'responsive',
    journeys: [],
    states: [],
    fixtures: [],
    components: [],
    status: 'draft',
    version: '0.0.1',
    relatedScreens: [],
    knownGaps: [],
    component: () => null,
    ...partial,
  } as ScreenDefinition;
}

describe('validateRegistry', () => {
  it('flags duplicate screen ids', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a' }), makeScreen({ id: 'a', route: '/b' })],
      journeys: [],
      fixtures: [],
    });
    expect(r.errors.some((i) => i.code === 'duplicate-screen-id')).toBe(true);
  });

  it('flags routes that do not start with /', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: 'bad' })],
      journeys: [],
      fixtures: [],
    });
    expect(r.errors.some((i) => i.code === 'invalid-route')).toBe(true);
  });

  it('flags journeys pointing at missing screens', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a' })],
      journeys: [{ id: 'j1', title: 'J', description: '', steps: ['a', 'ghost'] }],
      fixtures: [],
    });
    expect(r.errors.some((i) => i.code === 'missing-journey-step')).toBe(true);
  });

  it('warns on orphan screens', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a' })],
      journeys: [],
      fixtures: [],
    });
    expect(r.warnings.some((i) => i.code === 'orphan-screen')).toBe(true);
  });

  it('flags unknown permissions referenced by a screen', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a', permissions: ['does.not.exist'] })],
      journeys: [],
      fixtures: [],
      config: { permissions: [] },
    });
    expect(r.errors.some((i) => i.code === 'unknown-permission')).toBe(true);
  });

  it('flags unknown sections referenced by a screen', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a', sections: ['ghost'] })],
      journeys: [],
      fixtures: [],
      config: { sections: [] },
    });
    expect(r.errors.some((i) => i.code === 'unknown-section')).toBe(true);
  });

  it('flags a permission defaultMode not listed in modes', () => {
    const r = validateRegistry({
      screens: [],
      journeys: [],
      fixtures: [],
      config: {
        permissions: [
          {
            id: 'p',
            label: 'P',
            description: '',
            default: true,
            modes: ['hidden'],
            defaultMode: 'disabled',
          },
        ],
      },
    });
    expect(r.errors.some((i) => i.code === 'invalid-permission-default-mode')).toBe(true);
  });

  it('warns on permissions no screen references', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a' })],
      journeys: [],
      fixtures: [],
      config: {
        permissions: [
          {
            id: 'dead',
            label: 'Dead',
            description: '',
            default: true,
            modes: ['hidden'],
            defaultMode: 'hidden',
          },
        ],
      },
    });
    expect(
      r.warnings.some((i) => i.code === 'permission-not-applied-by-any-screen'),
    ).toBe(true);
  });

  it('warns on sections with no members', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a' })],
      journeys: [],
      fixtures: [],
      config: { sections: [{ id: 'empty', label: 'Empty', screenIds: [] }] },
    });
    expect(r.warnings.some((i) => i.code === 'section-empty')).toBe(true);
  });

  it('flags sections whose screenIds reference missing screens', () => {
    const r = validateRegistry({
      screens: [makeScreen({ id: 'a', route: '/a' })],
      journeys: [],
      fixtures: [],
      config: {
        sections: [{ id: 's', label: 'S', screenIds: ['a', 'ghost'] }],
      },
    });
    expect(r.errors.some((i) => i.code === 'section-screen-missing')).toBe(true);
  });
});
