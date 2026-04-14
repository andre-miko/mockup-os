/**
 * Safe path resolution for the sidecar.
 *
 * Everything the sidecar reads or writes lives under `PROJECTS_ROOT`. Before
 * any fs op we resolve user-supplied ids into absolute paths and reject
 * anything that tries to traverse out of the root. This is the only layer
 * that touches the filesystem — handlers call through these helpers.
 */

import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(MODULE_DIR, '..', '..', '..');

/** Absolute path of the repo root (for logging / diagnostics). */
export function getRepoRoot(): string {
  return REPO_ROOT;
}

/**
 * Directory the sidecar considers the "projects root". Overridable via the
 * `PROJECTS_ROOT` env var so tests and CI can point it at a temp dir.
 */
export function getProjectsRoot(): string {
  const fromEnv = process.env.PROJECTS_ROOT;
  if (fromEnv && fromEnv.length > 0) return resolve(fromEnv);
  return join(REPO_ROOT, 'Projects');
}

const ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export class ProjectIdError extends Error {
  constructor(public readonly projectId: string) {
    super(`Invalid project id: ${projectId}`);
    this.name = 'ProjectIdError';
  }
}

export class PathTraversalError extends Error {
  constructor(public readonly attempted: string) {
    super(`Refused path traversal: ${attempted}`);
    this.name = 'PathTraversalError';
  }
}

/**
 * Validate a project id. Folder names under `Projects/` must match this
 * shape — keeps the id usable in URLs and prevents fs traversal via id.
 */
export function assertValidProjectId(id: string): void {
  if (!ID_PATTERN.test(id) || id === '.' || id === '..') {
    throw new ProjectIdError(id);
  }
}

export function getProjectRoot(id: string): string {
  assertValidProjectId(id);
  return join(getProjectsRoot(), id);
}

/**
 * Resolve a path under a project root and assert the result does not
 * escape that root. Throws `PathTraversalError` on any attempted escape.
 */
export function resolveInsideProject(
  projectId: string,
  ...segments: string[]
): string {
  const root = getProjectRoot(projectId);
  const joined = resolve(root, ...segments);
  // Compare with trailing separator to avoid false positives on shared
  // prefixes (e.g., /projects/foo vs /projects/foobar).
  if (joined !== root && !joined.startsWith(root + sep)) {
    throw new PathTraversalError(joined);
  }
  return joined;
}

export function projectExists(id: string): boolean {
  try {
    const root = getProjectRoot(id);
    return existsSync(root) && statSync(root).isDirectory();
  } catch {
    return false;
  }
}
