import type { FastifyInstance } from 'fastify';
import {
  duplicateScreen,
  deleteScreen,
  setScreenStatus,
  setScreenStringField,
  setScreenKnownGaps,
  IndexShapeError,
  ScreenNotFoundError,
  type KnownGapInput,
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

interface FieldBody {
  field?: string;
  value?: string;
}

interface KnownGapsBody {
  gaps?: unknown;
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

  // POST /api/projects/:id/screens/:screenId/field
  app.post<{ Params: ScreenParams; Body: FieldBody }>(
    '/api/projects/:id/screens/:screenId/field',
    async (req, reply) => {
      try {
        const project = getProject(req.params.id);
        if (!project) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        const field = req.body?.field;
        const value = req.body?.value;
        if (typeof field !== 'string' || !field) {
          reply.code(400);
          return { error: 'missing_field_in_body' };
        }
        if (typeof value !== 'string') {
          reply.code(400);
          return { error: 'missing_value_in_body' };
        }
        const result = setScreenStringField(
          project.rootPath,
          req.params.screenId,
          field,
          value,
        );
        return result;
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );

  // POST /api/projects/:id/screens/:screenId/known-gaps
  app.post<{ Params: ScreenParams; Body: KnownGapsBody }>(
    '/api/projects/:id/screens/:screenId/known-gaps',
    async (req, reply) => {
      try {
        const project = getProject(req.params.id);
        if (!project) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        const rawGaps = req.body?.gaps;
        if (!Array.isArray(rawGaps)) {
          reply.code(400);
          return { error: 'gaps_must_be_array' };
        }
        const gaps: KnownGapInput[] = [];
        for (const g of rawGaps) {
          if (!g || typeof g !== 'object') {
            reply.code(400);
            return { error: 'gap_entry_not_object' };
          }
          const entry = g as Record<string, unknown>;
          if (
            typeof entry.id !== 'string' ||
            typeof entry.description !== 'string' ||
            typeof entry.severity !== 'string'
          ) {
            reply.code(400);
            return { error: 'gap_entry_missing_fields' };
          }
          gaps.push({
            id: entry.id,
            description: entry.description,
            severity: entry.severity as KnownGapInput['severity'],
          });
        }
        const result = setScreenKnownGaps(project.rootPath, req.params.screenId, gaps);
        return result;
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
  if (err instanceof Error && err.message.startsWith('invalid field')) {
    reply.code(400);
    return { error: 'invalid_field', message: err.message };
  }
  if (err instanceof Error && err.message.startsWith('invalid severity')) {
    reply.code(400);
    return { error: 'invalid_severity', message: err.message };
  }
  if (err instanceof Error && err.message.startsWith('duplicate known-gap id')) {
    reply.code(400);
    return { error: 'duplicate_gap_id', message: err.message };
  }
  // Unknown — surface as 500 with the message for diagnostics.
  reply.code(500);
  return { error: 'internal', message: err instanceof Error ? err.message : String(err) };
}
