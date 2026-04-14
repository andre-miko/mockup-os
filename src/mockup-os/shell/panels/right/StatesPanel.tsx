import clsx from 'clsx';
import { useBuilderStore } from '@framework/store';
import type { ScreenDefinition, ScreenState } from '@framework/types';

/**
 * State switcher with a fixture diff preview.
 *
 * Each state button shows its label and description. Under the buttons we
 * render the active state's fixture bindings, and for non-default states
 * a small `+added / -removed` diff against the default so the author can
 * see *what the state actually changes* without reading the TS.
 */
export function StatesPanel({ screen }: { screen: ScreenDefinition }) {
  const selectedStateId = useBuilderStore((s) => s.selectedStateByScreen[screen.id]);
  const setSelectedState = useBuilderStore((s) => s.setSelectedState);

  if (screen.states.length === 0) return null;

  const defaultStateId = screen.defaultStateId ?? screen.states[0]?.id;
  const activeStateId = selectedStateId ?? defaultStateId;
  const active = screen.states.find((st) => st.id === activeStateId);
  const defaultState = screen.states.find((st) => st.id === defaultStateId);

  const screenFixtures = screen.fixtures ?? [];

  // Effective fixture set for a state: its own `fixtures` if declared,
  // falling back to the screen's top-level list.
  const fixturesFor = (st: ScreenState | undefined): string[] =>
    st?.fixtures && st.fixtures.length > 0 ? st.fixtures : screenFixtures;

  const activeFixtures = fixturesFor(active);
  const defaultFixtures = fixturesFor(defaultState);

  const added = activeFixtures.filter((f) => !defaultFixtures.includes(f));
  const removed = defaultFixtures.filter((f) => !activeFixtures.includes(f));
  const isDefault = active?.id === defaultStateId;

  return (
    <section className="mb-5">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-shell-muted">
        States
      </div>
      <div className="flex flex-col gap-1">
        {screen.states.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setSelectedState(screen.id, st.id)}
            className={clsx(
              'flex flex-col items-start rounded border px-2 py-1.5 text-left',
              st.id === activeStateId
                ? 'border-shell-accent bg-shell-accent/10 text-shell-accent'
                : 'border-shell-border text-shell-text hover:bg-white/5',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-xs font-medium">{st.label}</span>
              {st.id === defaultStateId && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-shell-muted">
                  default
                </span>
              )}
            </span>
            {st.description && (
              <span className="text-[11px] text-shell-muted">{st.description}</span>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div className="mt-2 rounded border border-shell-border bg-shell-bg px-2 py-1.5 text-[11px] leading-snug">
          {activeFixtures.length === 0 ? (
            <div className="text-shell-muted">No fixtures bound to this state.</div>
          ) : (
            <div className="text-shell-muted">
              Fixtures:{' '}
              {activeFixtures.map((f, i) => (
                <span key={f}>
                  <span className="font-mono text-shell-text">{f}</span>
                  {i < activeFixtures.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          {!isDefault && (added.length > 0 || removed.length > 0) && (
            <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[10px]">
              {added.map((f) => (
                <span key={`+${f}`} className="rounded bg-emerald-500/10 px-1 py-0.5 text-emerald-300">
                  +{f}
                </span>
              ))}
              {removed.map((f) => (
                <span key={`-${f}`} className="rounded bg-rose-500/10 px-1 py-0.5 text-rose-300">
                  −{f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
