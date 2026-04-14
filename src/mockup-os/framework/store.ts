/**
 * Global builder state.
 *
 * Zustand holds only *builder* concerns (shell visibility, viewport, the
 * currently selected state). Mockup screens should never depend on this
 * store — that would couple product code to the shell and break
 * presentation mode.
 */

import { create } from 'zustand';
import { getDefaultProjectId } from './projects';
import type { PermissionMode, ScreenStatus } from './types';

export type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'full';

export type LeftPanelTab = 'sitemap' | 'journeys' | 'patterns' | 'data' | 'brief';

export interface PermissionOverride {
  granted: boolean;
  mode: PermissionMode;
}

export const VIEWPORT_SIZES: Record<ViewportSize, { width: number | null; label: string }> = {
  mobile: { width: 390, label: 'Mobile · 390' },
  tablet: { width: 820, label: 'Tablet · 820' },
  desktop: { width: 1280, label: 'Desktop · 1280' },
  full: { width: null, label: 'Full' },
};

interface BuilderState {
  shellVisible: boolean;
  presentationMode: boolean;
  viewport: ViewportSize;
  /** Selected state id per screen. Keyed by screen id. */
  selectedStateByScreen: Record<string, string>;
  /** Currently active project id. Drives which registry the shell sees. */
  activeProjectId: string | undefined;
  /**
   * Per-project permission overrides. An absent entry means "use the
   * permission's config defaults". The Right-panel toggles write here; the
   * `usePermission` hook reads here + config to produce the effective value.
   */
  permissionOverrides: Record<string, Record<string, PermissionOverride>>;
  /**
   * Per-project optimistic status override, written by the Right-panel
   * status dropdown immediately after a sidecar write succeeds. Cleared
   * when Vite HMR refreshes the underlying registry value. This stops
   * the badge "jumping back" during the ~1s between network success and
   * module reload.
   */
  optimisticStatus: Record<string, Record<string, ScreenStatus>>;
  /** Active tab in the LeftPanel — lifted here so other panes can drive it. */
  leftPanelTab: LeftPanelTab;

  toggleShell: () => void;
  togglePresentation: () => void;
  setShellVisible: (visible: boolean) => void;
  setViewport: (v: ViewportSize) => void;
  setSelectedState: (screenId: string, stateId: string) => void;
  setActiveProject: (projectId: string) => void;
  setPermissionGranted: (projectId: string, permissionId: string, granted: boolean) => void;
  setPermissionMode: (projectId: string, permissionId: string, mode: PermissionMode) => void;
  resetPermission: (projectId: string, permissionId: string) => void;
  setOptimisticStatus: (projectId: string, screenId: string, status: ScreenStatus) => void;
  clearOptimisticStatus: (projectId: string, screenId: string) => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  shellVisible: true,
  presentationMode: false,
  viewport: 'full',
  selectedStateByScreen: {},
  activeProjectId: getDefaultProjectId(),
  permissionOverrides: {},
  optimisticStatus: {},
  leftPanelTab: 'sitemap',

  toggleShell: () =>
    set((s) => {
      const nextVisible = !s.shellVisible;
      return {
        shellVisible: nextVisible,
        // Revealing the shell must also clear presentation mode, otherwise
        // `hidden = !shellVisible || presentationMode` stays true and the
        // chrome never returns. Hiding clears nothing.
        presentationMode: nextVisible ? false : s.presentationMode,
      };
    }),
  togglePresentation: () =>
    set((s) => {
      const next = !s.presentationMode;
      return {
        presentationMode: next,
        // Leaving presentation mode always restores the shell.
        shellVisible: next ? s.shellVisible : true,
      };
    }),
  setShellVisible: (visible) => set({ shellVisible: visible }),
  setViewport: (viewport) => set({ viewport }),
  setSelectedState: (screenId, stateId) =>
    set((s) => ({
      selectedStateByScreen: { ...s.selectedStateByScreen, [screenId]: stateId },
    })),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
  setPermissionGranted: (projectId, permissionId, granted) =>
    set((s) => {
      const current = s.permissionOverrides[projectId]?.[permissionId];
      // Default mode stays whatever was already chosen (or the permission's
      // own defaultMode); we only touch `granted` here.
      return {
        permissionOverrides: {
          ...s.permissionOverrides,
          [projectId]: {
            ...(s.permissionOverrides[projectId] ?? {}),
            [permissionId]: {
              granted,
              mode: current?.mode ?? 'disabled',
            },
          },
        },
      };
    }),
  setPermissionMode: (projectId, permissionId, mode) =>
    set((s) => {
      const current = s.permissionOverrides[projectId]?.[permissionId];
      return {
        permissionOverrides: {
          ...s.permissionOverrides,
          [projectId]: {
            ...(s.permissionOverrides[projectId] ?? {}),
            [permissionId]: {
              granted: current?.granted ?? false,
              mode,
            },
          },
        },
      };
    }),
  resetPermission: (projectId, permissionId) =>
    set((s) => {
      const projectOverrides = { ...(s.permissionOverrides[projectId] ?? {}) };
      delete projectOverrides[permissionId];
      return {
        permissionOverrides: {
          ...s.permissionOverrides,
          [projectId]: projectOverrides,
        },
      };
    }),
  setOptimisticStatus: (projectId, screenId, status) =>
    set((s) => ({
      optimisticStatus: {
        ...s.optimisticStatus,
        [projectId]: { ...(s.optimisticStatus[projectId] ?? {}), [screenId]: status },
      },
    })),
  clearOptimisticStatus: (projectId, screenId) =>
    set((s) => {
      const per = { ...(s.optimisticStatus[projectId] ?? {}) };
      delete per[screenId];
      return {
        optimisticStatus: { ...s.optimisticStatus, [projectId]: per },
      };
    }),
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
}));
