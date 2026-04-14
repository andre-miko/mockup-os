import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { getRegistry } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import { sidecar } from '@framework/sidecar-client';
import { useSidecarHealth } from '@framework/sidecar-hooks';
import type { FixtureDefinition, ScreenDefinition } from '@framework/types';
import { JsonTree, summariseJson } from '@shell/common/JsonTree';

/**
 * Left-panel Data tab — fixture workbench.
 *
 * Lists every fixture in the active project, with counts of the screens
 * using each. Clicking a row expands it to reveal description, JSON
 * preview, and two actions:
 *
 *   - Upload JSON: file-picker → parse → POST `/fixtures/:id`.
 *   - Generate with AI: calls the Phase 9 stub (501 today).
 *
 * If the sidecar is offline, reads still work (registry is in-memory) but
 * writes are disabled with a tooltip. The tab never crashes if `fixtures`
 * is empty — shows a helpful empty state instead.
 */
export function DataTab({ query }: { query: string }) {
  const projectId = useActiveProjectId();
  const registry = useMemo(() => getRegistry(projectId), [projectId]);
  const { status: sidecarStatus } = useSidecarHealth();

  const fixtures = registry.fixtures;

  // Build a reverse map fixtureId → screenIds so each row can show which
  // screens reference it.
  const screensByFixture = useMemo(() => {
    const m = new Map<string, ScreenDefinition[]>();
    for (const s of registry.screens) {
      const ids = new Set<string>(s.fixtures ?? []);
      // Plus any state-level fixture bindings so we don't miss screens
      // that only swap fixtures per state.
      for (const st of s.states) for (const f of st.fixtures ?? []) ids.add(f);
      for (const id of ids) {
        const arr = m.get(id) ?? [];
        arr.push(s);
        m.set(id, arr);
      }
    }
    return m;
  }, [registry]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fixtures;
    return fixtures.filter(
      (f) =>
        f.id.toLowerCase().includes(q) ||
        (f.description?.toLowerCase().includes(q) ?? false),
    );
  }, [fixtures, query]);

  if (fixtures.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-shell-muted">
        No fixtures registered in this project.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-shell-border px-2 py-1 text-[10px] text-shell-muted">
        {fixtures.length} fixture{fixtures.length === 1 ? '' : 's'}
        {filtered.length !== fixtures.length && ` · ${filtered.length} match${filtered.length === 1 ? '' : 'es'}`}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="px-2 py-4 text-xs text-shell-muted">No matches.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((f) => (
              <FixtureCard
                key={f.id}
                fixture={f}
                screens={screensByFixture.get(f.id) ?? []}
                projectId={projectId}
                sidecarOnline={sidecarStatus === 'online'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FixtureCard({
  fixture,
  screens,
  projectId,
  sidecarOnline,
}: {
  fixture: FixtureDefinition;
  screens: ScreenDefinition[];
  projectId: string | undefined;
  sidecarOnline: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async () => {
    setNotice(null);
    if (!projectId || !sidecarOnline) return;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !projectId) return;
    setBusy(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        setNotice({
          kind: 'error',
          text: `Not valid JSON: ${(err as Error).message}`,
        });
        setBusy(false);
        return;
      }
      const res = await sidecar.writeFixture(projectId, fixture.id, parsed);
      if (res.status === 'ok') {
        setNotice({
          kind: 'info',
          text: `Wrote ${res.data.bytes} bytes. HMR will refresh screens.`,
        });
      } else if (res.status === 'offline') {
        setNotice({ kind: 'error', text: 'Sidecar offline.' });
      } else {
        setNotice({ kind: 'error', text: `Upload failed: ${res.message}` });
      }
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!projectId) return;
    setBusy(true);
    setNotice(null);
    // Temporarily POST directly; Phase 9 fills this in.
    try {
      const res = await fetch(
        `${sidecar.baseUrl}/api/projects/${encodeURIComponent(projectId)}/ai/generate-data`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
      );
      if (res.status === 501) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setNotice({
          kind: 'info',
          text: body.message ?? 'AI fixture generation arrives in Phase 9.',
        });
      } else if (!res.ok) {
        setNotice({ kind: 'error', text: `HTTP ${res.status}` });
      }
    } catch {
      setNotice({ kind: 'error', text: 'Sidecar offline.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded border border-shell-border bg-shell-bg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[11px] hover:bg-white/5"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="text-shell-muted" aria-hidden>
            {open ? '▾' : '▸'}
          </span>
          <span className="truncate font-mono text-shell-text">{fixture.id}</span>
        </span>
        <span className="shrink-0 font-mono text-[10px] text-shell-muted">
          {summariseJson(fixture.data)}
        </span>
      </button>

      {open && (
        <div className="border-t border-shell-border p-2 text-[11px]">
          {fixture.description && (
            <div className="mb-1.5 italic leading-snug text-shell-muted">
              {fixture.description}
            </div>
          )}

          {screens.length > 0 && (
            <div className="mb-1.5 text-[10px] text-shell-muted">
              Used by:{' '}
              {screens.map((s, i) => (
                <span key={s.id}>
                  <span className="font-mono text-shell-text">{s.id}</span>
                  {i < screens.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          <JsonTree value={fixture.data} maxHeightClass="max-h-48" />

          <div className="mt-2 flex flex-wrap gap-1.5">
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={onFile}
            />
            <button
              type="button"
              onClick={upload}
              disabled={busy || !sidecarOnline}
              title={!sidecarOnline ? 'Sidecar offline — run `npm run sidecar`' : undefined}
              className={clsx(
                'rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                sidecarOnline && !busy
                  ? 'text-shell-text hover:bg-white/5'
                  : 'cursor-not-allowed text-shell-muted',
              )}
            >
              {busy ? 'Uploading…' : 'Upload JSON'}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={busy || !sidecarOnline}
              title={!sidecarOnline ? 'Sidecar offline' : 'Phase 9 feature'}
              className={clsx(
                'rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                sidecarOnline && !busy
                  ? 'text-shell-text hover:bg-white/5'
                  : 'cursor-not-allowed text-shell-muted',
              )}
            >
              Generate with AI
            </button>
          </div>

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
