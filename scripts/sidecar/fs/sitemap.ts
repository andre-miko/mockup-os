/**
 * Sitemap loader.
 *
 * Reads the authored intent doc at `Projects/<id>/docs/sitemap.md`. Parsing
 * into structured ghost screens (Phase 5) happens client-side via
 * `framework/sitemap.ts`. The sidecar just serves the raw markdown so we
 * keep one parser, not two.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolveInsideProject } from './paths';

export interface Sitemap {
  exists: boolean;
  raw: string;
}

export function readSitemap(projectId: string): Sitemap {
  const file = resolveInsideProject(projectId, 'docs', 'sitemap.md');
  if (!existsSync(file) || !statSync(file).isFile()) {
    return { exists: false, raw: '' };
  }
  return { exists: true, raw: readFileSync(file, 'utf8') };
}
