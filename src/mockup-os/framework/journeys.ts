/**
 * Journey authoring: markdown + TS, merged by id.
 *
 * Journeys can live in either of two places:
 *
 *   1. `Projects/<id>/docs/journeys/*.md` — markdown with simple frontmatter.
 *      Preferred. Easy to edit, easy to review, parsed client- and server-side.
 *
 *   2. `Projects/<id>/mockups/index.ts` — TS `defineJourney(...)` calls.
 *      Allowed for back-compat and for projects that want journeys colocated
 *      with the screen registration. On id conflict, markdown wins.
 *
 * Format of `docs/journeys/<anything>.md`:
 *
 *     ---
 *     id: finch.daily-check
 *     title: Daily check-in
 *     group: finch
 *     ---
 *     Free-form description paragraph(s). The first paragraph before the
 *     first `## Steps` heading becomes `description`.
 *
 *     ## Steps
 *     1. finch.overview
 *     2. finch.accounts.list
 *     3. finch.accounts.detail
 *
 * Step bullets can be numbered (`1.`) or dashed (`-`); only the first
 * whitespace-delimited token after the marker is treated as the screen id,
 * so trailing commentary is allowed.
 */

import type { JourneyDefinition } from './types';

export class JourneyParseError extends Error {
  constructor(public readonly path: string, message: string) {
    super(`[journeys] ${path}: ${message}`);
    this.name = 'JourneyParseError';
  }
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const STEPS_HEADING_RE = /^##\s+Steps\s*$/;
const STEP_BULLET_RE = /^\s*(?:[-*]|\d+\.)\s+([^\s]+)/;

/**
 * Parse one markdown journey file into a `JourneyDefinition`. `path` is
 * used only for diagnostics.
 */
export function parseJourneyMarkdown(raw: string, path = '<anonymous>'): JourneyDefinition {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    throw new JourneyParseError(path, 'missing `---` frontmatter at top of file');
  }
  const frontmatter = parseFlatFrontmatter(match[1]);
  const body = raw.slice(match[0].length);

  const id = frontmatter.id;
  const title = frontmatter.title;
  if (!id) throw new JourneyParseError(path, 'frontmatter is missing `id`');
  if (!title) throw new JourneyParseError(path, 'frontmatter is missing `title`');

  // Split body at the first "## Steps" heading. Lines above become the
  // description (trimmed); lines below are step bullets.
  const lines = body.split(/\r?\n/);
  const stepsIdx = lines.findIndex((l) => STEPS_HEADING_RE.test(l));
  const descriptionLines = stepsIdx >= 0 ? lines.slice(0, stepsIdx) : lines;
  const stepLines = stepsIdx >= 0 ? lines.slice(stepsIdx + 1) : [];

  const description = descriptionLines.join('\n').trim();

  const steps: string[] = [];
  for (const line of stepLines) {
    const m = line.match(STEP_BULLET_RE);
    if (m) steps.push(m[1]);
  }

  return {
    id,
    title,
    description,
    steps,
    group: frontmatter.group,
    source: 'markdown',
  };
}

/**
 * Merge markdown-sourced journeys with TS-sourced ones. Markdown wins on
 * id conflict (we expect TS journeys to be legacy once a project adopts
 * markdown authoring).
 */
export function mergeJourneys(
  markdown: ReadonlyArray<JourneyDefinition>,
  ts: ReadonlyArray<JourneyDefinition>,
): JourneyDefinition[] {
  const byId = new Map<string, JourneyDefinition>();
  for (const j of ts) byId.set(j.id, { ...j, source: j.source ?? 'ts' });
  for (const j of markdown) byId.set(j.id, j);
  // Preserve source-order: markdown first (stable), then any TS-only additions.
  const out: JourneyDefinition[] = [];
  const seen = new Set<string>();
  for (const j of markdown) {
    if (!seen.has(j.id)) {
      out.push(byId.get(j.id)!);
      seen.add(j.id);
    }
  }
  for (const j of ts) {
    if (!seen.has(j.id)) {
      out.push(byId.get(j.id)!);
      seen.add(j.id);
    }
  }
  return out;
}

// ─── tiny flat-YAML frontmatter parser ───────────────────────────────
// We don't need a full YAML engine: the authoring contract is flat
// `key: string` pairs only. Keeping the parser inline avoids a dep and
// keeps server-side & client-side behaviour identical.

function parseFlatFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf(':');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    // Strip matching surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}
