/**
 * Brief loader.
 *
 * A project's brief is a small fixed set of markdown files under
 * `Projects/<id>/brief/`. This module walks the folder, returns each
 * file's name and raw content, and lets the caller assemble the
 * client-facing shape. Write-side (Phase 9) lives elsewhere.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import { resolveInsideProject } from './paths';

export interface BriefFile {
  /** Filename, e.g. `01-scope.md`. Stable and sortable. */
  name: string;
  /** Raw markdown content (utf-8). */
  content: string;
}

export interface Brief {
  /** True if the brief folder exists on disk. */
  exists: boolean;
  files: BriefFile[];
}

export function readBrief(projectId: string): Brief {
  const briefDir = resolveInsideProject(projectId, 'brief');
  if (!existsSync(briefDir) || !statSync(briefDir).isDirectory()) {
    return { exists: false, files: [] };
  }
  const files: BriefFile[] = [];
  for (const name of readdirSync(briefDir).sort()) {
    if (extname(name).toLowerCase() !== '.md') continue;
    const full = join(briefDir, name);
    if (!statSync(full).isFile()) continue;
    files.push({ name, content: readFileSync(full, 'utf8') });
  }
  return { exists: true, files };
}

export class BriefFileNameError extends Error {
  constructor(public readonly fileName: string) {
    super(`Invalid brief filename: ${fileName}`);
    this.name = 'BriefFileNameError';
  }
}

const BRIEF_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.md$/;

/**
 * Atomically write one brief file. Filename must end in `.md` and contain
 * no path separators or `..` segments. The folder is created on first
 * write so projects don't need a `brief/` directory pre-seeded.
 */
export function writeBriefFile(
  projectId: string,
  fileName: string,
  content: string,
): { path: string; bytes: number } {
  if (!BRIEF_NAME_RE.test(fileName) || fileName.includes('..')) {
    throw new BriefFileNameError(fileName);
  }
  const briefDir = resolveInsideProject(projectId, 'brief');
  if (!existsSync(briefDir)) mkdirSync(briefDir, { recursive: true });
  const path = resolveInsideProject(projectId, 'brief', fileName);
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
  return { path, bytes: Buffer.byteLength(content, 'utf8') };
}
