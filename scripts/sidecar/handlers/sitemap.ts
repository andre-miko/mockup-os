import type { FastifyInstance } from 'fastify';
import { readSitemap } from '../fs/sitemap';
import { getProject } from '../fs/projects';
import { PathTraversalError, ProjectIdError } from '../fs/paths';

interface ProjectIdParams {
  id: string;
}

export function registerSitemap(app: FastifyInstance): void {
  app.get<{ Params: ProjectIdParams }>(
    '/api/projects/:id/sitemap',
    async (req, reply) => {
      try {
        if (!getProject(req.params.id)) {
          reply.code(404);
          return { error: 'not_found', projectId: req.params.id };
        }
        return readSitemap(req.params.id);
      } catch (err) {
        if (err instanceof ProjectIdError) {
          reply.code(400);
          return { error: 'invalid_project_id', projectId: req.params.id };
        }
        if (err instanceof PathTraversalError) {
          reply.code(400);
          return { error: 'path_traversal' };
        }
        throw err;
      }
    },
  );
}
