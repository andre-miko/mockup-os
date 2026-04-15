import { useLocation } from 'react-router-dom';
import { useSitemap } from '@framework/sitemap';

/**
 * Placeholder rendered in the viewport for a "ghost" screen — one authored
 * in `docs/sitemap.md` but not yet implemented. Lets the user see that a
 * proposed screen exists (with its rationale) instead of the viewport
 * silently refusing to change when the entry is clicked.
 */
export function GhostPlaceholder() {
  const location = useLocation();
  const sitemap = useSitemap();
  const ghost = sitemap.ghosts.find((g) => g.route === location.pathname);

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-full border border-dashed border-zinc-300 bg-zinc-50 px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-500">
        ✨ Proposed screen
      </div>
      <div className="text-lg font-semibold text-zinc-800">
        {ghost?.title ?? 'Proposed screen'}
      </div>
      <div className="font-mono text-xs text-zinc-500">{location.pathname}</div>
      {ghost?.rationale ? (
        <p className="max-w-md text-sm leading-relaxed text-zinc-600">
          {ghost.rationale}
        </p>
      ) : (
        <p className="max-w-md text-sm leading-relaxed text-zinc-500">
          This screen is planned in{' '}
          <code className="rounded bg-zinc-100 px-1 py-0.5">docs/sitemap.md</code>{' '}
          but not built yet. Add a <code className="rounded bg-zinc-100 px-1 py-0.5">- Why:</code>{' '}
          line to the sitemap to document its purpose.
        </p>
      )}
      <div className="mt-2 text-[11px] text-zinc-400">
        Run the <code>mockup-generator</code> agent to scaffold this screen.
      </div>
    </div>
  );
}
