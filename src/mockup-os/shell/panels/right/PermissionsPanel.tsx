import clsx from 'clsx';
import { useBuilderStore } from '@framework/store';
import { usePermission, useScreenPermissions } from '@framework/permissions';
import type { Permission, PermissionMode } from '@framework/types';

/**
 * Right-panel accordion listing every permission the current screen opts
 * into. Each row is a live toggle: flipping `granted` (or changing `mode`)
 * causes any screen using `usePermission(id)` to re-render immediately.
 *
 * If the screen declares no permissions, the panel is hidden entirely so
 * we don't clutter the inspector with an empty section.
 */
export function PermissionsPanel({ screenId }: { screenId: string | undefined }) {
  const permissions = useScreenPermissions(screenId);
  if (permissions.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-shell-muted">
        Permissions
      </div>
      <div className="flex flex-col gap-2">
        {permissions.map((p) => (
          <PermissionRow key={p.id} permission={p} />
        ))}
      </div>
    </section>
  );
}

function PermissionRow({ permission }: { permission: Permission }) {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const effective = usePermission(permission.id);
  const setGranted = useBuilderStore((s) => s.setPermissionGranted);
  const setMode = useBuilderStore((s) => s.setPermissionMode);

  if (!projectId) return null;

  return (
    <div className="rounded border border-shell-border bg-shell-bg px-2.5 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-shell-text">
            {permission.label}
          </div>
          <div className="font-mono text-[10px] text-shell-muted">{permission.id}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={effective.granted}
          onClick={() => setGranted(projectId, permission.id, !effective.granted)}
          className={clsx(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
            effective.granted ? 'bg-emerald-500' : 'bg-shell-border',
          )}
        >
          <span
            className={clsx(
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              effective.granted ? 'translate-x-[18px]' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>

      {permission.description && (
        <div className="mt-1 text-[11px] leading-snug text-shell-muted">
          {permission.description}
        </div>
      )}

      {!effective.granted && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-shell-muted">
            When denied
          </span>
          <select
            value={effective.mode}
            onChange={(e) => setMode(projectId, permission.id, e.target.value as PermissionMode)}
            className="rounded border border-shell-border bg-shell-panel px-1.5 py-0.5 text-[11px] text-shell-text focus:border-shell-accent focus:outline-none"
          >
            {permission.modes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
