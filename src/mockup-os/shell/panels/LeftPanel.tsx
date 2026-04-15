import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { getRegistry } from '@framework/registry';
import { useActiveProjectId } from '@framework/hooks';
import { useBuilderStore, type LeftPanelTab } from '@framework/store';
import { SitemapTab } from './tabs/SitemapTab';
import { JourneysTab } from './tabs/JourneysTab';
import { PatternsTab } from './tabs/PatternsTab';
import { DataTab } from './tabs/DataTab';
import { BriefTab } from './tabs/BriefTab';
import { PanelResizer } from '../common/PanelResizer';

type TabKey = LeftPanelTab;

interface TabDef {
  key: TabKey;
  label: string;
  /** When true, the tab is a placeholder pending a later phase. */
  placeholder?: string;
}

const TABS: TabDef[] = [
  { key: 'sitemap', label: 'Sitemap' },
  { key: 'journeys', label: 'Journeys' },
  { key: 'patterns', label: 'Patterns' },
  { key: 'data', label: 'Data' },
  { key: 'brief', label: 'Brief' },
];

/**
 * Left-panel tab host.
 *
 * Sitemap is the default view (hierarchical by section, or flat by URL).
 * Journeys and Patterns are kept for quick grouping access until Phase 6
 * upgrades Journeys with CRUD and Phase 7+ consolidates filters.
 *
 * Data and Brief appear as visible placeholders so the user knows what's
 * on the way without needing to read the plan.
 */
export function LeftPanel() {
  const projectId = useActiveProjectId();
  const registry = useMemo(() => getRegistry(projectId), [projectId]);
  const active = useBuilderStore((s) => s.leftPanelTab);
  const setActive = useBuilderStore((s) => s.setLeftPanelTab);
  const width = useBuilderStore((s) => s.leftPanelWidth);
  const setWidth = useBuilderStore((s) => s.setLeftPanelWidth);
  const [query, setQuery] = useState('');

  if (registry.screens.length === 0) {
    return (
      <aside
        style={{ width }}
        className="relative flex shrink-0 flex-col items-center justify-center border-r border-shell-border bg-shell-panel p-6 text-center text-xs text-shell-muted"
      >
        This project has no screens registered.
        <PanelResizer side="left" width={width} onResize={setWidth} />
      </aside>
    );
  }

  const activeTab = TABS.find((t) => t.key === active);

  return (
    <aside
      style={{ width }}
      className="relative flex shrink-0 flex-col border-r border-shell-border bg-shell-panel"
    >
      <div className="border-b border-shell-border p-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full rounded border border-shell-border bg-shell-bg px-2 py-1 text-sm placeholder:text-shell-muted focus:border-shell-accent focus:outline-none"
        />
        <div className="mt-2 flex gap-0.5 overflow-x-auto text-[10px]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={clsx(
                'shrink-0 rounded px-1.5 py-0.5 uppercase tracking-wide transition-colors',
                active === t.key
                  ? 'bg-shell-accent/20 text-shell-accent'
                  : 'text-shell-muted hover:bg-white/5',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {activeTab?.placeholder ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-shell-muted">
            <div>
              <div className="mb-1 font-medium text-shell-text">{activeTab.label}</div>
              <div>{activeTab.placeholder}</div>
            </div>
          </div>
        ) : active === 'sitemap' ? (
          <SitemapTab query={query} />
        ) : active === 'journeys' ? (
          <JourneysTab query={query} />
        ) : active === 'patterns' ? (
          <PatternsTab query={query} />
        ) : active === 'data' ? (
          <DataTab query={query} />
        ) : active === 'brief' ? (
          <BriefTab query={query} />
        ) : null}
      </div>
      <PanelResizer side="left" width={width} onResize={setWidth} />
    </aside>
  );
}
