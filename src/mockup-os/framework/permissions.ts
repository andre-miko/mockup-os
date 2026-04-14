/**
 * Permission integration for screens and the builder.
 *
 * Permissions are declared centrally in `project.config.ts`. Screens
 * reference them by id via `ScreenDefinition.permissions`. Authors render
 * conditionally by calling `usePermission('record.delete')` and checking
 * the returned `{ granted, mode }` — hide-vs-disable is a design choice,
 * so the framework returns both and the author wires the behaviour.
 *
 * Unknown permission ids fail *open* — `{ granted: true, mode: 'hidden' }` —
 * so a screen that asks for a permission the current project hasn't declared
 * still renders as if fully authorised. This keeps screens portable and
 * avoids accidental lockouts while a project's permission list is evolving.
 */

import { useMemo } from 'react';
import { useBuilderStore } from './store';
import { getProject } from './projects';
import type { Permission, PermissionMode } from './types';

export interface EffectivePermission {
  /** True when the user holds the permission. Render normally. */
  granted: boolean;
  /** How a denial should be expressed. Only meaningful when `granted` is false. */
  mode: PermissionMode;
  /**
   * The declared permission, if any. Present so callers can read `label` /
   * `description` when surfacing a denial message. `undefined` when the id
   * is unknown to the active project (fail-open case).
   */
  definition?: Permission;
}

const FAIL_OPEN: EffectivePermission = { granted: true, mode: 'hidden' };

/**
 * Compute effective permission state for the active project outside of a
 * React render (diagnostics, tests). Prefer `usePermission` in components.
 */
export function resolvePermission(
  projectId: string | undefined,
  permissionId: string,
): EffectivePermission {
  if (!projectId) return FAIL_OPEN;
  const project = getProject(projectId);
  const def = project?.config.permissions?.find((p) => p.id === permissionId);
  if (!def) return FAIL_OPEN;
  const override = useBuilderStore.getState().permissionOverrides[projectId]?.[permissionId];
  return {
    granted: override?.granted ?? def.default,
    mode: override?.mode ?? def.defaultMode,
    definition: def,
  };
}

/** Effective `{ granted, mode }` for a permission id in the active project. */
export function usePermission(permissionId: string): EffectivePermission {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const override = useBuilderStore(
    (s) => (projectId ? s.permissionOverrides[projectId]?.[permissionId] : undefined),
  );

  return useMemo(() => {
    if (!projectId) return FAIL_OPEN;
    const def = getProject(projectId)?.config.permissions?.find((p) => p.id === permissionId);
    if (!def) return FAIL_OPEN;
    return {
      granted: override?.granted ?? def.default,
      mode: override?.mode ?? def.defaultMode,
      definition: def,
    };
  }, [projectId, override, permissionId]);
}

/**
 * All permissions the active project declares that the given screen id
 * opts into. Used by the Right-panel permissions section. Returns an empty
 * array when the screen declares no permissions or the project has none.
 */
export function useScreenPermissions(screenId: string | undefined): Permission[] {
  const projectId = useBuilderStore((s) => s.activeProjectId);

  return useMemo(() => {
    if (!projectId || !screenId) return [];
    const project = getProject(projectId);
    if (!project) return [];
    const screen = project.screens.find((s) => s.id === screenId);
    const ids = new Set(screen?.permissions ?? []);
    if (ids.size === 0) return [];
    return (project.config.permissions ?? []).filter((p) => ids.has(p.id));
  }, [projectId, screenId]);
}
