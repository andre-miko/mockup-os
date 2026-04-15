import type { FastifyInstance } from 'fastify';
import { getProject } from '../fs/projects';
import { selectAdapter } from '../ai/select';
import type { AiEvent } from '../ai/adapter';

interface ProjectParams {
  id: string;
}
interface PromptBody {
  prompt?: string;
  systemPrompt?: string;
  replaceSystemPrompt?: boolean;
  model?: string;
}
interface GenerateDataBody {
  fixtureId?: string;
  prompt?: string;
  schemaHint?: string;
}

const NDJSON_CONTENT_TYPE = 'application/x-ndjson';

// Writing via `reply.raw` bypasses Fastify's reply pipeline, so headers
// staged by plugins (notably @fastify/cors) aren't sent. We mirror the
// cors allowlist here — any localhost origin gets echoed back — and flush
// directly. Without this, the browser rejects the streaming response with
// a CORS error that surfaces client-side as "Sidecar unreachable".
function flushStreamingHeaders(
  req: { headers: { origin?: string | string[] } },
  reply: {
    getHeaders: () => Record<string, unknown>;
    raw: {
      setHeader: (k: string, v: string | number | readonly string[]) => void;
      flushHeaders?: () => void;
    };
  },
): void {
  for (const [key, value] of Object.entries(reply.getHeaders())) {
    if (value === undefined || value === null) continue;
    reply.raw.setHeader(key, value as string | number | readonly string[]);
  }
  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (origin) {
    try {
      const u = new URL(origin);
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        reply.raw.setHeader('Access-Control-Allow-Origin', origin);
        reply.raw.setHeader('Vary', 'Origin');
      }
    } catch {
      // ignore malformed origin
    }
  }
  reply.raw.setHeader('Content-Type', NDJSON_CONTENT_TYPE);
  reply.raw.setHeader('Cache-Control', 'no-cache, no-transform');
  reply.raw.flushHeaders?.();
}

export function registerAi(app: FastifyInstance): void {
  // GET /api/projects/:id/ai/status — used by the PromptBar to decide
  // whether to render an active textarea or a disabled one.
  app.get<{ Params: ProjectParams }>(
    '/api/projects/:id/ai/status',
    async (req, reply) => {
      const project = getProject(req.params.id);
      if (!project) {
        reply.code(404);
        return { error: 'project_not_found' };
      }
      const resolved = await selectAdapter(project.id, project.rootPath);
      return {
        backend: resolved.adapter.name,
        configured: resolved.configured,
        reason: resolved.reason,
        model: resolved.model,
      };
    },
  );

  // POST /api/projects/:id/ai/prompt — streams NDJSON `AiEvent`s.
  app.post<{ Params: ProjectParams; Body: PromptBody }>(
    '/api/projects/:id/ai/prompt',
    async (req, reply) => {
      const project = getProject(req.params.id);
      if (!project) {
        reply.code(404);
        return { error: 'project_not_found' };
      }
      const userPrompt = req.body?.prompt;
      if (typeof userPrompt !== 'string' || !userPrompt.trim()) {
        reply.code(400);
        return { error: 'missing_prompt' };
      }

      // Switch to raw streaming mode. We bypass Fastify's serializer so
      // we can write NDJSON line-by-line as the adapter emits.
      flushStreamingHeaders(req, reply);

      const controller = new AbortController();
      req.raw.on('close', () => controller.abort());

      const write = (event: AiEvent) => {
        if (reply.raw.writableEnded) return;
        reply.raw.write(JSON.stringify(event) + '\n');
      };

      const resolved = await selectAdapter(project.id, project.rootPath);
      try {
        await resolved.adapter.prompt({
          userPrompt,
          systemPrompt: req.body?.systemPrompt,
          replaceSystemPrompt: req.body?.replaceSystemPrompt ?? false,
          model: req.body?.model ?? resolved.model,
          cwd: project.rootPath,
          signal: controller.signal,
          onEvent: write,
        });
      } catch (err) {
        write({
          type: 'error',
          code: 'unhandled',
          text: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (!reply.raw.writableEnded) reply.raw.end();
      }
      // Fastify expects us to return something. Streaming responses end
      // via `reply.raw.end()`; returning `reply` keeps Fastify happy.
      return reply;
    },
  );

  // POST /api/projects/:id/ai/generate-data — same wire format as /prompt
  // but with a built-in instruction tuned for fixture generation. Phase 8
  // returned 501 here; now it routes through the adapter.
  app.post<{ Params: ProjectParams; Body: GenerateDataBody }>(
    '/api/projects/:id/ai/generate-data',
    async (req, reply) => {
      const project = getProject(req.params.id);
      if (!project) {
        reply.code(404);
        return { error: 'project_not_found' };
      }
      const fixtureId = req.body?.fixtureId;
      const description = req.body?.prompt ?? 'realistic example data';
      const schemaHint = req.body?.schemaHint ?? '(no schema hint provided)';

      const systemPrompt = [
        'You are the data-generator agent for Mockup OS.',
        'Output VALID JSON ONLY — no prose, no backticks, no commentary.',
        'The JSON value will be saved verbatim as a fixture payload.',
        'Match the schema hint precisely. Use realistic but invented values.',
      ].join(' ');

      const userPrompt = [
        `Generate fixture data${fixtureId ? ` for \`${fixtureId}\`` : ''}.`,
        `Description: ${description}`,
        `Schema hint:\n${schemaHint}`,
        'Return ONLY the JSON value.',
      ].join('\n\n');

      flushStreamingHeaders(req, reply);

      const controller = new AbortController();
      req.raw.on('close', () => controller.abort());

      const write = (event: AiEvent) => {
        if (reply.raw.writableEnded) return;
        reply.raw.write(JSON.stringify(event) + '\n');
      };

      const resolved = await selectAdapter(project.id, project.rootPath);
      await resolved.adapter.prompt({
        userPrompt,
        systemPrompt,
        // Fully replace the backend's default prompt so the model outputs
        // raw JSON instead of conversational framing like "Here's the data:".
        replaceSystemPrompt: true,
        cwd: project.rootPath,
        signal: controller.signal,
        onEvent: write,
      });
      if (!reply.raw.writableEnded) reply.raw.end();
      return reply;
    },
  );
}
