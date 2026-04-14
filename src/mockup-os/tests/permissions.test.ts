import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePermission, resolvePermission } from '@framework/permissions';
import { useBuilderStore } from '@framework/store';
import { projects } from '@framework/projects';

// Pick the first declared permission in any project for the happy-path checks.
const projectWithPerms = projects.find(
  (p) => (p.config.permissions ?? []).length > 0,
);
const projectId = projectWithPerms?.meta.id;
const firstPermission = projectWithPerms?.config.permissions?.[0];

beforeEach(() => {
  // Reset permission overrides between tests so state doesn't leak.
  useBuilderStore.setState({ permissionOverrides: {} });
  if (projectId) {
    useBuilderStore.setState({ activeProjectId: projectId });
  }
});

describe('usePermission', () => {
  it('fails open for unknown permission ids', () => {
    const { result } = renderHook(() => usePermission('does.not.exist'));
    expect(result.current.granted).toBe(true);
    expect(result.current.mode).toBe('hidden');
    expect(result.current.definition).toBeUndefined();
  });

  it('returns the config defaults when no override is set', () => {
    if (!firstPermission) return; // skip when the loaded fixtures have no permissions
    const { result } = renderHook(() => usePermission(firstPermission.id));
    expect(result.current.granted).toBe(firstPermission.default);
    expect(result.current.mode).toBe(firstPermission.defaultMode);
    expect(result.current.definition?.id).toBe(firstPermission.id);
  });

  it('reflects overrides live', () => {
    if (!firstPermission || !projectId) return;
    const { result } = renderHook(() => usePermission(firstPermission.id));
    act(() => {
      useBuilderStore.getState().setPermissionGranted(projectId, firstPermission.id, false);
      useBuilderStore
        .getState()
        .setPermissionMode(projectId, firstPermission.id, firstPermission.modes[0]);
    });
    expect(result.current.granted).toBe(false);
    expect(result.current.mode).toBe(firstPermission.modes[0]);
  });

  it('resolvePermission matches the hook outside of React', () => {
    if (!firstPermission || !projectId) return;
    const snapshot = resolvePermission(projectId, firstPermission.id);
    expect(snapshot.granted).toBe(firstPermission.default);
    expect(snapshot.mode).toBe(firstPermission.defaultMode);
  });
});
