import { useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { getRegistry } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import type { JourneyDefinition, ScreenDefinition } from '@framework/types';
import { TreeView, type TreeNodeShape } from '@shell/common/TreeView';
import { ContextMenu, type ContextMenuPosition } from '@shell/common/ContextMenu';
import { useScreenActions, type ScreenActionId } from '@shell/screen-actions';

/**
 * Journey treeview.
 *
 * Each top-level node is a journey ("Daily check-in (3 steps)"); children
 * are its ordered steps ("Step 1 — Overview"). Right-clicking a step (or
 * clicking the kebab) opens a context menu with screen-level CRUD that
 * dispatches to the sidecar via `useScreenActions`.
 *
 * Orphan screens (registered but in no journey) bucket into a trailing
 * "(unlinked)" group so nothing silently disappears.
 */

interface MenuState {
  position: ContextMenuPosition;
  screen: ScreenDefinition;
  /** Journey id when the menu was opened from a step row. */
  journeyId?: string;
}

export function JourneysTab({ query }: { query: string }) {
  const navigate = useNavigate();
  const projectId = useActiveProjectId();
  const registry = useMemo(() => getRegistry(projectId), [projectId]);
  const actions = useScreenActions();

  const [menu, setMenu] = useState<MenuState | null>(null);

  const openMenu = (e: MouseEvent, screen: ScreenDefinition, journeyId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    // For mouse events we can use clientX/Y; for kebab clicks, fall back to
    // the button's bounding rect so the menu pins to the icon.
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX || rect.right;
    const y = e.clientY || rect.bottom;
    setMenu({ position: { x, y }, screen, journeyId });
  };

  const filteredScreens = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return registry.screens;
    return registry.screens.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.route.toLowerCase().includes(q),
    );
  }, [query, registry]);

  const tree = useMemo(
    () => buildJourneyTree(registry.journeys, registry, filteredScreens, openMenu),
    [registry, filteredScreens],
  );

  const handleSelect = (_id: string, node: TreeNodeShape) => {
    if (!node.id.startsWith('screen:')) return;
    const screenId = node.id.split('::')[0].slice('screen:'.length);
    const s = registry.getScreen(screenId);
    if (s) navigate(s.route);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <TreeView
          nodes={tree}
          onSelect={handleSelect}
          emptyMessage={query ? 'No matches.' : 'No journeys defined yet.'}
        />
      </div>

      {menu && (
        <ContextMenu
          position={menu.position}
          items={[
            { id: 'copy-id', label: 'Copy id', hint: menu.screen.id },
            { id: 'open', label: 'Open', hint: menu.screen.route },
            { id: 'duplicate', label: 'Duplicate screen' },
            {
              id: 'send-for-review',
              label: 'Send for review',
              disabled: menu.screen.status === 'in-review',
              hint:
                menu.screen.status === 'in-review'
                  ? 'already in review'
                  : `from ${menu.screen.status}`,
            },
            { id: 'delete', label: 'Delete screen', danger: true },
          ]}
          onSelect={(id) =>
            actions.dispatch(id as ScreenActionId, {
              screen: menu.screen,
              journeyId: menu.journeyId,
            })
          }
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

// ─── tree construction ───────────────────────────────────────────────

function buildJourneyTree(
  journeys: ReadonlyArray<JourneyDefinition>,
  registry: ReturnType<typeof getRegistry>,
  filteredScreens: ReadonlyArray<ScreenDefinition>,
  openMenu: (e: MouseEvent, screen: ScreenDefinition, journeyId?: string) => void,
): TreeNodeShape[] {
  const filteredSet = new Set(filteredScreens.map((s) => s.id));
  const nodes: TreeNodeShape[] = [];

  for (const j of journeys) {
    const stepScreens = j.steps
      .map((id) => registry.getScreen(id))
      .filter((s): s is ScreenDefinition => Boolean(s))
      .filter((s) => filteredSet.has(s.id));

    if (stepScreens.length === 0) continue;

    nodes.push({
      id: `journey:${j.id}`,
      label: j.title,
      sublabel: `${j.steps.length} step${j.steps.length === 1 ? '' : 's'}`,
      rowClassName: 'font-medium',
      children: stepScreens.map((s, i) => ({
        // Combine screen id with journey id so the same screen appearing
        // in multiple journeys gets a unique tree-row id.
        id: `screen:${s.id}::${j.id}`,
        label: `Step ${i + 1} — ${s.title}`,
        sublabel: s.route,
        leading: <StatusDot status={s.status} />,
        trailing: <Kebab onActivate={(e) => openMenu(e, s, j.id)} />,
      })),
    });
  }

  // Orphans — registered but not in any journey.
  const reachable = new Set<string>();
  for (const j of journeys) for (const s of j.steps) reachable.add(s);
  const orphans = filteredScreens.filter(
    (s) => s.journeys.length === 0 && !reachable.has(s.id),
  );

  if (orphans.length > 0) {
    nodes.push({
      id: 'group:unlinked',
      label: '(unlinked)',
      sublabel: `${orphans.length}`,
      rowClassName: 'text-[10px] uppercase tracking-wider text-shell-muted',
      children: orphans.map((s) => ({
        id: `screen:${s.id}`,
        label: s.title,
        sublabel: s.route,
        leading: <StatusDot status={s.status} />,
        trailing: <Kebab onActivate={(e) => openMenu(e, s)} />,
      })),
    });
  }

  return nodes;
}

// ─── presentational ──────────────────────────────────────────────────

function StatusDot({ status }: { status: ScreenDefinition['status'] }) {
  const color =
    status === 'shipped'
      ? 'bg-emerald-500'
      : status === 'approved'
        ? 'bg-sky-500'
        : status === 'in-review'
          ? 'bg-amber-500'
          : status === 'deprecated'
            ? 'bg-rose-500'
            : 'bg-zinc-400';
  return <span className={clsx('h-1.5 w-1.5 rounded-full', color)} aria-label={status} />;
}

function Kebab({ onActivate }: { onActivate: (e: MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onActivate}
      onContextMenu={(e) => {
        e.preventDefault();
        onActivate(e);
      }}
      className="flex h-5 w-5 items-center justify-center rounded text-shell-muted hover:bg-white/10 hover:text-shell-text"
      aria-label="Screen actions"
    >
      ⋮
    </button>
  );
}
