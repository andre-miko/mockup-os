import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { PANEL_WIDTH } from '@framework/store';

interface PanelResizerProps {
  /** Which panel this handle resizes. Controls drag direction. */
  side: 'left' | 'right';
  /** Current pixel width of the panel. */
  width: number;
  /** Commit a new width (already the raw value — store clamps). */
  onResize: (width: number) => void;
}

/**
 * 4px vertical drag handle, positioned at the inner edge of a builder
 * panel. Dragging the left-panel handle to the right widens that panel;
 * dragging the right-panel handle to the left widens the right panel.
 */
export function PanelResizer({ side, width, onResize }: PanelResizerProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; width: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = { x: e.clientX, width };
      setDragging(true);
    },
    [width],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!startRef.current) return;
      const delta = e.clientX - startRef.current.x;
      const next = side === 'left'
        ? startRef.current.width + delta
        : startRef.current.width - delta;
      onResize(next);
    },
    [onResize, side],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // releasing may throw if capture was already lost; nothing to do.
    }
    startRef.current = null;
    setDragging(false);
  }, []);

  const onDoubleClick = useCallback(() => {
    onResize(PANEL_WIDTH[side].default);
  }, [onResize, side]);

  useEffect(() => {
    if (!dragging) return;
    const prev = document.body.style.cursor;
    document.body.style.cursor = 'col-resize';
    return () => {
      document.body.style.cursor = prev;
    };
  }, [dragging]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${side} panel`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onDoubleClick}
      className={clsx(
        'absolute top-0 bottom-0 z-10 w-1 cursor-col-resize select-none transition-colors',
        'hover:bg-shell-accent/50',
        dragging && 'bg-shell-accent',
        side === 'left' ? '-right-0.5' : '-left-0.5',
      )}
    />
  );
}
