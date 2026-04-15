import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useBuilderStore } from '@framework/store';
import { sidecar } from '@framework/sidecar-client';
import type { KnownGap, ScreenDefinition } from '@framework/types';

/**
 * Editable known-gaps list.
 *
 * Gaps are an array on `ScreenDefinition`, so every edit writes the whole
 * list through the sidecar. The draft lives locally until the user clicks
 * Save; until then the screen's on-disk value stays put. After a successful
 * save the draft is discarded and Vite HMR brings the new registry in.
 */

type Severity = KnownGap['severity'];

const SEVERITIES: Severity[] = ['info', 'warn', 'blocker'];

const SEVERITY_TONE: Record<Severity, string> = {
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  warn: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  blocker: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

function makeGapId(): string {
  return `gap.${Math.random().toString(36).slice(2, 8)}`;
}

function gapsEqual(a: KnownGap[], b: KnownGap[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].description !== b[i].description) return false;
    if (a[i].severity !== b[i].severity) return false;
  }
  return true;
}

export function KnownGapsPanel({ screen }: { screen: ScreenDefinition }) {
  const projectId = useBuilderStore((s) => s.activeProjectId);
  const [draft, setDraft] = useState<KnownGap[]>(screen.knownGaps);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  // Pull in updates from HMR while we're clean.
  useEffect(() => {
    if (!dirty) setDraft(screen.knownGaps);
  }, [screen.knownGaps, dirty]);

  const markDirty = (next: KnownGap[]) => {
    setDraft(next);
    setDirty(!gapsEqual(next, screen.knownGaps));
    setNotice(null);
  };

  const addGap = () => {
    markDirty([...draft, { id: makeGapId(), description: '', severity: 'info' }]);
  };

  const removeGap = (idx: number) => {
    markDirty(draft.filter((_, i) => i !== idx));
  };

  const patchGap = (idx: number, patch: Partial<KnownGap>) => {
    markDirty(
      draft.map((g, i) => (i === idx ? { ...g, ...patch } : g)),
    );
  };

  const revert = () => {
    setDraft(screen.knownGaps);
    setDirty(false);
    setNotice(null);
  };

  const save = async () => {
    if (!projectId) return;
    if (draft.some((g) => !g.description.trim())) {
      setNotice({ kind: 'error', text: 'Every gap needs a description.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    const res = await sidecar.setScreenKnownGaps(
      projectId,
      screen.id,
      draft.map((g) => ({
        id: g.id,
        description: g.description.trim(),
        severity: g.severity,
      })),
    );
    setSaving(false);
    if (res.status === 'ok') {
      setDirty(false);
      setNotice({ kind: 'info', text: `Saved ${res.data.count} gap${res.data.count === 1 ? '' : 's'}.` });
    } else {
      setNotice({
        kind: 'error',
        text:
          res.status === 'offline'
            ? 'Sidecar offline — run `npm run sidecar`.'
            : `Save failed: ${res.message}`,
      });
    }
  };

  return (
    <section className="mb-5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-shell-muted">
          Known gaps
        </div>
        <button
          type="button"
          onClick={addGap}
          className="rounded border border-shell-border px-1.5 py-0.5 text-[10px] text-shell-text hover:bg-white/5"
        >
          + Add
        </button>
      </div>

      {draft.length === 0 ? (
        <div className="rounded border border-dashed border-shell-border px-2 py-1.5 text-[11px] italic text-shell-muted">
          No known gaps.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-shell-border rounded border border-shell-border bg-shell-bg">
          {draft.map((g, i) => (
            <li key={g.id} className="group flex items-start gap-1.5 px-1.5 py-1">
              <SeverityChip
                value={g.severity}
                onCycle={() => patchGap(i, { severity: nextSeverity(g.severity) })}
              />
              <textarea
                value={g.description}
                onChange={(e) => patchGap(i, { description: e.target.value })}
                placeholder="Describe the gap…"
                rows={Math.max(1, g.description.split('\n').length)}
                className="min-w-0 flex-1 resize-none bg-transparent px-0.5 py-0.5 text-[11px] leading-snug text-shell-text placeholder:text-shell-muted focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeGap(i)}
                className="mt-0.5 shrink-0 rounded px-1 text-[12px] leading-none text-shell-muted opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                title="Remove gap"
                aria-label="Remove gap"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {(dirty || saving || notice) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {dirty && (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={clsx(
                'rounded border px-2 py-0.5 text-[10px]',
                saving
                  ? 'cursor-not-allowed border-shell-border text-shell-muted'
                  : 'border-shell-accent/60 bg-shell-accent/10 text-shell-accent hover:bg-shell-accent/20',
              )}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          )}
          {dirty && !saving && (
            <button
              type="button"
              onClick={revert}
              className="rounded border border-shell-border px-2 py-0.5 text-[10px] text-shell-text hover:bg-white/5"
            >
              Revert
            </button>
          )}
          {notice && (
            <div
              className={clsx(
                'w-full rounded px-2 py-1 text-[10px] leading-snug',
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
    </section>
  );
}

function nextSeverity(current: Severity): Severity {
  const i = SEVERITIES.indexOf(current);
  return SEVERITIES[(i + 1) % SEVERITIES.length];
}

function SeverityChip({ value, onCycle }: { value: Severity; onCycle: () => void }) {
  return (
    <button
      type="button"
      onClick={onCycle}
      title={`${value} — click to change`}
      className={clsx(
        'mt-0.5 shrink-0 rounded border px-1 py-0.5 font-mono text-[9px] uppercase leading-none tracking-wider',
        SEVERITY_TONE[value],
      )}
    >
      {value.charAt(0)}
    </button>
  );
}

