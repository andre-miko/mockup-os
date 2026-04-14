/**
 * Node-side project discovery for repo scripts.
 *
 * Walks `/Projects/<id>/`, dynamically imports each project's
 * `mockups/index.ts`, reads its `project.json`, and returns the same
 * `ProjectRecord` shape the browser-side `framework/projects.ts` exposes.
 *
 * Used by `validate-registry.ts`, `build-docs.ts`, `build-handoff.ts`.
 * Invoked by `tsx` so TypeScript and tsconfig path aliases (`@framework/*`,
 * `@mockups/*`) resolve transparently.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type {
  FixtureDefinition,
  JourneyDefinition,
  ProjectConfig,
  ScreenDefinition,
} from '../../src/mockup-os/framework/types';
import {
  mergeJourneys,
  parseJourneyMarkdown,
} from '../../src/mockup-os/framework/journeys';

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface DiscoveredProject {
  meta: ProjectMeta;
  rootPath: string;
  screens: ReadonlyArray<ScreenDefinition>;
  journeys: ReadonlyArray<JourneyDefinition>;
  fixtures: ReadonlyArray<FixtureDefinition>;
  config: ProjectConfig;
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROJECTS_ROOT = join(REPO_ROOT, 'Projects');

export function getRepoRoot(): string {
  return REPO_ROOT;
}

export function getProjectsRoot(): string {
  return PROJECTS_ROOT;
}

function listProjectFolders(): string[] {
  if (!existsSync(PROJECTS_ROOT)) return [];
  return readdirSync(PROJECTS_ROOT)
    .map((name) => join(PROJECTS_ROOT, name))
    .filter((p) => statSync(p).isDirectory())
    .filter((p) => existsSync(join(p, 'project.json')))
    .filter((p) => existsSync(join(p, 'mockups', 'index.ts')));
}

function loadMarkdownJourneys(rootPath: string): JourneyDefinition[] {
  const dir = join(rootPath, 'docs', 'journeys');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const out: JourneyDefinition[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.toLowerCase().endsWith('.md')) continue;
    const file = join(dir, name);
    if (!statSync(file).isFile()) continue;
    try {
      out.push(parseJourneyMarkdown(readFileSync(file, 'utf8'), file));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn((err as Error).message);
    }
  }
  return out;
}

export async function discoverProjects(): Promise<DiscoveredProject[]> {
  const out: DiscoveredProject[] = [];
  for (const rootPath of listProjectFolders()) {
    const meta = JSON.parse(
      readFileSync(join(rootPath, 'project.json'), 'utf8'),
    ) as ProjectMeta;

    // Dynamic import via file URL so Node resolves the .ts via tsx's loader.
    const indexUrl = pathToFileURL(join(rootPath, 'mockups', 'index.ts')).href;
    const mod = (await import(indexUrl)) as {
      screens?: ReadonlyArray<ScreenDefinition>;
      journeys?: ReadonlyArray<JourneyDefinition>;
      fixtures?: ReadonlyArray<FixtureDefinition>;
    };

    // project.config.ts is optional. Projects that don't need permissions or
    // sections yet can skip it; validation falls back to pre-Phase-2 checks.
    let config: ProjectConfig = {};
    const configPath = join(rootPath, 'project.config.ts');
    if (existsSync(configPath)) {
      const configUrl = pathToFileURL(configPath).href;
      const configMod = (await import(configUrl)) as { default?: ProjectConfig };
      config = configMod.default ?? {};
    }

    const tsJourneys = mod.journeys ?? [];
    const mdJourneys = loadMarkdownJourneys(rootPath);

    out.push({
      meta,
      rootPath,
      screens: mod.screens ?? [],
      journeys: mergeJourneys(mdJourneys, tsJourneys),
      fixtures: mod.fixtures ?? [],
      config,
    });
  }
  return out.sort((a, b) => a.meta.id.localeCompare(b.meta.id));
}
