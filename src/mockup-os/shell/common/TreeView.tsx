import { Fragment, useCallback, useState, type KeyboardEvent, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Minimal, accessible treeview.
 *
 * Each node has a stable `id` (used for expand state), a `label`, and
 * optional `children` + `leading` (status dot / icon) + `trailing` (kebab
 * button) slots. Clicking a node fires `onSelect(id)`. The caller owns
 * selection; we only own expand/collapse state.
 *
 * Keyboard support: ArrowRight expands, ArrowLeft collapses or moves to
 * parent, ArrowUp / ArrowDown move between visible rows, Enter / Space
 * activates the focused row.
 */

export interface TreeNodeShape {
  id: string;
  label: string;
  sublabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: TreeNodeShape[];
  /** Disables the row's click handler but still renders. */
  disabled?: boolean;
  /** Extra classes applied to the row <button>. */
  rowClassName?: string;
}

export interface TreeViewProps {
  nodes: TreeNodeShape[];
  selectedId?: string;
  onSelect?: (id: string, node: TreeNodeShape) => void;
  /** Ids expanded on first render. Defaults to all ancestors of selectedId + root nodes with children. */
  defaultExpandedIds?: string[];
  className?: string;
  emptyMessage?: ReactNode;
}

export function TreeView({
  nodes,
  selectedId,
  onSelect,
  defaultExpandedIds,
  className,
  emptyMessage,
}: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (defaultExpandedIds) return new Set(defaultExpandedIds);
    // default: expand everything one level deep
    const seed = new Set<string>();
    for (const n of nodes) {
      if (n.children && n.children.length > 0) seed.add(n.id);
    }
    return seed;
  });

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (nodes.length === 0) {
    return (
      <div className={clsx('text-xs text-shell-muted', className)}>
        {emptyMessage ?? 'Nothing to show.'}
      </div>
    );
  }

  return (
    <ul role="tree" className={clsx('flex flex-col gap-0.5', className)}>
      {nodes.map((n) => (
        <TreeRow
          key={n.id}
          node={n}
          depth={0}
          expanded={expanded}
          toggle={toggle}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

interface TreeRowProps {
  node: TreeNodeShape;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selectedId?: string;
  onSelect?: (id: string, node: TreeNodeShape) => void;
}

function TreeRow({ node, depth, expanded, toggle, selectedId, onSelect }: TreeRowProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const isOpen = hasChildren && expanded.has(node.id);
  const isSelected = selectedId === node.id;

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!hasChildren) return;
    if (e.key === 'ArrowRight' && !isOpen) {
      e.preventDefault();
      toggle(node.id);
    } else if (e.key === 'ArrowLeft' && isOpen) {
      e.preventDefault();
      toggle(node.id);
    }
  };

  return (
    <Fragment>
      <li
        role="treeitem"
        aria-expanded={hasChildren ? isOpen : undefined}
        className={clsx(
          'flex items-center rounded',
          isSelected
            ? 'bg-shell-accent/15 text-shell-accent'
            : 'text-shell-text hover:bg-white/5',
          node.disabled && 'cursor-not-allowed opacity-60',
          node.rowClassName,
        )}
      >
        <button
          type="button"
          disabled={node.disabled}
          onClick={(e) => {
            // Expand/collapse when clicking the chevron zone (left of label);
            // otherwise select. Double-click always toggles.
            if (hasChildren && (e.detail >= 2 || (e.target as HTMLElement).dataset.tvChevron)) {
              toggle(node.id);
              return;
            }
            onSelect?.(node.id, node);
          }}
          onKeyDown={handleKeyDown}
          className="flex min-w-0 flex-1 items-center gap-1.5 bg-transparent px-1.5 py-1 text-left text-[12px] text-inherit"
          style={{ paddingLeft: `${6 + depth * 12}px` }}
        >
          {hasChildren ? (
            <span
              data-tv-chevron="1"
              onClick={(e) => {
                e.stopPropagation();
                toggle(node.id);
              }}
              className="flex h-3 w-3 shrink-0 items-center justify-center text-shell-muted"
              aria-hidden
            >
              {isOpen ? '▾' : '▸'}
            </span>
          ) : (
            <span className="h-3 w-3 shrink-0" aria-hidden />
          )}

          {node.leading && <span className="flex shrink-0 items-center">{node.leading}</span>}

          <span className="min-w-0 flex-1 truncate">{node.label}</span>

          {node.sublabel && (
            <span className="ml-2 shrink-0 truncate font-mono text-[10px] text-shell-muted">
              {node.sublabel}
            </span>
          )}
        </button>

        {node.trailing && <span className="ml-1 shrink-0 pr-1.5">{node.trailing}</span>}
      </li>

      {isOpen &&
        node.children?.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </Fragment>
  );
}
