/**
 * Mockup OS sidecar.
 *
 * A small Fastify server that the frontend talks to for any operation that
 * needs filesystem access or, later, AI invocation. Reads happen here in
 * Phase 3; writes (Phase 6) and AI streaming (Phase 9) bolt on as additional
 * handler modules.
 *
 * Intended for localhost use only. No auth. If this ever leaves the box we
 * add a token check first.
 *
 * Run: `npm run sidecar` (from src/mockup-os/).
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerHealth } from './handlers/health';
import { registerProjects } from './handlers/projects';
import { registerBrief } from './handlers/brief';
import { registerSitemap } from './handlers/sitemap';
import { registerScreens } from './handlers/screens';
import { registerFixtures } from './handlers/fixtures';
import { registerAi } from './handlers/ai';
import { registerHandoff } from './handlers/handoff';
import { getProjectsRoot, getRepoRoot } from './fs/paths';

const PORT = Number(process.env.SIDECAR_PORT ?? 5179);
const HOST = process.env.SIDECAR_HOST ?? '127.0.0.1';

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: process.env.SIDECAR_LOG_LEVEL ?? 'info',
      // Pretty-printed logs when running interactively. Use NDJSON in CI by
      // setting `SIDECAR_LOG_LEVEL=info` without `SIDECAR_PRETTY=1`.
      ...(process.env.SIDECAR_PRETTY === '0'
        ? {}
        : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
    },
  });

  // CORS: allow any localhost port in dev so the picker doesn't break when
  // Vite takes an alternate port (5174, 5175, ...).
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      try {
        const u = new URL(origin);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          return cb(null, true);
        }
      } catch {
        // fall through
      }
      cb(new Error('origin not allowed'), false);
    },
    credentials: false,
  });

  registerHealth(app);
  registerProjects(app);
  registerBrief(app);
  registerSitemap(app);
  registerScreens(app);
  registerFixtures(app);
  registerAi(app);
  registerHandoff(app);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(
      { repoRoot: getRepoRoot(), projectsRoot: getProjectsRoot() },
      `sidecar ready on http://${HOST}:${PORT}`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
