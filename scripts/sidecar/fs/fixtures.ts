/**
 * Fixture file IO.
 *
 * Data lives at `Projects/<id>/data/<fixtureId>.json`. This module is the
 * only place that touches those files.
 *
 * We write directly with `writeFileSync` instead of the tmp-then-rename
 * atomic pattern. On Windows, chokidar (what Vite's watcher uses) drops
 * rename events frequently enough that the dev server never invalidates
 * its transform cache for `projects.ts` — the page reloads but serves
 * the old bundled JSON. A direct write produces a single "change" event
 * that chokidar reports reliably. JSON payloads here are small and the
 * write completes before any reader can observe a partial state in
 * practice.
 *
 * The sidecar does NOT own the fixture *registration* — that's still
 * the project's `mockups/fixtures.ts`. We only rewrite the JSON payload;
 * the binding between id and JSON file stays wherever the author put it.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { resolveInsideProject } from './paths';

export class FixtureIdError extends Error {
  constructor(public readonly fixtureId: string) {
    super(`Invalid fixture id: ${fixtureId}`);
    this.name = 'FixtureIdError';
  }
}

// Fixture ids must map safely to a filename. We disallow path separators
// and leading dots to prevent traversal; everything else is fine (dots
// inside ids like `finch.accounts.default` are allowed and map to the
// filename as-is).
const FIXTURE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export function assertValidFixtureId(id: string): void {
  if (!FIXTURE_ID_RE.test(id) || id.includes('..')) {
    throw new FixtureIdError(id);
  }
}

function dataDir(projectId: string): string {
  return resolveInsideProject(projectId, 'data');
}

function fixturePath(projectId: string, fixtureId: string): string {
  assertValidFixtureId(fixtureId);
  return resolveInsideProject(projectId, 'data', `${fixtureId}.json`);
}

export interface FixtureFileSummary {
  id: string;
  path: string;
  bytes: number;
  modifiedAt: string;
}

export function listFixtureFiles(projectId: string): FixtureFileSummary[] {
  const dir = dataDir(projectId);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith('.json'))
    .map((name) => {
      const path = join(dir, name);
      const stat = statSync(path);
      return {
        id: name.replace(/\.json$/, ''),
        path,
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function readFixtureFile(projectId: string, fixtureId: string): unknown {
  const path = fixturePath(projectId, fixtureId);
  if (!existsSync(path)) {
    throw new Error(`Fixture file not found: ${fixtureId}.json`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/**
 * Write the given value as pretty JSON to `data/<fixtureId>.json`.
 * Creates the `data/` folder if missing. The caller owns JSON parsing
 * and schema validation; this function only does the file IO.
 */
export function writeFixtureFile(
  projectId: string,
  fixtureId: string,
  data: unknown,
): { path: string; bytes: number } {
  const path = fixturePath(projectId, fixtureId);
  const dir = dataDir(projectId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const body = JSON.stringify(data, null, 2) + '\n';
  writeFileSync(path, body, 'utf8');
  return { path, bytes: Buffer.byteLength(body, 'utf8') };
}
