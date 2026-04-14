import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useBuilderStore } from '@framework/store';
import { sidecar } from '@framework/sidecar-client';
import type { ScreenDefinition, ScreenStatus } from '@framework/types';

/**
 * Status badge that doubles as a picker.
 *
 * Clicking opens a small popover listing the five statuses; picking one
 * PATCHes through the sidecar and optimistically updates the displayed
 * value so the user sees instant feedback. The optimistic override clears
 * automatically when Vite HMR reloads the registry with the new value.
 */

const STATUSES: ScreenStatus[] = ['draft', 'in-review', 'approved', 'shipped', 'deprecated'];

const COLORS: Record<ScreenStatus, string> = {
  draft: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/40',
  'in-review': 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  approved: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  shipped: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  deprecated: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

export function StatusDropdown({ screen }: { screen: ScreenDefinition }) {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const optimistic = useBuilderStore((s) =>
    projectId ? s.optimisticStatus[projectId]?.[screen.id] : undefined,
  );
  const setOptimistic = useBuilderStore((s) => s.setOptimisticStatus);
  const clearOptimistic = useBuilderStore((s) => s.clearOptimisticStatus);

  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<ScreenStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Clear the optimistic override as soon as the registry agrees with it.
  // (Happens after Vite HMR — usually within ~1s of the POST succeeding.)
  useEffect(() => {
    if (!projectId) return;
    if (optimistic && screen.status === optimistic) {
      clearOptimistic(projectId, screen.id);
    }
  }, [projectId, optimistic, screen.status, screen.id, clearOptimistic]);

  // Close the popover on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handlePointer);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const effective = optimistic ?? screen.status;

  async function pick(next: ScreenStatus) {
    setOpen(false);
    if (!projectId || next === effective) return;
    setPending(next);
    setErr(null);
    // Flip the UI immediately; roll back on server error.
    setOptimistic(projectId, screen.id, next);
    const res = await sidecar.setScreenStatus(projectId, screen.id, next);
    setPending(null);
    if (res.status !== 'ok') {
      clearOptimistic(projectId, screen.id);
      setErr(
        res.status === 'offline'
          ? 'Sidecar offline — run `npm run sidecar`.'
          : `Failed: ${res.message}`,
      );
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
          COLORS[effective],
          pending && 'opacity-70',
        )}
        title="Change status"
      >
        {effective}
        <span aria-hidden className="text-[8px] opacity-70">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 w-40 overflow-hidden rounded border border-shell-border bg-shell-panel py-1 text-xs shadow-lg"
        >
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              disabled={s === effective}
              className={clsx(
                'flex w-full items-center justify-between px-3 py-1.5 text-left',
                s === effective
                  ? 'cursor-default text-shell-muted'
                  : 'text-shell-text hover:bg-white/5',
              )}
            >
              <span>{s}</span>
              {s === effective && <span className="text-[9px]">current</span>}
            </button>
          ))}
        </div>
      )}

      {err && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-300">
          {err}
        </div>
      )}
    </div>
  );
}
