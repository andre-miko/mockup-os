import type { FastifyInstance } from 'fastify';
import { getProjectsRoot, getRepoRoot } from '../fs/paths';

export function registerHealth(app: FastifyInstance): void {
  app.get('/readyz', async () => ({
    ok: true,
    repoRoot: getRepoRoot(),
    projectsRoot: getProjectsRoot(),
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
  }));
}
