import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export interface ContextMenuItem {
  /** Stable id for keying — also used by callers as the action name. */
  id: string;
  label: string;
  /** Optional secondary line shown smaller below the label. */
  hint?: string;
  icon?: ReactNode;
  /** Mark destructive actions; styled rose. */
  danger?: boolean;
  /** Disabled rows render but don't fire onSelect. */
  disabled?: boolean;
}

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: ContextMenuPosition;
  items: ContextMenuItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * Portal-rendered context menu. The caller controls whether it's open
 * (by deciding when to render `<ContextMenu>`). Closes on:
 *   - clicking outside
 *   - pressing Escape
 *   - selecting an item (after firing `onSelect`)
 *
 * Position is the page-coordinate where it should anchor (use right-click
 * `clientX/Y` or the kebab button's bounding rect).
 */
export function ContextMenu({ position, items, onSelect, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [adjusted, setAdjusted] = useState(position);

  // Reposition once mounted if the menu would overflow the viewport.
  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { x, y } = position;
    if (x + rect.width > vw - 8) x = Math.max(8, vw - rect.width - 8);
    if (y + rect.height > vh - 8) y = Math.max(8, vh - rect.height - 8);
    if (x !== adjusted.x || y !== adjusted.y) setAdjusted({ x, y });
  }, [position, adjusted.x, adjusted.y]);

  // Outside-click + Escape close.
  useEffect(() => {
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handlePointer);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ left: adjusted.x, top: adjusted.y }}
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border border-shell-border bg-shell-panel py-1 text-xs text-shell-text shadow-lg"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            if (item.disabled) return;
            onSelect(item.id);
            onClose();
          }}
          className={clsx(
            'flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors',
            item.disabled
              ? 'cursor-not-allowed text-shell-muted'
              : item.danger
                ? 'hover:bg-rose-500/10 hover:text-rose-300'
                : 'hover:bg-white/5',
          )}
        >
          {item.icon && <span className="shrink-0 text-shell-muted">{item.icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="truncate">{item.label}</div>
            {item.hint && <div className="truncate text-[10px] text-shell-muted">{item.hint}</div>}
          </div>
        </button>
      ))}
    </div>,
    document.body,
  );
}
