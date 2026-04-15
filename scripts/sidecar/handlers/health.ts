import type { FastifyInstance } from 'fastify';
import { getProjectsRoot, getRepoRoot } from '../fs/paths';

export function registerHealth(app: FastifyInstance): void {
  const payload = () => ({
    ok: true,
    repoRoot: getRepoRoot(),
    projectsRoot: getProjectsRoot(),
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
  });

  app.get('/readyz', async () => payload());
  app.get('/api/health', async () => payload());
}
