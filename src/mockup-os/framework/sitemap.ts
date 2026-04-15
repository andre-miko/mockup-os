/**
 * Sitemap: authored intent + implemented reality.
 *
 * `docs/sitemap.md` is the authored source of truth for what screens the
 * project *should* have. The registry is the implemented source of truth
 * for what *does* exist. This module parses the sitemap and merges it
 * with the active project's registry so the Sitemap tab can show both —
 * real screens (with status colouring) and "ghost" screens (proposed but
 * not built yet).
 *
 * Grammar of sitemap.md (minimal and codex-parseable):
 *
 *     # Sitemap
 *
 *     ## Section: <section-id>
 *     - /route — Title ✅ <screen.id>
 *     - /route — Title ✨ proposed
 *       - Why: free-form rationale
 *
 * The parser is deliberately forgiving — unknown lines are ignored rather
 * than rejected so an in-progress sitemap never crashes the UI.
 */

import { useEffect, useMemo, useState } from 'react';
import { useBuilderStore } from './store';
import { getProject } from './projects';
import { getRegistry } from './registry';
import { sidecar } from './sidecar-client';
import type { GhostScreen, ScreenDefinition, ScreenStatus } from './types';
import {
  parseSitemap,
  type ParsedSitemap,
  type ParsedSitemapEntry,
  type ParsedSitemapSection,
} from './sitemap-parser';

export { parseSitemap };
export type { ParsedSitemap, ParsedSitemapEntry, ParsedSitemapSection };

// ─── tree node shape used by the Sitemap tab ─────────────────────────

export type SitemapNodeKind = 'section' | 'real' | 'ghost';

export interface SitemapNode {
  id: string;
  label: string;
  sublabel?: string;
  kind: SitemapNodeKind;
  status?: ScreenStatus;
  route?: string;
  screenId?: string;
  description?: string;
  rationale?: string;
  children?: SitemapNode[];
}

function realNode(screen: ScreenDefinition): SitemapNode {
  return {
    id: `real:${screen.id}`,
    label: screen.title,
    sublabel: screen.route,
    kind: 'real',
    status: screen.status,
    route: screen.route,
    screenId: screen.id,
    description: screen.description,
  };
}

function ghostNode(ghost: GhostScreen): SitemapNode {
  return {
    id: `ghost:${ghost.id}`,
    label: ghost.title,
    sublabel: ghost.route,
    kind: 'ghost',
    route: ghost.route,
    rationale: ghost.rationale,
  };
}

function ghostIdFromRoute(route: string, title: string): string {
  const slug = route
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/+/g, '.')
    .replace(/\.+$/, '')
    .toLowerCase();
  return slug || title.toLowerCase().replace(/\s+/g, '-');
}

// ─── the React side ─────────────────────────────────────────────────

export interface SitemapResult {
  loading: boolean;
  /** Markdown sitemap was found on disk. `false` means "no file yet". */
  exists: boolean;
  error?: string;
  real: ReadonlyArray<ScreenDefinition>;
  ghosts: ReadonlyArray<GhostScreen>;
  /** Flat by-URL list sorted by route. */
  byUrl: SitemapNode[];
  /** Hierarchical sections → screens/ghosts. */
  bySection: SitemapNode[];
}

const EMPTY_RESULT: SitemapResult = {
  loading: false,
  exists: false,
  real: [],
  ghosts: [],
  byUrl: [],
  bySection: [],
};

/**
 * Load and merge sitemap.md (via sidecar) with the active project's registry.
 * Returns a structured result that the Sitemap tab renders directly.
 *
 * Designed to tolerate sidecar outages: if the sidecar is offline the
 * sitemap is treated as "not authored" (empty ghosts), and real screens
 * still render. An `error` field surfaces genuine parse / server failures.
 */
