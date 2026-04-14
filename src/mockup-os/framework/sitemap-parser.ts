/**
 * Pure parser for `docs/sitemap.md`. No React, no DOM, no sidecar — safe
 * to import from Node scripts (`build-handoff.ts`, `build-docs.ts`) and
 * from the browser side via `framework/sitemap.ts` which adds the
 * `useSitemap` hook on top.
 *
 * Grammar (kept intentionally narrow):
 *
 *     # Sitemap
 *
 *     ## Section: <section-id>
 *     - /route — Title ✅ <screen.id>
 *     - /route — Title ✨ proposed
 *       - Why: free-form rationale
 */

export interface ParsedSitemapEntry {
  route: string;
  title: string;
  kind: 'real' | 'ghost';
  /** Only present on `kind: 'real'` entries. */
  screenId?: string;
  /** Only present on `kind: 'ghost'` entries. */
  rationale?: string;
  sectionId?: string;
}

export interface ParsedSitemapSection {
  id: string;
  entries: ParsedSitemapEntry[];
}

export interface ParsedSitemap {
  sections: ParsedSitemapSection[];
  entries: ParsedSitemapEntry[];
}

const SECTION_RE = /^##\s+Section:\s*(\S[^\n]*)$/;
const ENTRY_RE = /^-\s+(\/\S*)\s+—\s+(.+?)\s+(✅|✨)\s*([^\n]*)$/u;
const WHY_RE = /^\s+-\s+Why:\s+(.+)$/;

export function parseSitemap(raw: string): ParsedSitemap {
  const sections: ParsedSitemapSection[] = [];
  const all: ParsedSitemapEntry[] = [];

  let currentSection: ParsedSitemapSection | null = null;
  let lastGhost: ParsedSitemapEntry | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      const id = sectionMatch[1].trim().replace(/\s+/g, '-').toLowerCase();
      currentSection = { id, entries: [] };
      sections.push(currentSection);
      lastGhost = null;
      continue;
    }

    const entryMatch = line.match(ENTRY_RE);
    if (entryMatch) {
      const [, route, title, marker, tail] = entryMatch;
      const entry: ParsedSitemapEntry = {
        route: route.trim(),
        title: title.trim(),
        kind: marker === '✅' ? 'real' : 'ghost',
        sectionId: currentSection?.id,
      };
      if (marker === '✅') {
        const id = tail.trim();
        if (id) entry.screenId = id;
        lastGhost = null;
      } else {
        lastGhost = entry;
      }
      all.push(entry);
      if (currentSection) currentSection.entries.push(entry);
      continue;
    }

    const whyMatch = line.match(WHY_RE);
    if (whyMatch && lastGhost) {
      lastGhost.rationale = whyMatch[1].trim();
      continue;
    }
  }

  return { sections, entries: all };
}
