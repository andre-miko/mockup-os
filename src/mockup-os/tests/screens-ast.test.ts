/**
 * Integration test for the ts-morph rewriter.
 *
 * Builds a tiny `mockups/index.ts` in a temp dir, then drives
 * duplicate / setStatus / delete through the public API and asserts the
 * file shape after each step. Independent of the example project so
 * accidental authoring breakage doesn't blow up CI.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ScreenNotFoundError,
  deleteScreen,
  duplicateScreen,
  setScreenStatus,
} from '../../../scripts/sidecar/fs/screens-ast';

const FIXTURE_INDEX = `import { defineScreen } from '@framework/defineScreen';

const Foo = () => null;
const Bar = () => null;

export const screens = [
  defineScreen({
    id: 'app.foo',
    title: 'Foo',
    route: '/app/foo',
    description: '',
    layoutFamily: 'dashboard',
    viewport: 'responsive',
    journeys: [],
    states: [{ id: 'default', label: 'Default' }],
    defaultStateId: 'default',
    fixtures: [],
    components: [],
    status: 'draft',
    version: '0.1.0',
    relatedScreens: [],
    knownGaps: [],
    component: Foo,
  }),
  defineScreen({
    id: 'app.bar',
    title: 'Bar',
    route: '/app/bar',
    description: '',
    layoutFamily: 'dashboard',
    viewport: 'responsive',
    journeys: [],
    states: [],
    fixtures: [],
    components: [],
    status: 'approved',
    version: '0.2.0',
    relatedScreens: [],
    knownGaps: [],
    component: Bar,
  }),
];
`;

let projectRoot: string;

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'mockup-os-ast-'));
  mkdirSync(join(projectRoot, 'mockups'), { recursive: true });
  writeFileSync(join(projectRoot, 'mockups', 'index.ts'), FIXTURE_INDEX, 'utf8');
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

function read(): string {
  return readFileSync(join(projectRoot, 'mockups', 'index.ts'), 'utf8');
}

describe('screens-ast', () => {
  describe('duplicateScreen', () => {
    it('inserts a new screen with .copy id, suffixed route, draft status', () => {
      const result = duplicateScreen(projectRoot, 'app.foo');
      expect(result.newScreenId).toBe('app.foo.copy');
      expect(result.newRoute).toBe('/app/foo-copy');
      const text = read();
      expect(text).toContain("id: \"app.foo.copy\"");
      expect(text).toContain("route: \"/app/foo-copy\"");
      expect(text).toContain("title: \"Foo (copy)\"");
      expect(text).toContain("status: \"draft\"");
    });

    it('auto-increments to .copy2 when .copy already exists', () => {
      duplicateScreen(projectRoot, 'app.foo');
      const second = duplicateScreen(projectRoot, 'app.foo');
      expect(second.newScreenId).toBe('app.foo.copy2');
      expect(second.newRoute).toBe('/app/foo-copy2');
    });

    it('throws ScreenNotFoundError for unknown ids', () => {
      expect(() => duplicateScreen(projectRoot, 'app.ghost')).toThrow(ScreenNotFoundError);
    });
  });

  describe('setScreenStatus', () => {
    it('updates the status property and reports previous value', () => {
      const result = setScreenStatus(projectRoot, 'app.foo', 'in-review');
      expect(result.previousStatus).toBe('draft');
      expect(result.newStatus).toBe('in-review');
      expect(read()).toContain("status: \"in-review\"");
    });

    it('rejects unknown status values', () => {
      expect(() => setScreenStatus(projectRoot, 'app.foo', 'totally-made-up')).toThrow(
        /invalid status/,
      );
    });
  });

  describe('deleteScreen', () => {
    it('removes the matching defineScreen call', () => {
      deleteScreen(projectRoot, 'app.bar');
      const text = read();
      expect(text).not.toContain("id: 'app.bar'");
      expect(text).toContain("id: 'app.foo'");
    });

    it('throws ScreenNotFoundError when the id is missing', () => {
      expect(() => deleteScreen(projectRoot, 'nope')).toThrow(ScreenNotFoundError);
    });
  });

  describe('full round-trip', () => {
    it('duplicate then delete leaves a valid file with the original screens intact', () => {
      const dup = duplicateScreen(projectRoot, 'app.foo');
      deleteScreen(projectRoot, dup.newScreenId);
      const text = read();
      expect(text).toContain("id: 'app.foo'");
      expect(text).toContain("id: 'app.bar'");
      expect(text).not.toContain('app.foo.copy');
    });
  });
});
