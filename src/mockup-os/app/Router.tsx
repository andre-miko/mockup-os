/**
 * Application router.
 *
 * Routes are derived from the active project's registry so that adding a
 * screen requires exactly one declaration — no parallel route file to keep
 * in sync. Switching the active project replaces the route table.
 *
 * Product layouts wrap matching routes so each project can bring its own
 * persistent chrome (sidebar, top nav). Layouts are opt-in: if no layout
 * matches a screen's route, the screen renders bare.
 */

import { Suspense, useMemo, type ComponentType } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { getRegistry, getProjectLayouts } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import { useSitemap } from '@framework/sitemap';
import type { GhostScreen, ScreenDefinition } from '@framework/types';
import { HomeRedirect } from './HomeRedirect';
import { NotFound } from './NotFound';
import { GhostPlaceholder } from './GhostPlaceholder';

function Loading() {
  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}

interface RoutedEntry {
  key: string;
  route: string;
  element: JSX.Element;
}

function groupEntriesByLayout(
  entries: ReadonlyArray<RoutedEntry>,
  layouts: ReadonlyArray<{ prefix: string; layout: ComponentType }>,
) {
  const groups = new Map<ComponentType | null, RoutedEntry[]>();
  for (const entry of entries) {
    const match = layouts.find((l) => entry.route.startsWith(l.prefix));
    const key = match?.layout ?? null;
    const arr = groups.get(key) ?? [];
    arr.push(entry);
    groups.set(key, arr);
  }
  return groups;
}

function screenEntry(screen: ScreenDefinition): RoutedEntry {
  const Component = screen.component;
  return {
    key: `screen:${screen.id}`,
    route: screen.route,
    element: <Component />,
  };
}

function ghostEntry(ghost: GhostScreen): RoutedEntry {
  return {
    key: `ghost:${ghost.id}`,
    route: ghost.route,
    element: <GhostPlaceholder />,
  };
}

export function AppRouter() {
  const projectId = useActiveProjectId();
  const sitemap = useSitemap();
  const groups = useMemo(() => {
    const registry = getRegistry(projectId);
    const layouts = getProjectLayouts(projectId);
    const realRoutes = new Set(registry.screens.map((s) => s.route));
    const entries: RoutedEntry[] = [
      ...registry.screens.map(screenEntry),
      // Only register ghost routes that don't collide with a real screen.
      ...sitemap.ghosts
        .filter((g) => !realRoutes.has(g.route))
        .map(ghostEntry),
    ];
    return groupEntriesByLayout(entries, layouts);
  }, [projectId, sitemap.ghosts]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {[...groups.entries()].map(([Layout, entries], idx) => {
          const children = entries.map((entry) => (
            <Route key={entry.key} path={entry.route} element={entry.element} />
          ));

          if (Layout) {
            return (
              <Route key={`layout-${idx}`} element={<Layout />}>
                {children}
              </Route>
            );
          }
          return <Route key={`bare-${idx}`}>{children}</Route>;
        })}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export { Navigate };
