/**
 * React hooks exposed to mockup code.
 *
 * Mockups may reach for `useScreenState` / `useFixture` / `useScreen` to
 * react to the currently selected state and read fixture data. They must
 * not import `@framework/store` or `@framework/registry` directly — these
 * hooks abstract over the active project so the underlying registry can
 * change without screens needing to know.
 */

import { useMemo } from 'react';
import { useBuilderStore } from './store';
import { getRegistry } from './registry';
import { getProject, type ProjectMeta } from './projects';
import type { FixtureDefinition, ScreenDefinition, ScreenState } from './types';

/** The currently active project's metadata. `undefined` means no projects exist. */
export function useActiveProject(): ProjectMeta | undefined {
  const id = useBuilderStore((s) => s.activeProjectId);
  return useMemo(() => (id ? getProject(id)?.meta : undefined), [id]);
}

export function useActiveProjectId(): string | undefined {
  return useBuilderStore((s) => s.activeProjectId);
}

export function useScreen(screenId: string): ScreenDefinition | undefined {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  return useMemo(() => getRegistry(projectId).getScreen(screenId), [projectId, screenId]);
}

export function useScreenState(screenId: string): ScreenState | undefined {
  const screen = useScreen(screenId);
  const selected = useBuilderStore((s) => s.selectedStateByScreen[screenId]);
  return useMemo(() => {
    if (!screen) return undefined;
    const id = selected ?? screen.defaultStateId ?? screen.states[0]?.id;
    return screen.states.find((st) => st.id === id);
  }, [screen, selected]);
}

export function useFixture<T = unknown>(id: string): FixtureDefinition<T> | undefined {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const override = useBuilderStore((s) =>
    projectId ? s.fixtureOverrides[projectId]?.[id] : undefined,
  );
  const hasOverride = useBuilderStore((s) =>
    projectId ? id in (s.fixtureOverrides[projectId] ?? {}) : false,
  );
  return useMemo(() => {
    const base = getRegistry(projectId).getFixture(id) as FixtureDefinition<T> | undefined;
    if (!base) return undefined;
    if (!hasOverride) return base;
    return { ...base, data: override as T };
  }, [projectId, id, override, hasOverride]);
}

/** True only when the builder is presenting the mockup as a real product. */
export function useIsPresentation(): boolean {
  return useBuilderStore((s) => s.presentationMode);
}
