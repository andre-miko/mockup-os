import { useMemo } from 'react';
import clsx from 'clsx';
import { NavLink } from 'react-router-dom';
import { getRegistry } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import type { ScreenDefinition } from '@framework/types';

/**
 * Screen list grouped by `layoutFamily` — "Patterns" in the UI.
 *
 * This is purely an informational lens: it tells authors and reviewers
 * which screens share a visual pattern (wizard, dashboard, detail…) so
 * consistency drift is easy to spot. It is not the same thing as the
 * product's real React layout components — those belong in the router.
 */
export function PatternsTab({ query }: { query: string }) {
  const projectId = useActiveProjectId();
  const registry = useMemo(() => getRegistry(projectId), [projectId]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? registry.screens.filter(
          (s) =>
            s.id.toLowerCase().includes(q) ||
            s.title.toLowerCase().includes(q) ||
            s.route.toLowerCase().includes(q) ||
            s.layoutFamily.toLowerCase().includes(q),
        )
      : registry.screens;

    const m = new Map<string, ScreenDefinition[]>();
    for (const s of filtered) {
      const arr = m.get(s.layoutFamily) ?? [];
      arr.push(s);
      m.set(s.layoutFamily, arr);
    }
    return m;
  }, [registry, query]);

  return (
    <nav className="flex-1 overflow-y-auto p-2 text-sm">
      {[...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([familyName, screens]) => (
          <div key={familyName} className="mb-3">
            <div className="px-2 pb-1 text-[10px] uppercase tracking-wider text-shell-muted">
              {familyName} · {screens.length}
            </div>
            <ul>
              {screens.map((s) => (
                <li key={s.id}>
                  <NavLink
                    to={s.route}
                    end
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-between rounded px-2 py-1 text-shell-text hover:bg-white/5',
                        isActive && 'bg-shell-accent/10 text-shell-accent',
                      )
                    }
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="ml-2 font-mono text-[10px] text-shell-muted">
                      {s.route}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </nav>
  );
}
