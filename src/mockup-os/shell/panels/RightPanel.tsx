import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { getRegistry } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import { useBuilderStore } from '@framework/store';
import { sidecar } from '@framework/sidecar-client';
import type { ScreenDefinition } from '@framework/types';
import { PermissionsPanel } from './right/PermissionsPanel';
import { StatusDropdown } from './right/StatusDropdown';
import { StatesPanel } from './right/StatesPanel';
import { DataPanel } from './right/DataPanel';
import { JourneyMembership } from './right/JourneyMembership';
import { KnownGapsPanel } from './right/KnownGapsPanel';
import { InlineEdit } from './right/InlineEdit';
import { PanelResizer } from '../common/PanelResizer';

/**
 * Right-panel screen inspector.
 *
 * Accordion priority (Phase 7):
 *   Overview → States → Permissions → Data → Journey → Related → Known gaps → Components
 *
 * The Overview block (title + route + status + badges) is always on top.
 * Everything else is a self-contained panel that hides itself when there's
 * nothing to render — screens with no fixtures don't see a Data panel,
 * screens in zero journeys don't see a Journeys section, and so on.
 */

export function RightPanel() {
  const location = useLocation();
  const projectId = useActiveProjectId();
  const registry = useMemo(() => getRegistry(projectId), [projectId]);
  const width = useBuilderStore((s) => s.rightPanelWidth);
  const setWidth = useBuilderStore((s) => s.setRightPanelWidth);
  const screen = registry.getScreenByRoute(location.pathname);
  if (!screen) {
    return (
      <aside
        style={{ width }}
        className="relative shrink-0 border-l border-shell-border bg-shell-panel p-4 text-sm text-shell-muted"
      >
        No screen at this route.
        <PanelResizer side="right" width={width} onResize={setWidth} />
      </aside>
    );
  }

  return (
    <aside
      style={{ width }}
      className="relative flex shrink-0 flex-col border-l border-shell-border bg-shell-panel"
    >
      {/* Overview — title, route, status, badges */}
      <div className="border-b border-shell-border p-4">
        <div className="text-[10px] uppercase tracking-wider text-shell-muted">Screen</div>
        <ScreenTitleField screen={screen} projectId={projectId} />
        <div className="mt-0.5 font-mono text-[11px] text-shell-muted">{screen.route}</div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <StatusDropdown screen={screen} />
          <Badge>{screen.layoutFamily}</Badge>
          <Badge>{screen.viewport}</Badge>
          <Badge>v{screen.version}</Badge>
        </div>
        <div className="mt-2">
          <ScreenDescriptionField screen={screen} projectId={projectId} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm">
        <StatesPanel screen={screen} />

        <PermissionsPanel screenId={screen.id} />

        <DataPanel screen={screen} />

        <JourneyMembership screen={screen} />

        <RelatedSection screen={screen} registry={registry} />

        <KnownGapsPanel screen={screen} />

        <ComponentsSection screen={screen} />
      </div>
      <PanelResizer side="right" width={width} onResize={setWidth} />
    </aside>
  );
}

// ─── plain sections retained from the pre-Phase-7 panel ─────────────

function RelatedSection({
  screen,
  registry,
}: {
  screen: ScreenDefinition;
  registry: ReturnType<typeof getRegistry>;
}) {
  if (screen.relatedScreens.length === 0) return null;
  // Any screen the user can already reach via a shared journey is listed in
  // JourneyMembership — filtering them here kills the duplication while
  // preserving the escape hatch for cross-journey links.
  const journeyReachable = new Set<string>();
  for (const j of registry.journeys) {
    if (j.steps.includes(screen.id)) {
      for (const step of j.steps) if (step !== screen.id) journeyReachable.add(step);
    }
  }
  const uniqueRelated = screen.relatedScreens.filter((id) => !journeyReachable.has(id));
  if (uniqueRelated.length === 0) return null;
  return (
    <Section title="Related">
      <ul className="space-y-1">
        {uniqueRelated.map((id) => {
          const rel = registry.getScreen(id);
          if (!rel) {
            return (
              <li key={id} className="text-xs text-rose-400">
                Broken link: {id}
              </li>
            );
          }
          return (
            <li key={id} className="text-xs">
              <Link to={rel.route} className="text-shell-accent hover:underline">
                {rel.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function ScreenTitleField({
  screen,
  projectId,
}: {
  screen: ScreenDefinition;
  projectId: string | undefined;
}) {
  const save = async (next: string) => {
    if (!projectId) return { ok: false as const, message: 'No active project.' };
    const trimmed = next.trim();
    if (!trimmed) return { ok: false as const, message: 'Title can’t be empty.' };
    const res = await sidecar.setScreenField(projectId, screen.id, 'title', trimmed);
    if (res.status === 'ok') return { ok: true as const };
    return {
      ok: false as const,
      message:
        res.status === 'offline' ? 'Sidecar offline — run `npm run sidecar`.' : res.message,
    };
  };
  return (
    <InlineEdit
      value={screen.title}
      onSave={save}
      displayClassName="text-sm font-semibold"
      title="Click to rename"
    />
  );
}

function ScreenDescriptionField({
  screen,
  projectId,
}: {
  screen: ScreenDefinition;
  projectId: string | undefined;
}) {
  const save = async (next: string) => {
    if (!projectId) return { ok: false as const, message: 'No active project.' };
    const res = await sidecar.setScreenField(projectId, screen.id, 'description', next);
    if (res.status === 'ok') return { ok: true as const };
    return {
      ok: false as const,
      message:
        res.status === 'offline' ? 'Sidecar offline — run `npm run sidecar`.' : res.message,
    };
  };
  return (
    <InlineEdit
      value={screen.description}
      onSave={save}
      multiline
      emptyLabel="Click to add a description…"
      displayClassName="text-xs text-shell-muted"
      title="Click to edit description"
    />
  );
}

function ComponentsSection({ screen }: { screen: ScreenDefinition }) {
  if (screen.components.length === 0) return null;
  return (
    <Section title="Components">
      <ul className="space-y-0.5">
        {screen.components.map((c) => (
          <li key={c.id} className="font-mono text-[11px] text-shell-muted">
            {c.name}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-shell-muted">
        {title}
      </div>
      {children}
    </section>
  );
}

function Badge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'info' | 'warn' | 'blocker';
}) {
  const toneClass =
    tone === 'blocker'
      ? 'bg-rose-500/15 text-rose-300'
      : tone === 'warn'
        ? 'bg-amber-500/15 text-amber-300'
        : tone === 'info'
          ? 'bg-sky-500/15 text-sky-300'
          : 'bg-white/5 text-shell-muted';
  return (
    <span
      className={clsx(
        'rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        toneClass,
      )}
    >
      {children}
    </span>
  );
}
