import type { FastifyInstance, FastifyReply } from 'fastify';
import { readBrief, writeBriefFile, BriefFileNameError } from '../fs/brief';
import { getProject } from '../fs/projects';
import { PathTraversalError, ProjectIdError } from '../fs/paths';

interface ProjectIdParams {
  id: string;
}
interface BriefFileParams extends ProjectIdParams {
  fileName: string;
}
interface WriteBriefBody {
  content?: string;
}

export function registerBrief(app: FastifyInstance): void {
  app.get<{ Params: ProjectIdParams }>(
    '/api/projects/:id/brief',
    async (req, reply) => {
      try {
        if (!getProject(req.params.id)) {
          reply.code(404);
          return { error: 'not_found', projectId: req.params.id };
        }
        return readBrief(req.params.id);
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );

  // POST /api/projects/:id/brief/:fileName
  // Body: { content: "..." } — atomic write.
  app.post<{ Params: BriefFileParams; Body: WriteBriefBody }>(
    '/api/projects/:id/brief/:fileName',
    async (req, reply) => {
      try {
        if (!getProject(req.params.id)) {
          reply.code(404);
          return { error: 'not_found', projectId: req.params.id };
        }
        const content = req.body?.content;
        if (typeof content !== 'string') {
          reply.code(400);
          return { error: 'missing_content_in_body' };
        }
        const result = writeBriefFile(req.params.id, req.params.fileName, content);
        return { fileName: req.params.fileName, ...result };
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );
}

function mapError(reply: FastifyReply, err: unknown) {
  if (err instanceof BriefFileNameError) {
    reply.code(400);
    return { error: 'invalid_brief_filename', fileName: err.fileName };
  }
  if (err instanceof ProjectIdError) {
    reply.code(400);
    return { error: 'invalid_project_id' };
  }
  if (err instanceof PathTraversalError) {
    reply.code(400);
    return { error: 'path_traversal' };
  }
  reply.code(500);
  return { error: 'internal', message: err instanceof Error ? err.message : String(err) };
}
