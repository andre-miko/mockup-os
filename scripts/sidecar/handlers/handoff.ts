/**
 * POST /api/projects/:id/handoff — run the handoff builder inline (no
 * subprocess) and stream progress to the client as NDJSON `log` events.
 *
 * Calling `buildHandoff` directly avoids spawning a child process, which
 * on Windows trips over paths containing spaces. Sync underlying fs ops
 * make the whole thing finish in well under a second for typical projects.
 *
 * Snapshots are NOT triggered here — they need a running dev server,
 * which the sidecar can't reliably orchestrate. Run `npm run snapshot`
 * separately or pre-populate `Projects/<id>/artifacts/snapshots/`.
 */

import { existsSync, statSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { discoverProjects } from '../../lib/discover-projects';
import { buildHandoff } from '../../build-handoff';
import { getProject } from '../fs/projects';

interface ProjectParams {
  id: string;
}

interface HandoffEvent {
  type: 'log' | 'done' | 'error';
  text?: string;
  manifestPath?: string;
  manifestExists?: boolean;
  snapshots?: number;
  warnings?: number;
  code?: string;
}

export function registerHandoff(app: FastifyInstance): void {
  app.post<{ Params: ProjectParams }>(
    '/api/projects/:id/handoff',
    async (req, reply) => {
      const sidecarProject = getProject(req.params.id);
      if (!sidecarProject) {
        reply.code(404);
        return { error: 'project_not_found', projectId: req.params.id };
      }

      reply.raw.setHeader('Content-Type', 'application/x-ndjson');
      reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
      reply.raw.flushHeaders?.();

      const write = (event: HandoffEvent) => {
        if (reply.raw.writableEnded) return;
        reply.raw.write(JSON.stringify(event) + '\n');
      };

      try {
        // Re-discover the project through the build-side discovery so we
        // get the parsed `DiscoveredProject` shape `buildHandoff` expects.
        const all = await discoverProjects();
        const target = all.find((p) => p.meta.id === req.params.id);
        if (!target) {
          write({
            type: 'error',
            code: 'project_not_discovered',
            text: 'Project visible to the sidecar but not to the discovery layer.',
          });
          if (!reply.raw.writableEnded) reply.raw.end();
          return reply;
        }

        const result = buildHandoff(target, {
          log: (msg) => write({ type: 'log', text: msg }),
        });

        write({
          type: 'done',
          manifestPath: result.manifestPath,
          manifestExists:
            existsSync(result.manifestPath) && statSync(result.manifestPath).isFile(),
          snapshots: result.snapshots,
          warnings: result.warnings,
        });
      } catch (err) {
        write({
          type: 'error',
          code: 'build_failed',
          text: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!reply.raw.writableEnded) reply.raw.end();
      }

      return reply;
    },
  );
}
