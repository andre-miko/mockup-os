import type { FastifyInstance, FastifyReply } from 'fastify';
import { getProject } from '../fs/projects';
import { PathTraversalError, ProjectIdError } from '../fs/paths';
import {
  FixtureIdError,
  listFixtureFiles,
  readFixtureFile,
  writeFixtureFile,
} from '../fs/fixtures';

interface ProjectParams {
  id: string;
}
interface FixtureParams extends ProjectParams {
  fixtureId: string;
}
interface FixtureBody {
  data?: unknown;
}

export function registerFixtures(app: FastifyInstance): void {
  // GET /api/projects/:id/fixtures
  // Returns the filesystem-level view of every JSON file under data/.
  // The frontend prefers the in-memory registry for rendering but uses
  // this endpoint for file-size / mtime metadata and to confirm a write.
  app.get<{ Params: ProjectParams }>('/api/projects/:id/fixtures', async (req, reply) => {
    try {
      if (!getProject(req.params.id)) {
        reply.code(404);
        return { error: 'project_not_found', projectId: req.params.id };
      }
      return { files: listFixtureFiles(req.params.id) };
    } catch (err) {
      return mapError(reply, err);
    }
  });

  // GET /api/projects/:id/fixtures/:fixtureId
  app.get<{ Params: FixtureParams }>(
    '/api/projects/:id/fixtures/:fixtureId',
    async (req, reply) => {
      try {
        if (!getProject(req.params.id)) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        const data = readFixtureFile(req.params.id, req.params.fixtureId);
        return { id: req.params.fixtureId, data };
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );

  // POST /api/projects/:id/fixtures/:fixtureId
  // Body: { data: <any JSON> } — replaces the fixture payload atomically.
  app.post<{ Params: FixtureParams; Body: FixtureBody }>(
    '/api/projects/:id/fixtures/:fixtureId',
    async (req, reply) => {
      try {
        if (!getProject(req.params.id)) {
          reply.code(404);
          return { error: 'project_not_found', projectId: req.params.id };
        }
        if (!('data' in (req.body ?? {}))) {
          reply.code(400);
          return { error: 'missing_data_in_body' };
        }
        const { path, bytes } = writeFixtureFile(
          req.params.id,
          req.params.fixtureId,
          req.body?.data,
        );
        return {
          id: req.params.fixtureId,
          path,
          bytes,
        };
      } catch (err) {
        return mapError(reply, err);
      }
    },
  );

  // The `/api/projects/:id/ai/generate-data` route lives in `handlers/ai.ts`
  // now (Phase 9); it streams NDJSON via the adapter rather than returning 501.
}

function mapError(reply: FastifyReply, err: unknown) {
  if (err instanceof FixtureIdError) {
    reply.code(400);
    return { error: 'invalid_fixture_id', fixtureId: err.fixtureId };
  }
  if (err instanceof ProjectIdError) {
    reply.code(400);
    return { error: 'invalid_project_id' };
  }
  if (err instanceof PathTraversalError) {
    reply.code(400);
    return { error: 'path_traversal' };
  }
  if (err instanceof Error && err.message.startsWith('Fixture file not found')) {
    reply.code(404);
    return { error: 'fixture_not_found', message: err.message };
  }
  reply.code(500);
  return { error: 'internal', message: err instanceof Error ? err.message : String(err) };
}
