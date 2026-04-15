import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useBuilderStore } from '@framework/store';
import { projects } from '@framework/projects';
import { getRegistry } from '@framework/registry';

/**
 * Top-bar control for switching the active project. Renders as a button
 * that opens a popover menu. Switching also navigates to the destination
 * project's first screen so the viewport doesn't display "no screen at
 * this route".
 */
export function ProjectPicker() {
  const navigate = useNavigate();
  const activeProjectId = useBuilderStore((s) => s.activeProjectId);
  const setActiveProject = useBuilderStore((s) => s.setActiveProject);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  if (projects.length === 0) {
    return (
      <span className="rounded border border-shell-border px-2 py-1 text-xs text-shell-muted">
        No projects
      </span>
    );
  }

  const active =
    projects.find((p) => p.meta.id === activeProjectId) ?? projects[0];

  const pick = (id: string) => {
    setOpen(false);
    if (id === active.meta.id) return;
    setActiveProject(id);
    const first = getRegistry(id).screens[0];
    navigate(first ? first.route : '/', { replace: true });
  };

  // Single-project mode: render a static label, no need for a dropdown.
  if (projects.length === 1) {
    return (
      <span
        className="rounded border border-shell-border px-2 py-1 text-xs text-shell-text"
        title={active.meta.description}
      >
        {active.meta.name}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded border border-shell-border px-2 py-1 text-xs text-shell-text',
          'hover:bg-white/5 focus:border-shell-accent focus:outline-none',
        )}
        title={active.meta.description}
      >
        <span>{active.meta.name}</span>
        <span aria-hidden className="text-[9px] opacity-70">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-1 min-w-[14rem] overflow-hidden rounded border border-shell-border bg-shell-panel py-1 text-xs shadow-lg"
        >
          {projects.map((p) => {
            const current = p.meta.id === active.meta.id;
            return (
              <button
                key={p.meta.id}
                type="button"
                onClick={() => pick(p.meta.id)}
                disabled={current}
                className={clsx(
                  'flex w-full items-center justify-between px-3 py-1.5 text-left',
                  current
                    ? 'cursor-default text-shell-muted'
                    : 'text-shell-text hover:bg-white/5',
                )}
                title={p.meta.description}
              >
                <span className="truncate">{p.meta.name}</span>
                {current && <span className="text-[9px]">current</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
