import { useState } from 'react';
import clsx from 'clsx';
import { useFixture } from '@framework/hooks';
import { useBuilderStore } from '@framework/store';
import { sidecar } from '@framework/sidecar-client';
import { useSidecarHealth } from '@framework/sidecar-hooks';
import type { ScreenDefinition } from '@framework/types';
import { JsonTree, summariseJson } from '@shell/common/JsonTree';

/**
 * Data preview for the currently-selected screen.
 *
 * Shows the data payload of every fixture the screen references. Each
 * fixture is an expandable section; once expanded, its JSON renders via
 * the shared `JsonTree` with inline editing. Edits land in the Zustand
 * store as in-memory overrides, driving live re-renders across the
 * viewport. Users can revert to the on-disk value or persist the override
 * through the sidecar.
 */
export function DataPanel({ screen }: { screen: ScreenDefinition }) {
  const fixtureIds = screen.fixtures ?? [];
  if (fixtureIds.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-shell-muted">
        Data
      </div>
      <div className="flex flex-col gap-1.5">
        {fixtureIds.map((id) => (
          <FixtureRow key={id} id={id} />
        ))}
      </div>
    </section>
  );
}

function FixtureRow({ id }: { id: string }) {
  const fixture = useFixture<unknown>(id);
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const override = useBuilderStore((s) =>
    projectId ? s.fixtureOverrides[projectId]?.[id] : undefined,
  );
  const hasOverride = useBuilderStore((s) =>
    projectId ? id in (s.fixtureOverrides[projectId] ?? {}) : false,
  );
  const setFixtureOverride = useBuilderStore((s) => s.setFixtureOverride);
  const clearFixtureOverride = useBuilderStore((s) => s.clearFixtureOverride);
  const { status: sidecarStatus } = useSidecarHealth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  // After a successful save we remember which override-reference was
  // persisted. If it still equals the live override we show "saved"
  // instead of "edited"; any further edit produces a new reference and
  // flips the badge back.
  const [savedSnapshot, setSavedSnapshot] = useState<unknown>(undefined);
  const isSaved = hasOverride && savedSnapshot !== undefined && override === savedSnapshot;

  if (!fixture) {
    return (
      <div className="rounded border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-300">
        <span className="font-mono">{id}</span> — not registered
      </div>
    );
  }

  const sidecarOnline = sidecarStatus === 'online';

  const onChange = (next: unknown) => {
    if (!projectId) return;
    setFixtureOverride(projectId, id, next);
  };

  const revert = () => {
    if (!projectId) return;
    clearFixtureOverride(projectId, id);
    setNotice(null);
  };

  const saveToDisk = async () => {
    if (!projectId || !sidecarOnline) return;
    setSaving(true);
    setNotice(null);
    const payload = fixture.data;
    const res = await sidecar.writeFixture(projectId, id, payload);
    if (res.status !== 'ok') {
      if (res.status === 'offline') {
        setNotice({ kind: 'error', text: 'Sidecar offline.' });
      } else {
        setNotice({ kind: 'error', text: `Save failed: ${res.message}` });
      }
      setSaving(false);
      return;
    }
    // Read back from disk to prove the write stuck — covers the case where
    // a write returns ok but another process truncates or rewrites the
    // file (or a user thinks "it didn't save" because they can't tell).
    const verify = await sidecar.getFixture(projectId, id);
    const expected = JSON.stringify(payload);
    const onDisk =
      verify.status === 'ok' ? JSON.stringify(verify.data.data) : undefined;
    if (onDisk !== undefined && onDisk === expected) {
      setSavedSnapshot(payload);
      setNotice({
        kind: 'info',
        text: `Saved ${res.data.bytes} bytes — verified on disk.`,
      });
    } else if (verify.status === 'ok') {
      setNotice({
        kind: 'error',
        text: 'Write reported success but the file on disk does not match.',
      });
    } else {
      setNotice({
        kind: 'info',
        text: `Saved ${res.data.bytes} bytes. Could not read back to verify (${verify.status}).`,
      });
    }
    setSaving(false);
  };

  return (
    <div
      className={clsx(
        'rounded border bg-shell-bg',
        hasOverride
          ? isSaved
            ? 'border-emerald-400/40'
            : 'border-amber-400/40'
          : 'border-shell-border',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[11px] hover:bg-white/5"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-shell-muted" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
          <span className="truncate font-mono text-shell-text">{id}</span>
          {hasOverride &&
            (isSaved ? (
              <span className="shrink-0 rounded bg-emerald-400/15 px-1 font-mono text-[9px] uppercase tracking-wider text-emerald-300">
                saved
              </span>
            ) : (
              <span className="shrink-0 rounded bg-amber-400/15 px-1 font-mono text-[9px] uppercase tracking-wider text-amber-300">
                edited
              </span>
            ))}
        </span>
        <span className="shrink-0 font-mono text-[10px] text-shell-muted">
          {summariseJson(fixture.data)}
        </span>
      </button>
      {open && (
        <div className="border-t border-shell-border p-2">
          {fixture.description && (
            <div className="mb-1.5 text-[10px] italic leading-snug text-shell-muted">
              {fixture.description}
            </div>
          )}
          <JsonTree value={fixture.data} onChange={onChange} />
          {hasOverride && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={revert}
                className="rounded border border-shell-border px-2 py-0.5 text-[10px] text-shell-text hover:bg-white/5"
              >
                Revert
              </button>
              <button
                type="button"
                onClick={saveToDisk}
                disabled={saving || !sidecarOnline}
                title={!sidecarOnline ? 'Sidecar offline — run `npm run sidecar`' : undefined}
                className={clsx(
                  'rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                  sidecarOnline && !saving
                    ? 'text-shell-text hover:bg-white/5'
                    : 'cursor-not-allowed text-shell-muted',
                )}
              >
                {saving ? 'Saving…' : 'Save to disk'}
              </button>
            </div>
          )}
          {notice && (
            <div
              className={clsx(
                'mt-2 rounded px-2 py-1 text-[10px] leading-snug',
                notice.kind === 'error'
                  ? 'border border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : 'border border-shell-border bg-white/5 text-shell-muted',
              )}
            >
              {notice.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
