import { useMemo } from 'react';
import clsx from 'clsx';
import { useLocation } from 'react-router-dom';
import { useBuilderStore, VIEWPORT_SIZES, type ViewportSize } from '@framework/store';
import { getRegistry } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import { ProjectPicker } from './ProjectPicker';
import { SidecarStatus } from './SidecarStatus';

const VP_ORDER: ViewportSize[] = ['mobile', 'tablet', 'desktop', 'full'];

export function TopBar() {
  const location = useLocation();
  const projectId = useActiveProjectId();
  const registry = useMemo(() => getRegistry(projectId), [projectId]);
  const viewport = useBuilderStore((s) => s.viewport);
  const setViewport = useBuilderStore((s) => s.setViewport);
  const togglePresentation = useBuilderStore((s) => s.togglePresentation);
  const toggleShell = useBuilderStore((s) => s.toggleShell);

  const active = registry.getScreenByRoute(location.pathname);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-shell-border bg-shell-panel px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-shell-accent" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">Mockup OS</span>
        </div>
        <ProjectPicker />
        <span className="text-shell-muted">/</span>
        <span className="text-sm text-shell-muted">
          {active ? active.title : 'No screen'}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {VP_ORDER.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setViewport(v)}
            className={clsx(
              'rounded px-2 py-1 text-xs transition-colors',
              viewport === v
                ? 'bg-shell-accent/20 text-shell-accent'
                : 'text-shell-muted hover:bg-white/5 hover:text-shell-text',
            )}
          >
            {VIEWPORT_SIZES[v].label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <SidecarStatus />
        <button
          type="button"
          onClick={togglePresentation}
          className="rounded border border-shell-border px-2 py-1 text-xs text-shell-muted hover:text-shell-text"
          title="Toggle presentation mode (P)"
        >
          Present
        </button>
        <button
          type="button"
          onClick={toggleShell}
          className="rounded border border-shell-border px-2 py-1 text-xs text-shell-muted hover:text-shell-text"
          title="Hide shell (H)"
        >
          Hide shell
        </button>
      </div>
    </header>
  );
}
