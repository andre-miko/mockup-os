/**
 * Dispatcher for screen-level CRUD initiated from the JourneysTab context
 * menu (Phase 6B) and, soon, the Sitemap tab. The Phase 6C step wires
 * `duplicate` / `delete` / `send-for-review` to sidecar mutations; until
 * then those actions show a clear "wiring up shortly" notice rather than
 * silently doing nothing.
 *
 * `copy-id` and `open` are sync and don't need the sidecar — they ship now.
 */

import { useNavigate } from 'react-router-dom';
import { useActiveProjectId } from '@framework/hooks';
import { sidecar } from '@framework/sidecar-client';
import type { ScreenDefinition, ScreenStatus } from '@framework/types';

export type ScreenActionId =
  | 'copy-id'
  | 'open'
  | 'duplicate'
  | 'send-for-review'
  | 'delete';

export interface ScreenActionContext {
  screen: ScreenDefinition;
  journeyId?: string;
}

export interface ScreenActionsApi {
  dispatch: (id: ScreenActionId, ctx: ScreenActionContext) => Promise<void>;
}

const TOAST_DURATION_MS = 2500;

/** Drop a transient toast at the top-right. Cheap, no library. */
function toast(message: string, kind: 'info' | 'error' = 'info'): void {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    'position: fixed',
    'top: 60px',
    'right: 16px',
    'z-index: 60',
    'max-width: 320px',
    'padding: 8px 12px',
    'border-radius: 6px',
    'font-size: 12px',
    'color: #fafafa',
    `background: ${kind === 'error' ? '#9f1239' : '#27272a'}`,
    'box-shadow: 0 6px 20px rgba(0,0,0,0.35)',
    'transition: opacity 200ms',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, TOAST_DURATION_MS);
}

export function useScreenActions(): ScreenActionsApi {
  const navigate = useNavigate();
  const projectId = useActiveProjectId();

  return {
    async dispatch(id, { screen }) {
      switch (id) {
        case 'copy-id': {
          try {
            await navigator.clipboard.writeText(screen.id);
            toast(`Copied: ${screen.id}`);
          } catch {
            toast('Clipboard unavailable in this browser', 'error');
          }
          return;
        }

        case 'open': {
          navigate(screen.route);
          return;
        }

        case 'duplicate': {
          if (!projectId) return;
          const res = await sidecar.duplicateScreen(projectId, screen.id);
          if (res.status === 'ok') {
            toast(`Duplicated → ${res.data.newScreenId}. Vite will hot-reload.`);
          } else if (res.status === 'offline') {
            toast('Sidecar offline — start it with `npm run sidecar`.', 'error');
          } else {
            toast(`Duplicate failed: ${res.message}`, 'error');
          }
          return;
        }

        case 'send-for-review': {
          if (!projectId) return;
          const next: ScreenStatus = 'in-review';
          const res = await sidecar.setScreenStatus(projectId, screen.id, next);
          if (res.status === 'ok') {
            toast(`Status: ${screen.status} → ${next}`);
          } else if (res.status === 'offline') {
            toast('Sidecar offline — start it with `npm run sidecar`.', 'error');
          } else {
            toast(`Status change failed: ${res.message}`, 'error');
          }
          return;
        }

        case 'delete': {
          if (!projectId) return;
          if (!confirm(`Delete screen "${screen.id}"? This rewrites mockups/index.ts.`)) return;
          const res = await sidecar.deleteScreen(projectId, screen.id);
          if (res.status === 'ok') {
            toast(`Deleted ${screen.id}.`);
          } else if (res.status === 'offline') {
            toast('Sidecar offline — start it with `npm run sidecar`.', 'error');
          } else {
            toast(`Delete failed: ${res.message}`, 'error');
          }
          return;
        }
      }
    },
  };
}
