import type { FastifyInstance } from 'fastify';
import {
  duplicateScreen,
  deleteScreen,
  setScreenStatus,
  IndexShapeError,
  ScreenNotFoundError,
} from '../fs/screens-ast';
import { appendReviewLog } from '../fs/review-log';
import { getProject } from '../fs/projects';
import { PathTraversalError, ProjectIdError } from '../fs/paths';

interface ScreenParams {
  id: string;        // project id
  screenId: string;
}

interface StatusBody {
  status?: string;
}

export function registerScreens(app: FastifyInstance): void {
  // POST /api/projects/:id/screens/:screenId/duplicate
  app.post<{ Params: ScreenParams }>(
    '/api/projects/:id/screens/:screenId/duplicate',
    async (req, reply) => {
      try {
        const project = getProject(req.params.id);
        if (!project) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        const result = duplicateScreen(project.rootPath, req.params.screenId);
        return result;
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );

  // DELETE /api/projects/:id/screens/:screenId
  app.delete<{ Params: ScreenParams }>(
    '/api/projects/:id/screens/:screenId',
    async (req, reply) => {
      try {
        const project = getProject(req.params.id);
        if (!project) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        const result = deleteScreen(project.rootPath, req.params.screenId);
        return result;
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );

  // POST /api/projects/:id/screens/:screenId/status
  app.post<{ Params: ScreenParams; Body: StatusBody }>(
    '/api/projects/:id/screens/:screenId/status',
    async (req, reply) => {
      try {
        const project = getProject(req.params.id);
        if (!project) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        const status = req.body?.status;
        if (typeof status !== 'string' || !status) {
          reply.code(400);
          return { error: 'missing_status_in_body' };
        }
        const result = setScreenStatus(project.rootPath, req.params.screenId, status);
        const reviewLogPath = appendReviewLog(project.rootPath, {
          screenId: result.screenId,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
        });
        return {
          screenId: result.screenId,
          status: result.newStatus,
          previousStatus: result.previousStatus,
          rewrotePath: result.rewrotePath,
          reviewLogPath,
        };
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );
}

function mapError(reply: import('fastify').FastifyReply, err: unknown) {
  if (err instanceof ScreenNotFoundError) {
    reply.code(404);
    return { error: 'screen_not_found', screenId: err.screenId };
  }
  if (err instanceof IndexShapeError) {
    reply.code(422);
    return { error: 'index_shape_unsupported', message: err.message };
  }
  if (err instanceof ProjectIdError) {
    reply.code(400);
    return { error: 'invalid_project_id' };
  }
  if (err instanceof PathTraversalError) {
    reply.code(400);
    return { error: 'path_traversal' };
  }
  if (err instanceof Error && err.message.startsWith('invalid status')) {
    reply.code(400);
    return { error: 'invalid_status', message: err.message };
  }
  // Unknown — surface as 500 with the message for diagnostics.
  reply.code(500);
  return { error: 'internal', message: err instanceof Error ? err.message : String(err) };
}
