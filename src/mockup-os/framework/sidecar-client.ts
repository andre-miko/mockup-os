/**
 * Typed client for the local sidecar (see `scripts/sidecar/server.ts`).
 *
 * The frontend must keep working if the sidecar is offline. Every method
 * here resolves to a tagged union: `{ status: 'ok', data }` on success,
 * `{ status: 'offline' }` when the server can't be reached, or
 * `{ status: 'error', code, message }` on an HTTP/server error. Callers
 * render whatever UI they want for each — no throw-and-crash in render.
 */

export interface SidecarProject {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface SidecarProjectDetail extends SidecarProject {
  rootPath: string;
}

export interface BriefFile {
  name: string;
  content: string;
}

export interface SidecarBrief {
  exists: boolean;
  files: BriefFile[];
}

export interface SidecarSitemap {
  exists: boolean;
  raw: string;
}

export interface SidecarHealth {
  ok: true;
  repoRoot: string;
  projectsRoot: string;
  pid: number;
  uptimeSeconds: number;
}

export type SidecarResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'offline' }
  | { status: 'error'; code: number; message: string };

const BASE_URL = (import.meta.env.VITE_SIDECAR_URL as string | undefined) ?? 'http://127.0.0.1:5179';

const DEFAULT_TIMEOUT_MS = 4000;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<SidecarResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body && typeof body.error === 'string') message = body.error;
      } catch {
        // ignore json parse errors; keep default message
      }
      return { status: 'error', code: res.status, message };
    }
    const data = (await res.json()) as T;
    return { status: 'ok', data };
  } catch {
    return { status: 'offline' };
  } finally {
    window.clearTimeout(timer);
  }
}

export interface DuplicateScreenResult {
  newScreenId: string;
  newRoute: string;
  rewrotePath: string;
}

export interface DeleteScreenResult {
  removedScreenId: string;
  rewrotePath: string;
}

export interface SetScreenStatusResult {
  screenId: string;
  status: string;
  reviewLogPath: string;
}

export interface SetScreenFieldResult {
  screenId: string;
  field: string;
  previousValue: string | undefined;
  newValue: string;
  rewrotePath: string;
}

export interface KnownGapPayload {
  id: string;
  description: string;
  severity: 'info' | 'warn' | 'blocker';
}

export interface SetKnownGapsResult {
  screenId: string;
  count: number;
  rewrotePath: string;
}

export interface FixtureFileSummary {
  id: string;
  path: string;
  bytes: number;
  modifiedAt: string;
}

export interface FixturesList {
  files: FixtureFileSummary[];
}

export interface FixtureContent<T = unknown> {
  id: string;
  data: T;
}

export interface WriteFixtureResult {
  id: string;
  path: string;
  bytes: number;
}

export interface AiStatus {
  backend: 'claude-code' | 'anthropic' | 'none';
  configured: boolean;
  reason?: string;
  model?: string;
}

export interface AiEvent {
  type: 'chunk' | 'tool' | 'meta' | 'done' | 'error';
  text?: string;
  data?: unknown;
  code?: string;
}

export interface AiPromptArgs {
  prompt: string;
  systemPrompt?: string;
  /**
   * When true, the sidecar hands `systemPrompt` to the backend as the
   * authoritative system prompt (replacing Claude Code's default). Set for
   * structured completions where we don't want conversational framing.
   */
  replaceSystemPrompt?: boolean;
  model?: string;
  signal?: AbortSignal;
  onEvent: (e: AiEvent) => void;
}

export interface WriteBriefResult {
  fileName: string;
  path: string;
  bytes: number;
}

