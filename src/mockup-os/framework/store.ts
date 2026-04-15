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

export const PANEL_WIDTH = {
  left: { default: 360, min: 240, max: 640 },
  right: { default: 340, min: 240, max: 640 },
} as const;

const PANEL_WIDTH_STORAGE_KEY = 'mockup-os:panel-widths';
const LEFT_PANEL_TAB_STORAGE_KEY = 'mockup-os:left-panel-tab';

const LEFT_PANEL_TABS = ['sitemap', 'journeys', 'patterns', 'data', 'brief'] as const;

function loadLeftPanelTab(): LeftPanelTab {
  if (typeof window === 'undefined') return 'sitemap';
  try {
    const raw = window.localStorage.getItem(LEFT_PANEL_TAB_STORAGE_KEY);
    if (raw && (LEFT_PANEL_TABS as readonly string[]).includes(raw)) {
      return raw as LeftPanelTab;
    }
  } catch {
    // storage unavailable — fall through.
  }
  return 'sitemap';
}

function saveLeftPanelTab(tab: LeftPanelTab): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LEFT_PANEL_TAB_STORAGE_KEY, tab);
  } catch {
    // storage disabled — the tab choice is non-critical.
  }
}

function clampPanelWidth(side: 'left' | 'right', value: number): number {
  const { min, max } = PANEL_WIDTH[side];
  if (!Number.isFinite(value)) return PANEL_WIDTH[side].default;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function loadPanelWidths(): { leftPanelWidth: number; rightPanelWidth: number } {
  const fallback = {
    leftPanelWidth: PANEL_WIDTH.left.default,
    rightPanelWidth: PANEL_WIDTH.right.default,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { left?: number; right?: number };
    return {
      leftPanelWidth: clampPanelWidth('left', parsed.left ?? fallback.leftPanelWidth),
      rightPanelWidth: clampPanelWidth('right', parsed.right ?? fallback.rightPanelWidth),
    };
  } catch {
    return fallback;
  }
}

function savePanelWidths(left: number, right: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PANEL_WIDTH_STORAGE_KEY,
      JSON.stringify({ left, right }),
    );
  } catch {
    // storage may be disabled — silent is fine, widths are cosmetic.
  }
}

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
  /**
   * Per-project in-memory fixture data overrides. When present for a
   * given fixture id, `useFixture` returns this instead of the bundled
   * registry data — mockups re-render live as the user edits values in
   * the Right-panel DataPanel. Disk is not touched unless the user
   * explicitly saves.
   */
  fixtureOverrides: Record<string, Record<string, unknown>>;
  /** Active tab in the LeftPanel — lifted here so other panes can drive it. */
  leftPanelTab: LeftPanelTab;
  /**
   * Transient focus target for the Journeys tab. Written by the right-panel
   * Journeys link so the tree can highlight and scroll the matching step.
   * Consumers read once on mount / change; writers don't need to clear it.
   */
  journeyFocus: { journeyId: string; screenId: string } | undefined;
  /** Persisted pixel widths for the left and right builder panels. */
  leftPanelWidth: number;
  rightPanelWidth: number;

  togglePresentation: () => void;
  setViewport: (v: ViewportSize) => void;
  setSelectedState: (screenId: string, stateId: string) => void;
  setActiveProject: (projectId: string) => void;
  setPermissionGranted: (projectId: string, permissionId: string, granted: boolean) => void;
  setPermissionMode: (projectId: string, permissionId: string, mode: PermissionMode) => void;
  resetPermission: (projectId: string, permissionId: string) => void;
  setOptimisticStatus: (projectId: string, screenId: string, status: ScreenStatus) => void;
  clearOptimisticStatus: (projectId: string, screenId: string) => void;
  setFixtureOverride: (projectId: string, fixtureId: string, data: unknown) => void;
  clearFixtureOverride: (projectId: string, fixtureId: string) => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  setJourneyFocus: (focus: { journeyId: string; screenId: string } | undefined) => void;
  setLeftPanelWidth: (px: number) => void;
  setRightPanelWidth: (px: number) => void;
}

const initialPanelWidths = loadPanelWidths();

export const useBuilderStore = create<BuilderState>((set) => ({
  presentationMode: false,
  viewport: 'full',
  selectedStateByScreen: {},
  activeProjectId: getDefaultProjectId(),
  permissionOverrides: {},
  optimisticStatus: {},
  fixtureOverrides: {},
  leftPanelTab: loadLeftPanelTab(),
  journeyFocus: undefined,
  leftPanelWidth: initialPanelWidths.leftPanelWidth,
  rightPanelWidth: initialPanelWidths.rightPanelWidth,

  togglePresentation: () => set((s) => ({ presentationMode: !s.presentationMode })),
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
  setFixtureOverride: (projectId, fixtureId, data) =>
    set((s) => ({
      fixtureOverrides: {
        ...s.fixtureOverrides,
        [projectId]: {
          ...(s.fixtureOverrides[projectId] ?? {}),
          [fixtureId]: data,
        },
      },
    })),
  clearFixtureOverride: (projectId, fixtureId) =>
    set((s) => {
      const per = { ...(s.fixtureOverrides[projectId] ?? {}) };
      delete per[fixtureId];
      return {
        fixtureOverrides: { ...s.fixtureOverrides, [projectId]: per },
      };
    }),
  setLeftPanelTab: (tab) => {
    saveLeftPanelTab(tab);
    set({ leftPanelTab: tab });
  },
  setJourneyFocus: (focus) => set({ journeyFocus: focus }),
  setLeftPanelWidth: (px) =>
    set((s) => {
      const next = clampPanelWidth('left', px);
      if (next === s.leftPanelWidth) return s;
      savePanelWidths(next, s.rightPanelWidth);
      return { leftPanelWidth: next };
    }),
  setRightPanelWidth: (px) =>
    set((s) => {
      const next = clampPanelWidth('right', px);
      if (next === s.rightPanelWidth) return s;
      savePanelWidths(s.leftPanelWidth, next);
      return { rightPanelWidth: next };
    }),
}));
