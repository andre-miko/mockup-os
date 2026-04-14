/**
 * Project discovery — fs-only, no dynamic imports.
 *
 * Reads `project.json` from every `Projects/<id>/` folder. Lightweight
 * because the sidecar never needs to load the React mockup code; the
 * browser-side `framework/projects.ts` handles that.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertValidProjectId,
  getProjectRoot,
  getProjectsRoot,
} from './paths';

export interface SidecarProject {
  id: string;
  name: string;
  description: string;
  version: string;
  /** Absolute filesystem path of the project root. Useful for diagnostics. */
  rootPath: string;
}

function readProjectJson(rootPath: string): Omit<SidecarProject, 'rootPath'> | null {
  const manifest = join(rootPath, 'project.json');
  if (!existsSync(manifest)) return null;
  try {
    const parsed = JSON.parse(readFileSync(manifest, 'utf8'));
    if (
      typeof parsed.id !== 'string' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.version !== 'string'
    ) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      version: parsed.version,
    };
  } catch {
    return null;
  }
}

export function listProjects(): SidecarProject[] {
  const root = getProjectsRoot();
  if (!existsSync(root)) return [];
  const out: SidecarProject[] = [];
  for (const entry of readdirSync(root)) {
    const rootPath = join(root, entry);
    if (!statSync(rootPath).isDirectory()) continue;
    const meta = readProjectJson(rootPath);
    if (!meta) continue;
    out.push({ ...meta, rootPath });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export function getProject(id: string): SidecarProject | null {
  try {
    assertValidProjectId(id);
  } catch {
    return null;
  }
  const rootPath = getProjectRoot(id);
  if (!existsSync(rootPath) || !statSync(rootPath).isDirectory()) return null;
  const meta = readProjectJson(rootPath);
  if (!meta) return null;
  return { ...meta, rootPath };
}
