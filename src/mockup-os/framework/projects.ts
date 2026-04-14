/**
 * Project discovery (browser / Vite side).
 *
 * Every folder under `/Projects/<id>/` that ships a `mockups/index.ts` and a
 * `project.json` is loaded eagerly at build time via Vite's `import.meta.glob`.
 * Each becomes a `ProjectRecord` keyed by its folder id. The shell, router,
 * and validation layers consume these records via `getProject(id)` rather
 * than importing from a single global `@mockups/index`.
 *
 * Node-side scripts (validate / docs / handoff) discover projects through
 * `scripts/lib/discover-projects.ts`, which uses fs + dynamic import to
 * produce the same shape.
 */

import type {
  FixtureDefinition,
  JourneyDefinition,
  ProductLayoutEntry,
  ProjectConfig,
  ScreenDefinition,
} from './types';
import { mergeJourneys, parseJourneyMarkdown } from './journeys';

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface ProjectRecord {
  meta: ProjectMeta;
  screens: ReadonlyArray<ScreenDefinition>;
  journeys: ReadonlyArray<JourneyDefinition>;
  fixtures: ReadonlyArray<FixtureDefinition>;
  layouts: ReadonlyArray<ProductLayoutEntry>;
  config: ProjectConfig;
}

interface MockupModule {
  screens?: ReadonlyArray<ScreenDefinition>;
  journeys?: ReadonlyArray<JourneyDefinition>;
  fixtures?: ReadonlyArray<FixtureDefinition>;
}

const mockupModules = import.meta.glob<MockupModule>(
  '../../../Projects/*/mockups/index.ts',
  { eager: true },
);

const projectMetaModules = import.meta.glob<ProjectMeta>(
  '../../../Projects/*/project.json',
  { eager: true, import: 'default' },
);

const projectConfigModules = import.meta.glob<ProjectConfig>(
  '../../../Projects/*/project.config.ts',
  { eager: true, import: 'default' },
);

// Markdown journey files are loaded as raw strings; we parse them with
// `parseJourneyMarkdown` below. Using `{ query: '?raw', import: 'default' }`
// matches Vite 5's raw-import API.
const journeyMarkdownModules = import.meta.glob<string>(
  '../../../Projects/*/docs/journeys/*.md',
  { eager: true, query: '?raw', import: 'default' },
);

function projectIdFromPath(path: string): string {
  const m = path.match(/Projects\/([^/]+)\//);
  if (!m) throw new Error(`Could not extract project id from ${path}`);
  return m[1];
}

const records = new Map<string, ProjectRecord>();

// Group the parsed journey markdowns by project id so the main loop can
// merge them with any TS-sourced journeys.
const markdownJourneysByProject = new Map<string, JourneyDefinition[]>();
for (const [path, raw] of Object.entries(journeyMarkdownModules)) {
  try {
    const id = projectIdFromPath(path);
    const journey = parseJourneyMarkdown(raw, path);
    const arr = markdownJourneysByProject.get(id) ?? [];
    arr.push(journey);
    markdownJourneysByProject.set(id, arr);
  } catch (err) {
    console.warn(`[mockup-os] failed to parse journey markdown: ${(err as Error).message}`);
  }
}

for (const [path, module] of Object.entries(mockupModules)) {
  const id = projectIdFromPath(path);
  const metaPath = path.replace('/mockups/index.ts', '/project.json');
  const configPath = path.replace('/mockups/index.ts', '/project.config.ts');
  const meta = projectMetaModules[metaPath];
  if (!meta) {
    console.warn(`[mockup-os] project "${id}" is missing project.json — skipping`);
    continue;
  }
  const config: ProjectConfig = projectConfigModules[configPath] ?? {};
  const tsJourneys = module.journeys ?? [];
  const mdJourneys = markdownJourneysByProject.get(id) ?? [];
  records.set(id, {
    meta,
    screens: module.screens ?? [],
    journeys: mergeJourneys(mdJourneys, tsJourneys),
    fixtures: module.fixtures ?? [],
    layouts: config.layouts ?? [],
    config,
  });
}

export const projects: ReadonlyArray<ProjectRecord> = [...records.values()].sort(
  (a, b) => a.meta.id.localeCompare(b.meta.id),
);

export function getProject(id: string): ProjectRecord | undefined {
  return records.get(id);
}

export function getProjectIds(): string[] {
  return projects.map((p) => p.meta.id);
}

/**
 * Default project id used when the store has not yet picked one. Falls back
 * to the first discovered project. Returns `undefined` only if no projects
 * exist at all (the shell shows an empty state in that case).
 */
export function getDefaultProjectId(): string | undefined {
  return projects[0]?.meta.id;
}
