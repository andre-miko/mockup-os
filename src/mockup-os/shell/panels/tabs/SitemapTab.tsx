import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * Real screens are coloured by `ScreenStatus`; ghosts render in grey with
 * a ✨ prefix and open a rationale drawer when clicked.
 */
export function SitemapTab({ query }: { query: string }) {
  const navigate = useNavigate();
  const sitemap = useSitemap();
  const [view, setView] = useState<View>('by-section');
  const [drawerNode, setDrawerNode] = useState<SitemapNode | null>(null);

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

  const handleSelect = (_id: string, node: TreeNodeShape) => {
    const sitemapNode = findNode(source, node.id);
    if (!sitemapNode) return;
    if (sitemapNode.kind === 'real' && sitemapNode.route) {
      navigate(sitemapNode.route);
    } else if (sitemapNode.kind === 'ghost') {
      setDrawerNode(sitemapNode);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-shell-border px-2 py-1.5">
        <div className="flex gap-0.5 text-[10px]">
          <ViewToggle active={view === 'by-section'} onClick={() => setView('by-section')}>
            By Section
          </ViewToggle>
          <ViewToggle active={view === 'by-url'} onClick={() => setView('by-url')}>
            By URL
          </ViewToggle>
        </div>
        <Legend ghostCount={sitemap.ghosts.length} />
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

      {drawerNode && (
        <GhostDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />
      )}
    </div>
  );
}

// ─── presentational bits ────────────────────────────────────────────

function ViewToggle({
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
        'rounded px-2 py-0.5 uppercase tracking-wide transition-colors',
        active
          ? 'bg-shell-accent/20 text-shell-accent'
          : 'text-shell-muted hover:bg-white/5',
      )}
    >
      {children}
    </button>
  );
}

function Legend({ ghostCount }: { ghostCount: number }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-shell-muted">
      {ghostCount > 0 && (
        <span title="Ghost screens — authored in docs/sitemap.md, not yet implemented">
          ✨ {ghostCount}
        </span>
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
      className={clsx('h-1.5 w-1.5 rounded-full', color)}
      aria-label={status ?? 'ghost'}
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

function GhostDrawer({
  node,
  onClose,
}: {
  node: SitemapNode;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-shell-border bg-shell-bg p-3 text-xs">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-shell-muted">
            Proposed screen
          </div>
          <div className="mt-0.5 text-sm font-semibold">{node.label}</div>
          <div className="font-mono text-[10px] text-shell-muted">{node.route}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-1 text-shell-muted hover:text-shell-text"
          aria-label="Close rationale"
        >
          ✕
        </button>
      </div>
      {node.rationale ? (
        <p className="mt-2 leading-snug text-shell-text">{node.rationale}</p>
      ) : (
        <p className="mt-2 text-shell-muted">
          No <code>- Why:</code> rationale in <code>sitemap.md</code>. Add one to explain what this screen is for.
        </p>
      )}
    </div>
  );
}