export const sidecar = {
  baseUrl: BASE_URL,

  health(): Promise<SidecarResult<SidecarHealth>> {
    return fetchJson<SidecarHealth>('/readyz');
  },

  listProjects(): Promise<SidecarResult<SidecarProject[]>> {
    return fetchJson<SidecarProject[]>('/api/projects');
  },

  getProject(id: string): Promise<SidecarResult<SidecarProjectDetail>> {
    return fetchJson<SidecarProjectDetail>(`/api/projects/${encodeURIComponent(id)}`);
  },

  getBrief(id: string): Promise<SidecarResult<SidecarBrief>> {
    return fetchJson<SidecarBrief>(`/api/projects/${encodeURIComponent(id)}/brief`);
  },

  getSitemap(id: string): Promise<SidecarResult<SidecarSitemap>> {
    return fetchJson<SidecarSitemap>(`/api/projects/${encodeURIComponent(id)}/sitemap`);
  },

  duplicateScreen(
    projectId: string,
    screenId: string,
  ): Promise<SidecarResult<DuplicateScreenResult>> {
    return fetchJson<DuplicateScreenResult>(
      `/api/projects/${encodeURIComponent(projectId)}/screens/${encodeURIComponent(screenId)}/duplicate`,
      { method: 'POST' },
    );
  },

  deleteScreen(
    projectId: string,
    screenId: string,
  ): Promise<SidecarResult<DeleteScreenResult>> {
    return fetchJson<DeleteScreenResult>(
      `/api/projects/${encodeURIComponent(projectId)}/screens/${encodeURIComponent(screenId)}`,
      { method: 'DELETE' },
    );
  },

  setScreenStatus(
    projectId: string,
    screenId: string,
    status: string,
  ): Promise<SidecarResult<SetScreenStatusResult>> {
    return fetchJson<SetScreenStatusResult>(
      `/api/projects/${encodeURIComponent(projectId)}/screens/${encodeURIComponent(screenId)}/status`,
      { method: 'POST', body: JSON.stringify({ status }) },
    );
  },

  setScreenField(
    projectId: string,
    screenId: string,
    field: 'title' | 'description',
    value: string,
  ): Promise<SidecarResult<SetScreenFieldResult>> {
    return fetchJson<SetScreenFieldResult>(
      `/api/projects/${encodeURIComponent(projectId)}/screens/${encodeURIComponent(screenId)}/field`,
      { method: 'POST', body: JSON.stringify({ field, value }) },
    );
  },

  setScreenKnownGaps(
    projectId: string,
    screenId: string,
    gaps: KnownGapPayload[],
  ): Promise<SidecarResult<SetKnownGapsResult>> {
    return fetchJson<SetKnownGapsResult>(
      `/api/projects/${encodeURIComponent(projectId)}/screens/${encodeURIComponent(screenId)}/known-gaps`,
      { method: 'POST', body: JSON.stringify({ gaps }) },
    );
  },

  listFixtures(projectId: string): Promise<SidecarResult<FixturesList>> {
    return fetchJson<FixturesList>(`/api/projects/${encodeURIComponent(projectId)}/fixtures`);
  },

  getFixture<T = unknown>(
    projectId: string,
    fixtureId: string,
  ): Promise<SidecarResult<FixtureContent<T>>> {
    return fetchJson<FixtureContent<T>>(
      `/api/projects/${encodeURIComponent(projectId)}/fixtures/${encodeURIComponent(fixtureId)}`,
    );
  },

  writeFixture(
    projectId: string,
    fixtureId: string,
    data: unknown,
  ): Promise<SidecarResult<WriteFixtureResult>> {
    return fetchJson<WriteFixtureResult>(
      `/api/projects/${encodeURIComponent(projectId)}/fixtures/${encodeURIComponent(fixtureId)}`,
      { method: 'POST', body: JSON.stringify({ data }) },
    );
  },

  writeBriefFile(
    projectId: string,
    fileName: string,
    content: string,
  ): Promise<SidecarResult<WriteBriefResult>> {
    return fetchJson<WriteBriefResult>(
      `/api/projects/${encodeURIComponent(projectId)}/brief/${encodeURIComponent(fileName)}`,
      { method: 'POST', body: JSON.stringify({ content }) },
    );
  },

  aiStatus(projectId: string): Promise<SidecarResult<AiStatus>> {
    return fetchJson<AiStatus>(
      `/api/projects/${encodeURIComponent(projectId)}/ai/status`,
    );
  },

  /**
   * Stream a prompt through the sidecar. Resolves once the server closes
   * the connection (after `done` or `error`). Each NDJSON event is parsed
   * and delivered via `onEvent` synchronously.
   *
   * Network failures surface as a synthetic `error` event before resolving
   * so callers don't need a separate offline branch.
   */
  async streamPrompt(
    projectId: string,
    args: AiPromptArgs,
  ): Promise<{ status: 'ok' | 'offline' | 'error'; code?: number }> {
    const url = `${BASE_URL}/api/projects/${encodeURIComponent(projectId)}/ai/prompt`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: args.prompt,
          systemPrompt: args.systemPrompt,
          replaceSystemPrompt: args.replaceSystemPrompt,
          model: args.model,
        }),
        signal: args.signal,
      });
    } catch {
      args.onEvent({ type: 'error', code: 'offline', text: 'Sidecar unreachable.' });
      return { status: 'offline' };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      args.onEvent({
        type: 'error',
        code: 'http_error',
        text: body || `HTTP ${res.status}`,
      });
      return { status: 'error', code: res.status };
    }
    if (!res.body) {
      args.onEvent({ type: 'error', code: 'no_body', text: 'No response body.' });
      return { status: 'error', code: 0 };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf('\n');
      while (idx >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) {
          try {
            args.onEvent(JSON.parse(line) as AiEvent);
          } catch {
            // Skip malformed lines rather than crash the stream.
          }
        }
        idx = buffer.indexOf('\n');
      }
    }
    // Flush any trailing chunk that wasn't newline-terminated.
    const tail = buffer.trim();
    if (tail) {
      try {
        args.onEvent(JSON.parse(tail) as AiEvent);
      } catch {
        // ignore
      }
    }
    return { status: 'ok' };
  },

  /**
   * Stream a fixture-generation request. Same NDJSON wire format as
   * `streamPrompt`; the sidecar injects a data-generator system prompt so
   * the model returns JSON only.
   */
  async streamGenerateData(
    projectId: string,
    args: {
      fixtureId: string;
      prompt?: string;
      schemaHint?: string;
      signal?: AbortSignal;
      onEvent: (e: AiEvent) => void;
    },
  ): Promise<{ status: 'ok' | 'offline' | 'error'; code?: number }> {
    const url = `${BASE_URL}/api/projects/${encodeURIComponent(projectId)}/ai/generate-data`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixtureId: args.fixtureId,
          prompt: args.prompt,
          schemaHint: args.schemaHint,
        }),
        signal: args.signal,
      });
    } catch {
      args.onEvent({ type: 'error', code: 'offline', text: 'Sidecar unreachable.' });
      return { status: 'offline' };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      args.onEvent({
        type: 'error',
        code: 'http_error',
        text: body || `HTTP ${res.status}`,
      });
      return { status: 'error', code: res.status };
    }
    if (!res.body) {
      args.onEvent({ type: 'error', code: 'no_body', text: 'No response body.' });
      return { status: 'error', code: 0 };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx = buffer.indexOf('\n');
      while (idx >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (line) {
          try {
            args.onEvent(JSON.parse(line) as AiEvent);
          } catch {
            // skip malformed line
          }
        }
        idx = buffer.indexOf('\n');
      }
    }
    const tail = buffer.trim();
    if (tail) {
      try {
        args.onEvent(JSON.parse(tail) as AiEvent);
      } catch {
        // ignore
      }
    }
    return { status: 'ok' };
  },
};
