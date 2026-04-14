import clsx from 'clsx';
import { useSidecarHealth } from '@framework/sidecar-hooks';

/**
 * Tiny TopBar pill showing whether the sidecar is reachable. Clicking
 * forces a re-probe. When offline, hovering explains which features need
 * the sidecar (briefs, sitemap, CRUD, handoff, AI) and how to start it.
 */
export function SidecarStatus() {
  const { status, baseUrl, refresh } = useSidecarHealth();

  const colour =
    status === 'online'
      ? 'bg-emerald-500'
      : status === 'offline'
        ? 'bg-rose-500'
        : 'bg-zinc-500';

  const label =
    status === 'online' ? 'Sidecar' : status === 'offline' ? 'Sidecar offline' : 'Sidecar…';

  const tooltip =
    status === 'online'
      ? `Connected to ${baseUrl}. Briefs, sitemap, and AI features available.`
      : status === 'offline'
        ? `Sidecar at ${baseUrl} unreachable. Start with \`npm run sidecar\` (or \`npm run dev:all\`). Click to retry.`
        : 'Probing sidecar…';

  return (
    <button
      type="button"
      onClick={refresh}
      title={tooltip}
      className={clsx(
        'flex items-center gap-1.5 rounded border border-shell-border px-2 py-1 text-[11px] transition-colors',
        status === 'offline'
          ? 'text-rose-300 hover:bg-rose-500/10'
          : status === 'online'
            ? 'text-shell-muted hover:text-shell-text'
            : 'text-shell-muted',
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', colour)} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
