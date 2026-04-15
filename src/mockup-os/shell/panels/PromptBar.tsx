import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useActiveProjectId } from '@framework/hooks';
import { sidecar, type AiEvent, type AiStatus } from '@framework/sidecar-client';

/**
 * Top-of-page AI prompt bar.
 *
 * Single-line textarea + send button. Press Enter to send (Shift+Enter for
 * newline). Streamed response shows in a slide-up drawer pinned to the
 * bottom-right of the viewport so the mockup itself stays visible.
 *
 * Status pill on the left shows the resolved AI backend (claude-code,
 * anthropic, none). When `none`, the input is disabled and the placeholder
 * explains how to enable AI; the rest of the OS keeps working.
 */

interface PendingState {
  prompt: string;
  text: string;
  events: AiEvent[];
  status: 'streaming' | 'done' | 'error' | 'aborted';
  controller: AbortController | null;
  startedAt: number;
}

export function PromptBar() {
  const projectId = useActiveProjectId();
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingState | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Probe AI status when the active project changes.
  useEffect(() => {
    if (!projectId) {
      setAiStatus(null);
      return;
    }
    let cancelled = false;
    sidecar.aiStatus(projectId).then((res) => {
      if (cancelled) return;
      if (res.status === 'ok') setAiStatus(res.data);
      else setAiStatus({ backend: 'none', configured: false, reason: 'Sidecar offline' });
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const streaming = pending?.status === 'streaming';
  const canSend =
    !!projectId && aiStatus?.configured && draft.trim().length > 0 && !streaming;

  const send = async () => {
    if (!canSend || !projectId) return;
    const controller = new AbortController();
    const initial: PendingState = {
      prompt: draft.trim(),
      text: '',
      events: [],
      status: 'streaming',
      controller,
      startedAt: Date.now(),
    };
    setPending(initial);
    setDrawerOpen(true);
    setDraft('');

    await sidecar.streamPrompt(projectId, {
      prompt: initial.prompt,
      signal: controller.signal,
      onEvent: (e) => {
        setPending((curr) => {
          if (!curr) return curr;
          const text = e.type === 'chunk' && e.text ? curr.text + e.text : curr.text;
          const status: PendingState['status'] =
            e.type === 'done'
              ? 'done'
              : e.type === 'error'
                ? e.code === 'aborted'
                  ? 'aborted'
                  : 'error'
                : curr.status;
          return { ...curr, text, status, events: [...curr.events, e] };
        });
      },
    });
    setPending((curr) => (curr && curr.status === 'streaming' ? { ...curr, status: 'done' } : curr));
  };

  const cancel = () => {
    pending?.controller?.abort();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-b border-shell-border bg-shell-panel">
      <div className="flex items-center gap-2 px-3 py-2">
        <BackendPill status={aiStatus} />
        <textarea
          ref={taRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          disabled={!aiStatus?.configured}
          placeholder={
            aiStatus?.configured
              ? 'Ask the AI… (Enter to send, Shift+Enter for newline)'
              : aiStatus?.reason ?? 'AI not configured'
          }
          className={clsx(
            'flex-1 resize-none rounded border border-shell-border bg-shell-bg px-2 py-1 text-sm text-shell-text placeholder:text-shell-muted focus:border-shell-accent focus:outline-none',
            !aiStatus?.configured && 'cursor-not-allowed',
          )}
        />
        {pending && pending.status === 'streaming' ? (
          <button
            type="button"
            onClick={cancel}
            className="rounded border border-shell-border px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className={clsx(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              canSend
                ? 'bg-shell-accent text-white hover:bg-shell-accent/90'
                : 'cursor-not-allowed bg-white/5 text-shell-muted',
            )}
          >
            Send
          </button>
        )}
        {pending && (
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            className="rounded border border-shell-border px-2 py-1 text-[10px] text-shell-muted hover:text-shell-text"
            title={drawerOpen ? 'Hide response' : 'Show response'}
          >
            {drawerOpen ? '▾' : '▸'}
          </button>
        )}
      </div>

      {pending && drawerOpen && (
        <PromptDrawer
          pending={pending}
          backend={aiStatus?.backend}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

function BackendPill({ status }: { status: AiStatus | null }) {
  if (!status) {
    return (
      <span className="rounded border border-shell-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-shell-muted">
        AI…
      </span>
    );
  }
  const color = status.configured
    ? 'bg-emerald-500'
    : status.backend === 'none'
      ? 'bg-zinc-500'
      : 'bg-rose-500';
  return (
    <span
      className="flex items-center gap-1 rounded border border-shell-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-shell-muted"
      title={status.reason ?? `${status.backend}${status.model ? ` · ${status.model}` : ''}`}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', color)} aria-hidden />
      {status.backend === 'none' ? 'AI off' : status.backend}
    </span>
  );
}

function PromptDrawer({
  pending,
  backend,
  onClose,
}: {
  pending: PendingState;
  backend?: AiStatus['backend'];
  onClose: () => void;
}) {
  const meta = pending.events.find((e) => e.type === 'meta')?.data as
    | { backend?: string; model?: string; usage?: unknown }
    | undefined;
  const error = pending.events.find((e) => e.type === 'error');

  return (
    <div className="border-t border-shell-border bg-shell-bg">
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-shell-muted">
        <div className="flex items-center gap-2">
          <span className="font-mono text-shell-text">›</span>
          <span className="line-clamp-1 max-w-[60ch] italic">{pending.prompt}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            {pending.status === 'streaming'
              ? 'streaming…'
              : pending.status === 'aborted'
                ? 'cancelled'
                : pending.status === 'error'
                  ? 'error'
                  : meta?.model
                    ? `done · ${meta.model}`
                    : 'done'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1 hover:text-shell-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto whitespace-pre-wrap px-3 pb-3 font-mono text-[11.5px] leading-relaxed text-shell-text">
        {pending.text ||
          (pending.status === 'streaming' ? (
            <WaitingIndicator startedAt={pending.startedAt} backend={backend} />
          ) : (
            <span className="text-shell-muted">(no output)</span>
          ))}
        {error && (
          <div className="mt-2 rounded border border-rose-500/40 bg-rose-500/10 p-2 text-rose-300">
            {error.text ?? error.code ?? 'Error'}
          </div>
        )}
      </div>
    </div>
  );
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const SLOW_HINT_AFTER_MS = 10_000;

function WaitingIndicator({
  startedAt,
  backend,
}: {
  startedAt: number;
  backend?: AiStatus['backend'];
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 100);
    return () => window.clearInterval(id);
  }, []);
  const elapsedMs = Date.now() - startedAt;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const frame = SPINNER_FRAMES[tick % SPINNER_FRAMES.length];
  const showSlowHint = elapsedMs >= SLOW_HINT_AFTER_MS && backend === 'claude-code';
  return (
    <div className="text-shell-muted">
      <span>
        <span className="text-shell-accent" aria-hidden>
          {frame}
        </span>{' '}
        Waiting for first chunk… <span className="tabular-nums">{elapsedSec}s</span>
      </span>
      {showSlowHint && (
        <div className="mt-2 rounded border border-shell-border bg-white/5 px-2 py-1 text-[10.5px] leading-snug">
          The <code>claude-code</code> backend spawns the CLI per prompt, which adds
          startup overhead. For lower latency, switch the project to the{' '}
          <code>anthropic</code> backend (direct API) and set{' '}
          <code>ANTHROPIC_API_KEY</code>.
        </div>
      )}
    </div>
  );
}
