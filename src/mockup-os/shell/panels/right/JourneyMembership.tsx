import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRegistry } from '@framework/registry';
import { useBuilderStore } from '@framework/store';
import { useActiveProjectId } from '@framework/hooks';
import type { ScreenDefinition } from '@framework/types';

/**
 * Sentence-form journey membership.
 *
 * Instead of a count badge ("2 journeys"), render one line per journey
 * the current screen appears in: "Step 2 of 3 in **Daily check-in**."
 * Clicking the journey title opens the Journeys tab of the LeftPanel
 * (scoped to this project) so the author can keep working in that context.
 */
export function JourneyMembership({ screen }: { screen: ScreenDefinition }) {
  const projectId = useActiveProjectId();
  const setLeftTab = useBuilderStore((s) => s.setLeftPanelTab);
  const navigate = useNavigate();

  const memberships = useMemo(() => {
    if (!projectId) return [];
    const registry = getRegistry(projectId);
    // Use the journey's own step order — not `screen.journeys` — so the
    // index is always authoritative and consistent with the treeview.
    return registry.journeys
      .filter((j) => j.steps.includes(screen.id))
      .map((j) => {
        const idx = j.steps.indexOf(screen.id);
        return {
          id: j.id,
          title: j.title,
          stepIndex: idx + 1,
          totalSteps: j.steps.length,
          firstStepRoute: registry.getScreen(j.steps[0])?.route,
        };
      });
  }, [projectId, screen.id]);

  if (memberships.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="mb-1.5 text-[10px] uppercase tracking-wider text-shell-muted">
        Journeys
      </div>
      <ul className="flex flex-col gap-1">
        {memberships.map((m) => (
          <li key={m.id} className="text-xs leading-snug">
            Step{' '}
            <span className="font-mono text-shell-text">
              {m.stepIndex} of {m.totalSteps}
            </span>{' '}
            in{' '}
            <button
              type="button"
              onClick={() => {
                setLeftTab('journeys');
                if (m.firstStepRoute) navigate(m.firstStepRoute);
              }}
              className="font-semibold text-shell-accent hover:underline"
              title={`Open "${m.title}" in the Journeys tab`}
            >
              {m.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
