import { useEffect, useMemo, useRef, useState } from 'react';
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
  // Track *which* async action is running, not just whether one is. With a
  // shared boolean the Upload button would display "Uploading…" while the
  // Generate stream was running.
  const [busy, setBusy] = useState<null | 'uploading' | 'generating'>(null);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  // The registry snapshot in `fixture.data` comes from the JS bundle and
  // only refreshes on a full dev-server restart. To mirror the Brief tab's
  // behaviour we re-read the JSON from disk through the sidecar the first
  // time the card opens, and after every upload.
  const [freshData, setFreshData] = useState<unknown | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewData = freshData ?? fixture.data;

  useEffect(() => {
    if (!open || !projectId || !sidecarOnline || freshData !== null) return;
    let cancelled = false;
    sidecar.getFixture(projectId, fixture.id).then((res) => {
      if (cancelled) return;
      if (res.status === 'ok') setFreshData(res.data.data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, projectId, sidecarOnline, fixture.id, freshData]);

  const upload = async () => {
    setNotice(null);
    if (!projectId || !sidecarOnline) return;
    fileRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !projectId) return;
    setBusy('uploading');
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
        setBusy(null);
        return;
      }
      const res = await sidecar.writeFixture(projectId, fixture.id, parsed);
      if (res.status === 'ok') {
        setFreshData(parsed);
        setNotice({
          kind: 'info',
          text: `Wrote ${res.data.bytes} bytes. Reload the page for mockups to pick up the new data.`,
        });
      } else if (res.status === 'offline') {
        setNotice({ kind: 'error', text: 'Sidecar offline.' });
      } else {
        setNotice({ kind: 'error', text: `Upload failed: ${res.message}` });
      }
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    if (!projectId || !sidecarOnline) return;
    setBusy('generating');
    setNotice({ kind: 'info', text: 'Asking the model for fresh data…' });

    // Infer a schema hint from whatever we're currently previewing, so the
    // model produces a shape compatible with the existing screens. For
    // arrays we only send the first element — enough to describe keys and
    // types without bloating the prompt.
    const schemaSample = Array.isArray(previewData) ? previewData.slice(0, 1) : previewData;
    const schemaHint = JSON.stringify(schemaSample, null, 2).slice(0, 2000);

    let text = '';
    const res = await sidecar.streamGenerateData(projectId, {
      fixtureId: fixture.id,
      prompt: fixture.description ?? 'realistic example data',
      schemaHint,
      onEvent: (ev) => {
        if (ev.type === 'chunk' && typeof ev.text === 'string') text += ev.text;
        if (ev.type === 'error') {
          setNotice({ kind: 'error', text: ev.text ?? 'AI error.' });
        }
      },
    });

    if (res.status !== 'ok') {
      setBusy(null);
      return;
    }

    // Models sometimes wrap JSON in ```json fences despite instructions; strip
    // them before parsing. Anything outside the outermost {…} or […] is noise.
    const stripped = extractJsonBlock(text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(stripped);
    } catch (err) {
      setNotice({
        kind: 'error',
        text: `Model returned invalid JSON: ${(err as Error).message}`,
      });
      setBusy(null);
      return;
    }

    const write = await sidecar.writeFixture(projectId, fixture.id, parsed);
    if (write.status === 'ok') {
      setFreshData(parsed);
      setNotice({
        kind: 'info',
        text: `Generated and saved ${write.data.bytes} bytes. Reload to see it in the viewport.`,
      });
    } else if (write.status === 'offline') {
      setNotice({ kind: 'error', text: 'Sidecar offline while saving.' });
    } else {
      setNotice({ kind: 'error', text: `Save failed: ${write.message}` });
    }
    setBusy(null);
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
          {summariseJson(previewData)}
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

          <JsonTree value={previewData} maxHeightClass="max-h-48" />

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
              disabled={busy !== null || !sidecarOnline}
              title={!sidecarOnline ? 'Sidecar offline — run `npm run sidecar`' : undefined}
              className={clsx(
                'flex items-center gap-1 rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                sidecarOnline && busy === null
                  ? 'text-shell-text hover:bg-white/5'
                  : 'cursor-not-allowed text-shell-muted',
              )}
            >
              {busy === 'uploading' && <Spinner />}
              {busy === 'uploading' ? 'Uploading…' : 'Upload JSON'}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={busy !== null || !sidecarOnline}
              title={
                !sidecarOnline
                  ? 'Sidecar offline'
                  : 'Ask Claude to regenerate this fixture based on the description and current shape'
              }
              className={clsx(
                'flex items-center gap-1 rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                sidecarOnline && busy === null
                  ? 'text-shell-text hover:bg-white/5'
                  : 'cursor-not-allowed text-shell-muted',
              )}
            >
              {busy === 'generating' && <Spinner />}
              {busy === 'generating' ? 'Generating…' : 'Generate dummy data'}
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

function Spinner() {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 animate-spin rounded-full border border-shell-muted border-t-transparent"
      aria-hidden
    />
  );
}

// Pick out the first balanced JSON value from a blob of model output. Models
// sometimes ignore the "JSON only" instruction and add prose or ```json
// fences, so we grep for the outermost object or array and hand that to
// JSON.parse.
function extractJsonBlock(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const body = fenced ? fenced[1] : raw;
  const firstBrace = body.indexOf('{');
  const firstBracket = body.indexOf('[');
  const start =
    firstBrace === -1
      ? firstBracket
      : firstBracket === -1
        ? firstBrace
        : Math.min(firstBrace, firstBracket);
  if (start === -1) return body.trim();
  const open = body[start];
  const close = open === '{' ? '}' : ']';
  const lastClose = body.lastIndexOf(close);
  if (lastClose <= start) return body.trim();
  return body.slice(start, lastClose + 1);
}
