import type { FastifyInstance } from 'fastify';
import { getProject, listProjects } from '../fs/projects';
import { ProjectIdError } from '../fs/paths';

interface ProjectIdParams {
  id: string;
}

export function registerProjects(app: FastifyInstance): void {
  app.get('/api/projects', async () => {
    const projects = listProjects();
    return projects.map(({ id, name, description, version }) => ({
      id,
      name,
      description,
      version,
    }));
  });

  app.get<{ Params: ProjectIdParams }>('/api/projects/:id', async (req, reply) => {
    try {
      const project = getProject(req.params.id);
      if (!project) {
        reply.code(404);
        return { error: 'not_found', projectId: req.params.id };
      }
      const { id, name, description, version, rootPath } = project;
      return { id, name, description, version, rootPath };
    } catch (err) {
      if (err instanceof ProjectIdError) {
        reply.code(400);
        return { error: 'invalid_project_id', projectId: req.params.id };
      }
      throw err;
    }
  });
}
