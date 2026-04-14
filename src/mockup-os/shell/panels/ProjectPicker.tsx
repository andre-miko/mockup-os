import { useNavigate } from 'react-router-dom';
import { useBuilderStore } from '@framework/store';
import { projects } from '@framework/projects';
import { getRegistry } from '@framework/registry';
import clsx from 'clsx';

/**
 * Top-bar control for switching the active project. Switching also
 * navigates to the destination project's first screen so the viewport
 * doesn't display "no screen at this route".
 */
export function ProjectPicker() {
  const navigate = useNavigate();
  const activeProjectId = useBuilderStore((s) => s.activeProjectId);
  const setActiveProject = useBuilderStore((s) => s.setActiveProject);

  if (projects.length === 0) {
    return (
      <span className="rounded border border-shell-border px-2 py-1 text-xs text-shell-muted">
        No projects
      </span>
    );
  }

  const handleChange = (id: string) => {
    setActiveProject(id);
    const first = getRegistry(id).screens[0];
    navigate(first ? first.route : '/', { replace: true });
  };

  // Single-project mode: render a static label, no need for a dropdown.
  if (projects.length === 1) {
    const only = projects[0];
    return (
      <span
        className="rounded border border-shell-border px-2 py-1 text-xs text-shell-text"
        title={only.meta.description}
      >
        {only.meta.name}
      </span>
    );
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-shell-muted">
      <span className="uppercase tracking-wider">Project</span>
      <select
        value={activeProjectId ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        className={clsx(
          'rounded border border-shell-border bg-shell-bg px-2 py-1 text-xs text-shell-text',
          'focus:border-shell-accent focus:outline-none',
        )}
      >
        {projects.map((p) => (
          <option key={p.meta.id} value={p.meta.id}>
            {p.meta.name}
          </option>
        ))}
      </select>
    </label>
  );
}
