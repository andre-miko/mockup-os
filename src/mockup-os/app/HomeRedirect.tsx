import { Navigate } from 'react-router-dom';
import { getRegistry } from '@framework/registry';
import { useActiveProject, useActiveProjectId } from '@framework/hooks';

/**
 * Default landing: the first registered screen of the active project.
 * Keeps `/` useful without hard-coding a product prefix.
 */
export function HomeRedirect() {
  const projectId = useActiveProjectId();
  const project = useActiveProject();

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-sm text-zinc-600">
        No projects discovered. Add a folder under <code className="ml-1">/Projects/</code>.
      </div>
    );
  }

  const first = getRegistry(projectId).screens[0];
  if (!first) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-sm text-zinc-600">
        <div>
          Project <strong>{project.name}</strong> has no screens registered yet.
        </div>
        <div className="text-xs text-zinc-500">
          Add screens to{' '}
          <code>/Projects/{project.id}/mockups/index.ts</code>.
        </div>
      </div>
    );
  }
  return <Navigate to={first.route} replace />;
}
