import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useSitemap, type SitemapNode } from '@framework/sitemap';
import type { ScreenStatus } from '@framework/types';
import { TreeView, type TreeNodeShape } from '@shell/common/TreeView';

type View = 'by-url' | 'by-section';

/**
 * Left-panel Sitemap tab.
 *
 * Two subviews:
 *   - By URL  — flat list sorted by route.
 *   - By Section — grouped by `project.config.ts` sections with an
 *                  "(unassigned)" bucket for leftovers.
 *
 * Clicking a real screen or a ghost navigates the viewport to its route;
 * the right-panel inspector carries the detailed metadata.
 */
export function SitemapTab({ query }: { query: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sitemap = useSitemap();
  const [view, setView] = useState<View>('by-section');

  const filteredByUrl = useMemo(
    () => filterNodes(sitemap.byUrl, query),
    [sitemap.byUrl, query],
  );
  const filteredBySection = useMemo(
    () => filterNodes(sitemap.bySection, query),
    [sitemap.bySection, query],
  );

  const source = view === 'by-url' ? filteredByUrl : filteredBySection;
  const treeNodes = useMemo(() => source.map(toTreeShape), [source]);
  const selectedId = useMemo(
    () => findIdByRoute(source, location.pathname),
    [source, location.pathname],
  );

  const handleSelect = (_id: string, node: TreeNodeShape) => {
    const sitemapNode = findNode(source, node.id);
    if (!sitemapNode) return;
    if (sitemapNode.kind === 'section') return; // section headers are just groupers
    if (sitemapNode.route) {
      navigate(sitemapNode.route);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-shell-border bg-shell-bg/40 px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-medium uppercase tracking-wider text-shell-muted/70">
            View
          </span>
          <div className="inline-flex overflow-hidden rounded border border-shell-border text-[10px]">
            <SegmentedButton
              active={view === 'by-section'}
              onClick={() => setView('by-section')}
            >
              Section
            </SegmentedButton>
            <SegmentedButton
              active={view === 'by-url'}
              onClick={() => setView('by-url')}
            >
              URL
            </SegmentedButton>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <GhostIndicator count={sitemap.ghosts.length} />
          <LegendPopover />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {sitemap.loading ? (
          <div className="px-2 py-4 text-xs text-shell-muted">Loading sitemap…</div>
        ) : sitemap.error ? (
          <div className="px-2 py-4 text-xs text-rose-400">
            Failed to load sitemap: {sitemap.error}
          </div>
        ) : (
          <TreeView
            nodes={treeNodes}
            selectedId={selectedId}
            onSelect={handleSelect}
            emptyMessage={
              query
                ? 'No matches for that search.'
                : 'No screens or ghost entries match this view.'
            }
          />
        )}
      </div>

      {!sitemap.exists && !sitemap.loading && (
        <div className="border-t border-shell-border bg-shell-bg px-3 py-2 text-[11px] leading-snug text-shell-muted">
          No <code>docs/sitemap.md</code> found. Add one to surface ghost
          screens. Phase 10&apos;s <code>sitemap-planner</code> agent can scaffold it.
        </div>
      )}
    </div>
  );
}

// ─── presentational bits ────────────────────────────────────────────

function SegmentedButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-2 py-0.5 text-[10px] transition-colors',
        active
          ? 'bg-shell-accent/20 text-shell-accent'
          : 'bg-transparent text-shell-muted hover:bg-white/5',
      )}
    >
      {children}
    </button>
  );
}

function GhostIndicator({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-shell-muted"
      title={`${count} proposed screen${count === 1 ? '' : 's'} from docs/sitemap.md, not yet implemented`}
    >
      <span aria-hidden>✨</span>
      <span>{count} proposed</span>
    </span>
  );
}

const STATUS_LEGEND: Array<{ status: ScreenStatus | 'ghost'; label: string; hint: string }> = [
  { status: 'draft', label: 'Draft', hint: 'Work in progress, not reviewed yet' },
  { status: 'in-review', label: 'In review', hint: 'Awaiting feedback' },
  { status: 'approved', label: 'Approved', hint: 'Sign-off received' },
  { status: 'shipped', label: 'Shipped', hint: 'Implemented in production' },
  { status: 'deprecated', label: 'Deprecated', hint: 'Retired — kept for reference' },
  { status: 'ghost', label: 'Proposed (ghost)', hint: 'Authored in sitemap.md, not built yet' },
];

function LegendPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Status legend"
        title="Status legend"
        className="flex h-4 w-4 items-center justify-center rounded border border-shell-border text-[10px] text-shell-muted hover:border-shell-accent hover:text-shell-accent"
      >
        ?
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded border border-shell-border bg-shell-bg p-2 shadow-lg">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-shell-muted">
            Screen status
          </div>
          <ul className="space-y-1">
            {STATUS_LEGEND.map((row) => (
              <li key={row.status} className="flex items-start gap-2 text-[11px]">
                <span className="mt-1 shrink-0">
                  <StatusDot status={row.status === 'ghost' ? undefined : row.status} />
                </span>
                <div className="min-w-0">
                  <div className="text-shell-text">{row.label}</div>
                  <div className="text-[10px] leading-snug text-shell-muted">
                    {row.hint}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status?: ScreenStatus }) {
  const color =
    status === 'shipped'
      ? 'bg-emerald-500'
      : status === 'approved'
        ? 'bg-sky-500'
        : status === 'in-review'
          ? 'bg-amber-500'
          : status === 'draft'
            ? 'bg-zinc-400'
            : status === 'deprecated'
              ? 'bg-rose-500'
              : 'bg-transparent border border-dashed border-shell-muted';
  return (
    <span
      className={clsx('inline-block h-1.5 w-1.5 rounded-full align-middle', color)}
      aria-label={status ?? 'ghost'}
      title={status ?? 'ghost'}
    />
  );
}

function toTreeShape(node: SitemapNode): TreeNodeShape {
  return {
    id: node.id,
    label: node.kind === 'ghost' ? `✨ ${node.label}` : node.label,
    sublabel: node.sublabel,
    leading: node.kind === 'section' ? null : <StatusDot status={node.status} />,
    rowClassName:
      node.kind === 'ghost'
        ? 'text-shell-muted italic'
        : node.kind === 'section'
          ? 'text-[10px] uppercase tracking-wider text-shell-muted'
          : undefined,
    children: node.children?.map(toTreeShape),
  };
}

function filterNodes(nodes: SitemapNode[], query: string): SitemapNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const match = (n: SitemapNode): boolean =>
    n.label.toLowerCase().includes(q) ||
    (n.route?.toLowerCase().includes(q) ?? false) ||
    (n.screenId?.toLowerCase().includes(q) ?? false);
  const prune = (list: SitemapNode[]): SitemapNode[] => {
    const out: SitemapNode[] = [];
    for (const n of list) {
      const kids = n.children ? prune(n.children) : undefined;
      if (match(n) || (kids && kids.length > 0)) {
        const cloned: SitemapNode = { ...n };
        if (kids) cloned.children = kids;
        out.push(cloned);
      }
    }
    return out;
  };
  return prune(nodes);
}

function findNode(nodes: SitemapNode[], id: string): SitemapNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

function findIdByRoute(nodes: SitemapNode[], route: string): string | undefined {
  for (const n of nodes) {
    if (n.route === route && n.kind !== 'section') return n.id;
    if (n.children) {
      const hit = findIdByRoute(n.children, route);
      if (hit) return hit;
    }
  }
  return undefined;
}