export function useSitemap(): SitemapResult {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const [raw, setRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    sidecar.getSitemap(projectId).then((res) => {
      if (cancelled) return;
      if (res.status === 'ok') {
        setExists(res.data.exists);
        setRaw(res.data.raw);
        setError(undefined);
      } else if (res.status === 'offline') {
        setExists(false);
        setRaw(null);
        setError(undefined); // offline is not an error — just empty ghosts
      } else {
        setExists(false);
        setRaw(null);
        setError(`${res.code}: ${res.message}`);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return useMemo(() => {
    if (!projectId) return EMPTY_RESULT;
    const registry = getRegistry(projectId);
    const project = getProject(projectId);
    const real = registry.screens;
    const realByRoute = new Map(real.map((s) => [s.route, s]));

    const parsed = raw ? parseSitemap(raw) : { sections: [], entries: [] };

    // Build the ghost list — only entries the registry hasn't fulfilled.
    const ghosts: GhostScreen[] = [];
    for (const entry of parsed.entries) {
      if (entry.kind === 'real') continue;
      if (realByRoute.has(entry.route)) continue; // sitemap-ghost but registry caught up
      const id = ghostIdFromRoute(entry.route, entry.title);
      ghosts.push({
        id,
        title: entry.title,
        route: entry.route,
        sectionId: entry.sectionId,
        rationale: entry.rationale,
        source: 'sitemap.md',
      });
    }

    // ── By URL: sort all nodes by route alphabetically.
    const byUrl: SitemapNode[] = [
      ...real.map(realNode),
      ...ghosts.map(ghostNode),
    ].sort((a, b) => (a.route ?? '').localeCompare(b.route ?? ''));

    // ── By Section: sections come from project.config first, with a
    // trailing "(unassigned)" bucket for anything not placed.
    const configSections = project?.config.sections ?? [];
    const sectionOrder = new Map<string, number>(
      configSections.map((s, i) => [s.id, i]),
    );
    const labelBySection = new Map<string, string>(
      configSections.map((s) => [s.id, s.label]),
    );

    // Derive section membership:
    //  1. Real screens: prefer `screen.sections`; fall back to `section.screenIds`.
    //  2. Ghosts: use the sitemap's `## Section:` heading.
    const realBySection = new Map<string, ScreenDefinition[]>();
    const ghostsBySection = new Map<string, GhostScreen[]>();
    const unassignedReal: ScreenDefinition[] = [];
    const unassignedGhosts: GhostScreen[] = [];

    for (const screen of real) {
      const ids = new Set<string>(screen.sections ?? []);
      // fallback: any section that names this screen via screenIds
      for (const s of configSections) {
        if (s.screenIds.includes(screen.id)) ids.add(s.id);
      }
      if (ids.size === 0) {
        unassignedReal.push(screen);
      } else {
        for (const id of ids) {
          const arr = realBySection.get(id) ?? [];
          arr.push(screen);
          realBySection.set(id, arr);
        }
      }
    }
    for (const g of ghosts) {
      if (g.sectionId && sectionOrder.has(g.sectionId)) {
        const arr = ghostsBySection.get(g.sectionId) ?? [];
        arr.push(g);
        ghostsBySection.set(g.sectionId, arr);
      } else {
        unassignedGhosts.push(g);
      }
    }

    const bySection: SitemapNode[] = configSections.map((s) => ({
      id: `section:${s.id}`,
      label: labelBySection.get(s.id) ?? s.id,
      kind: 'section' as const,
      children: [
        ...(realBySection.get(s.id) ?? []).map(realNode),
        ...(ghostsBySection.get(s.id) ?? []).map(ghostNode),
      ].sort((a, b) => (a.route ?? '').localeCompare(b.route ?? '')),
    }));

    if (unassignedReal.length || unassignedGhosts.length) {
      bySection.push({
        id: 'section:__unassigned__',
        label: '(unassigned)',
        kind: 'section',
        children: [
          ...unassignedReal.map(realNode),
          ...unassignedGhosts.map(ghostNode),
        ].sort((a, b) => (a.route ?? '').localeCompare(b.route ?? '')),
      });
    }

    return {
      loading,
      exists,
      error,
      real,
      ghosts,
      byUrl,
      bySection,
    };
  }, [projectId, raw, loading, exists, error]);
}
