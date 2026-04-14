import { describe, expect, it } from 'vitest';
import { parseSitemap } from '@framework/sitemap';

describe('parseSitemap', () => {
  it('parses real and ghost entries with rationale', () => {
    const raw = `
# Sitemap

## Section: overview

- /app — Overview ✅ app.overview
- /app/notifications — Notifications ✨ proposed
  - Why: inbox for balance alerts

## Section: accounts

- /app/accounts — Accounts ✅ app.accounts.list
- /app/accounts/:id/txs — Transactions ✨ proposed
  - Why: drill-down from account detail
`;
    const { sections, entries } = parseSitemap(raw);
    expect(sections.map((s) => s.id)).toEqual(['overview', 'accounts']);

    const overview = sections[0];
    expect(overview.entries).toHaveLength(2);
    expect(overview.entries[0]).toMatchObject({
      route: '/app',
      title: 'Overview',
      kind: 'real',
      screenId: 'app.overview',
      sectionId: 'overview',
    });
    expect(overview.entries[1]).toMatchObject({
      route: '/app/notifications',
      title: 'Notifications',
      kind: 'ghost',
      rationale: 'inbox for balance alerts',
      sectionId: 'overview',
    });

    const accounts = sections[1];
    expect(accounts.entries[1]).toMatchObject({
      route: '/app/accounts/:id/txs',
      kind: 'ghost',
      rationale: 'drill-down from account detail',
    });

    expect(entries).toHaveLength(4);
  });

  it('tolerates malformed lines and missing rationale', () => {
    const raw = `
## Section: misc

- /a — A ✅ a
- nonsense line that should be ignored
- /b — B ✨ proposed
`;
    const { entries } = parseSitemap(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0].screenId).toBe('a');
    expect(entries[1].kind).toBe('ghost');
    expect(entries[1].rationale).toBeUndefined();
  });

  it('produces an empty result on empty input', () => {
    const { sections, entries } = parseSitemap('');
    expect(sections).toEqual([]);
    expect(entries).toEqual([]);
  });

  it('ignores entries declared before the first section heading', () => {
    // By design: entries outside a section go into `all` but with no
    // sectionId, and do not appear in `sections[].entries`.
    const raw = `
- /orphan — Orphan ✨ proposed

## Section: real
- /x — X ✅ x
`;
    const { sections, entries } = parseSitemap(raw);
    expect(sections).toHaveLength(1);
    expect(sections[0].entries).toHaveLength(1);
    expect(entries).toHaveLength(2);
    expect(entries[0].sectionId).toBeUndefined();
  });
});
