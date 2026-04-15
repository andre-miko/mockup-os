import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useActiveProjectId } from '@framework/hooks';
import { sidecar, type SidecarBrief } from '@framework/sidecar-client';

/**
 * Brief authoring tab.
 *
 * Reads the project's `brief/*.md` files via the sidecar, lets the user
 * edit each one inline, save back to disk, and run "Expand with AI" — a
 * one-shot prompt that asks the configured AI to turn rough notes into
 * the same section's polished prose. The expanded text is written into
 * the textarea; the user reviews and clicks Save (no auto-save) so the
 * AI never silently overwrites authored content.
 *
 * Read-only when the sidecar is offline. The empty-state covers the case
 * where the project has no `brief/` folder yet.
 */
export function BriefTab({ query }: { query: string }) {
  const projectId = useActiveProjectId();
  const [brief, setBrief] = useState<SidecarBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    sidecar.getBrief(projectId).then((res) => {
      if (cancelled) return;
      if (res.status === 'ok') {
        setBrief(res.data);
        setOffline(false);
      } else if (res.status === 'offline') {
        setOffline(true);
        setBrief(null);
      } else {
        setBrief({ exists: false, files: [] });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return <div className="px-2 py-4 text-xs text-shell-muted">Loading brief…</div>;
  }
  if (offline) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-shell-muted">
        Sidecar offline — start it with <code className="ml-1">npm run sidecar</code>.
      </div>
    );
  }
  if (!brief?.exists || brief.files.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-shell-muted">
        No brief authored yet. Add markdown files under{' '}
        <code className="ml-1">brief/</code>.
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const files = q
    ? brief.files.filter(
        (f) => f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q),
      )
    : brief.files;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-1 text-[10px] uppercase tracking-wider text-shell-muted">
          {brief.files.length} file{brief.files.length === 1 ? '' : 's'}
          {q && ` · ${files.length} match${files.length === 1 ? '' : 'es'}`}
        </div>
        {files.length === 0 ? (
          <div className="px-2 py-4 text-xs text-shell-muted">No matches.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {files.map((f) => (
              <BriefFileCard
                key={f.name}
                fileName={f.name}
                initialContent={f.content}
                projectId={projectId!}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefFileCard({
  fileName,
  initialContent,
  projectId,
}: {
  fileName: string;
  initialContent: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const dirty = content !== savedContent;

  const save = async () => {
    setSaving(true);
    setNotice(null);
    const res = await sidecar.writeBriefFile(projectId, fileName, content);
    setSaving(false);
    if (res.status === 'ok') {
      setSavedContent(content);
      setNotice({ kind: 'info', text: `Saved · ${res.data.bytes} bytes` });
    } else if (res.status === 'offline') {
      setNotice({ kind: 'error', text: 'Sidecar offline.' });
    } else {
      setNotice({ kind: 'error', text: `Failed: ${res.message}` });
    }
  };

  const expand = async () => {
    setExpanding(true);
    setNotice(null);
    let buffer = '';
    const systemPrompt = [
      'You rewrite a single markdown brief section.',
      'Your entire response must be the rewritten markdown and nothing else.',
      'Do NOT add preamble such as "Here is…", "Sure, I can…", or similar framing.',
      'Do NOT add a trailing question or offer ("Would you like me to…").',
      'Do NOT wrap the output in triple-backtick code fences.',
      'Preserve every concrete intent and example from the draft.',
      'Expand bullets into well-structured prose where helpful, but keep the same heading structure.',
    ].join(' ');
    const userPrompt = [
      `Rewrite the markdown section below (from ${fileName}).`,
      'Output the full rewritten markdown only — no commentary before or after.',
      '',
      '--- BEGIN DRAFT ---',
      content,
      '--- END DRAFT ---',
    ].join('\n');

    await sidecar.streamPrompt(projectId, {
      prompt: userPrompt,
      systemPrompt,
      replaceSystemPrompt: true,
      onEvent: (e) => {
        if (e.type === 'chunk' && e.text) buffer += e.text;
        if (e.type === 'error') {
          setNotice({ kind: 'error', text: e.text ?? e.code ?? 'AI error' });
        }
      },
    });
    setExpanding(false);
    const cleaned = stripConversationalFraming(buffer);
    if (cleaned.trim()) {
      setContent(cleaned);
      setNotice({
        kind: 'info',
        text: 'AI rewrite ready — review, then Save to write to disk.',
      });
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
          <span className="truncate font-mono text-shell-text">{fileName}</span>
        </span>
        <span className="shrink-0 font-mono text-[10px] text-shell-muted">
          {dirty ? '● unsaved' : `${content.length} chars`}
        </span>
      </button>
      {open && (
        <div className="border-t border-shell-border p-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={Math.min(18, Math.max(6, content.split('\n').length + 1))}
            className="w-full resize-y rounded border border-shell-border bg-shell-panel p-2 font-mono text-[11px] leading-relaxed text-shell-text focus:border-shell-accent focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={save}
              disabled={saving || expanding || !dirty}
              className={clsx(
                'rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                dirty && !saving && !expanding
                  ? 'bg-shell-accent/15 text-shell-accent hover:bg-shell-accent/25'
                  : 'cursor-not-allowed text-shell-muted',
              )}
            >
              {saving ? 'Saving…' : dirty ? 'Save' : 'Saved'}
            </button>
            <button
              type="button"
              onClick={expand}
              disabled={expanding || saving}
              className={clsx(
                'flex items-center gap-1 rounded border border-shell-border px-2 py-0.5 text-[10px] transition-colors',
                expanding || saving
                  ? 'cursor-not-allowed text-shell-muted'
                  : 'text-shell-text hover:bg-white/5',
              )}
            >
              {expanding && <Spinner />}
              {expanding ? 'Expanding with AI…' : 'Expand with AI'}
            </button>
            {dirty && (
              <button
                type="button"
                onClick={() => {
                  setContent(savedContent);
                  setNotice(null);
                }}
                className="rounded border border-shell-border px-2 py-0.5 text-[10px] text-shell-muted hover:text-shell-text"
              >
                Discard
              </button>
            )}
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

// Claude Code's print mode sometimes wraps rewrites in chatter the system
// prompt can't fully suppress — things like "Here's the expanded version…",
// `---` section dividers around the content, or a trailing "Let me know if
// you'd like me to save it." This peels those layers off so the textarea
// receives clean markdown.
function stripConversationalFraming(raw: string): string {
  let text = raw.trim();

  // Whole-response code fence? Unwrap it.
  const fenced = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n?```\s*$/i);
  if (fenced) text = fenced[1].trim();

  // Drop anything before the first markdown heading.
  const headingMatch = text.match(/^#{1,6}\s.+$/m);
  if (headingMatch && headingMatch.index && headingMatch.index > 0) {
    text = text.slice(headingMatch.index);
  }

  // Strip horizontal rules bordering the content (model often wraps output
  // in `---` blocks to separate its own commentary from the rewrite).
  text = text.replace(/^---\s*\n+/, '').replace(/\n+---\s*$/, '');

  // Strip trailing conversational paragraphs.
  const trailingStarters = [
    /\n\s*Review the .+$/is,
    /\n\s*Let me know .+$/is,
    /\n\s*If you'?d like .+$/is,
    /\n\s*Would you like .+$/is,
    /\n\s*Feel free to .+$/is,
    /\n\s*I'?ve .+$/is,
    /\n\s*I have .+$/is,
    /\n\s*(The )?rewrite .+$/is,
  ];
  for (const re of trailingStarters) text = text.replace(re, '');

  // Trim any remaining dangling horizontal rule left over after the cut.
  text = text.replace(/\n+---\s*$/, '');

  return text.trim() + '\n';
}

function Spinner() {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 animate-spin rounded-full border border-shell-muted border-t-transparent"
      aria-hidden
    />
  );
}
