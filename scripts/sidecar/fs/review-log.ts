/**
 * Append-only review log.
 *
 * Every status change recorded by the sidecar appends one line to
 * `Projects/<id>/docs/review-log.md`. The file is created on first write.
 * Lines are markdown-friendly so the file remains human-readable.
 */

import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function appendReviewLog(
  projectRoot: string,
  entry: { screenId: string; previousStatus: string; newStatus: string; actor?: string },
): string {
  const path = join(projectRoot, 'docs', 'review-log.md');
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(path)) {
    writeFileSync(path, '# Review log\n\nAppend-only history of screen status transitions.\n\n', 'utf8');
  }
  const stamp = new Date().toISOString();
  const actor = entry.actor ? ` by ${entry.actor}` : '';
  const line = `- ${stamp} — \`${entry.screenId}\`: ${entry.previousStatus} → **${entry.newStatus}**${actor}\n`;
  appendFileSync(path, line, 'utf8');
  return path;
}
