import { describe, expect, it } from 'vitest';
import {
  JourneyParseError,
  mergeJourneys,
  parseJourneyMarkdown,
} from '@framework/journeys';

describe('parseJourneyMarkdown', () => {
  it('parses frontmatter, description, and numbered steps', () => {
    const raw = `---
id: a.flow
title: A Flow
group: a
---
First paragraph of description.

Second paragraph.

## Steps

1. a.first
2. a.second
3. a.third
`;
    const j = parseJourneyMarkdown(raw, 'a-flow.md');
    expect(j.id).toBe('a.flow');
    expect(j.title).toBe('A Flow');
    expect(j.group).toBe('a');
    expect(j.source).toBe('markdown');
    expect(j.steps).toEqual(['a.first', 'a.second', 'a.third']);
    expect(j.description).toContain('First paragraph');
    expect(j.description).toContain('Second paragraph');
  });

  it('accepts dashed bullets and trailing commentary on each step', () => {
    const raw = `---
id: b.flow
title: B
---

## Steps
- b.one  # entry point
- b.two — review screen
- b.three
`;
    const j = parseJourneyMarkdown(raw);
    expect(j.steps).toEqual(['b.one', 'b.two', 'b.three']);
  });

  it('throws when frontmatter is missing', () => {
    expect(() => parseJourneyMarkdown('## Steps\n- a.one')).toThrow(JourneyParseError);
  });

  it('throws when id or title is missing', () => {
    expect(() =>
      parseJourneyMarkdown(`---
title: only title
---
`),
    ).toThrow(/missing `id`/);
    expect(() =>
      parseJourneyMarkdown(`---
id: only.id
---
`),
    ).toThrow(/missing `title`/);
  });

  it('returns empty steps when no Steps heading is present', () => {
    const raw = `---
id: empty.flow
title: Empty
---

Just a description, no steps yet.
`;
    const j = parseJourneyMarkdown(raw);
    expect(j.steps).toEqual([]);
  });
});

describe('mergeJourneys', () => {
  const ts = [
    { id: 'a', title: 'A (ts)', description: '', steps: [] },
    { id: 'b', title: 'B (ts)', description: '', steps: [] },
  ];
  const md = [{ id: 'a', title: 'A (md)', description: '', steps: ['x'], source: 'markdown' as const }];

  it('lets markdown win on id conflict', () => {
    const merged = mergeJourneys(md, ts);
    const a = merged.find((j) => j.id === 'a')!;
    expect(a.title).toBe('A (md)');
    expect(a.source).toBe('markdown');
  });

  it('keeps TS-only entries', () => {
    const merged = mergeJourneys(md, ts);
    const b = merged.find((j) => j.id === 'b')!;
    expect(b.title).toBe('B (ts)');
    expect(b.source).toBe('ts');
  });

  it('orders markdown entries first, then TS-only ones', () => {
    const merged = mergeJourneys(md, ts);
    expect(merged.map((j) => j.id)).toEqual(['a', 'b']);
  });
});
