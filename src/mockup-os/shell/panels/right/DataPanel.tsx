import { useState } from 'react';
import { useFixture } from '@framework/hooks';
import type { ScreenDefinition } from '@framework/types';
import { JsonTree, summariseJson } from '@shell/common/JsonTree';

/**
 * Data preview for the currently-selected screen.
 *
 * Shows the data payload of every fixture the screen references. Each
 * fixture is an expandable section; once expanded, its JSON renders via
 * the shared `JsonTree` component.
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
  const [open, setOpen] = useState(false);

  if (!fixture) {
    return (
      <div className="rounded border border-rose-500/30 bg-rose-500/5 px-2 py-1 text-[11px] text-rose-300">
        <span className="font-mono">{id}</span> — not registered
      </div>
    );
  }

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
          <span className="truncate font-mono text-shell-text">{id}</span>
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
          <JsonTree value={fixture.data} />
        </div>
      )}
    </div>
  );
}
