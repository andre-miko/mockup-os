import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import clsx from 'clsx';

/**
 * Click-to-edit text / textarea with sidecar persistence.
 *
 * The caller owns persistence: `onSave` receives the new value and returns
 * a tagged result. We handle the UI — the "view" state displays `value` as
 * plain text (with a subtle hover indicator), the "edit" state swaps in an
 * input that saves on Enter/blur and cancels on Escape. For multiline the
 * shortcut flips: Enter adds a newline, Cmd/Ctrl+Enter saves.
 *
 * After a successful save we stay in view mode; the surrounding prop
 * updates via Vite HMR once the sidecar rewrites the registry.
 */

export interface InlineEditProps {
  value: string;
  onSave: (next: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  multiline?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  /** Extra classes for the displayed value in view mode. */
  displayClassName?: string;
  /** Optional title, shown as a tooltip in view mode. */
  title?: string;
  /** Disable editing entirely (shows value only). */
  disabled?: boolean;
  /** Reason for being disabled — shown as tooltip. */
  disabledReason?: string;
}

export function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder,
  emptyLabel,
  displayClassName,
  title,
  disabled,
  disabledReason,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Keep the draft aligned with the incoming prop while we're not editing
  // (so HMR updates don't get lost behind a stale draft).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = async () => {
    if (draft === value) {
      setEditing(false);
      setError(null);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await onSave(draft);
    setSaving(false);
    if (res.ok) {
      setEditing(false);
    } else {
      setError(res.message);
    }
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
    setError(null);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
      return;
    }
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      void commit();
      return;
    }
    if (multiline && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void commit();
    }
  };

  if (!editing) {
    const empty = value.trim().length === 0;
    return (
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setDraft(value);
          setEditing(true);
        }}
        title={disabled ? disabledReason : title}
        className={clsx(
          'group block w-full text-left',
          disabled ? 'cursor-not-allowed' : 'cursor-text hover:bg-white/5',
          'rounded px-0.5 -mx-0.5',
        )}
      >
        <span
          className={clsx(
            displayClassName,
            empty && 'italic text-shell-muted',
            'whitespace-pre-wrap break-words',
          )}
        >
          {empty ? emptyLabel ?? 'Click to add…' : value}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {multiline ? (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => void commit()}
          rows={Math.max(2, draft.split('\n').length)}
          className="w-full resize-y rounded border border-shell-accent/60 bg-shell-bg px-1.5 py-1 text-xs text-shell-text focus:outline-none focus:ring-1 focus:ring-shell-accent"
        />
      ) : (
        <input
          ref={(el) => {
            inputRef.current = el;
          }}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => void commit()}
          className="w-full rounded border border-shell-accent/60 bg-shell-bg px-1.5 py-1 text-sm text-shell-text focus:outline-none focus:ring-1 focus:ring-shell-accent"
        />
      )}
      <div className="flex items-center gap-2 text-[10px] text-shell-muted">
        {saving ? (
          <span>Saving…</span>
        ) : (
          <span>
            {multiline ? '⌘/Ctrl+Enter' : 'Enter'} to save · Esc to cancel
          </span>
        )}
      </div>
      {error && (
        <div className="rounded border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300">
          {error}
        </div>
      )}
    </div>
  );
}
