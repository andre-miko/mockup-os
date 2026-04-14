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
import type { ScreenDefinition } from '@framework/types';
import { HomeRedirect } from './HomeRedirect';
import { NotFound } from './NotFound';

function Loading() {
  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}

function groupByLayout(
  screens: ReadonlyArray<ScreenDefinition>,
  layouts: ReadonlyArray<{ prefix: string; layout: ComponentType }>,
) {
  const groups = new Map<ComponentType | null, ScreenDefinition[]>();
  for (const screen of screens) {
    const match = layouts.find((l) => screen.route.startsWith(l.prefix));
    const key = match?.layout ?? null;
    const arr = groups.get(key) ?? [];
    arr.push(screen);
    groups.set(key, arr);
  }
  return groups;
}

export function AppRouter() {
  const projectId = useActiveProjectId();
  const groups = useMemo(() => {
    const registry = getRegistry(projectId);
    const layouts = getProjectLayouts(projectId);
    return groupByLayout(registry.screens, layouts);
  }, [projectId]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {[...groups.entries()].map(([Layout, screens], idx) => {
          const children = screens.map((s) => {
            const Component = s.component;
            return <Route key={s.id} path={s.route} element={<Component />} />;
          });

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
