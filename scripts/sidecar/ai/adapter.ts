/**
 * AI adapter contract.
 *
 * The sidecar exposes one HTTP surface (`/api/projects/:id/ai/*`) backed
 * by one of two implementations:
 *
 *   - `claude-code` — spawn the local Claude Code CLI as a child process
 *                     and stream stdout. Uses the user's existing auth and
 *                     all the agents/skills/commands under `/.claude/`.
 *
 *   - `anthropic`   — call the Anthropic SDK directly with prompt caching.
 *                     Requires `ANTHROPIC_API_KEY`. Cleaner streaming and
 *                     observability but doesn't see local agents.
 *
 *   - `none`        — adapter that returns immediately with a clear "not
 *                     configured" event so the UI can degrade gracefully.
 *
 * Adapters all stream `AiEvent`s through a callback. They MUST resolve the
 * returned Promise after the final `done` or `error` event so the HTTP
 * handler can close the connection.
 */

export type AiBackend = 'claude-code' | 'anthropic' | 'none';

export interface AiEvent {
  /** Discriminator. The frontend treats unknown types as no-ops. */
  type: 'chunk' | 'tool' | 'meta' | 'done' | 'error';
  /** Text payload — present on `chunk` and sometimes on `error`. */
  text?: string;
  /** Free-form structured data. Used by `meta` (model, usage) + `tool`. */
  data?: unknown;
  /** Error code, e.g. `not_configured`, `process_failed`, `api_error`. */
  code?: string;
}

export interface PromptArgs {
  /** Free-form user prompt. */
  userPrompt: string;
  /** Optional system prompt. Cached when the adapter supports it. */
  systemPrompt?: string;
  /**
   * When true, the adapter should treat `systemPrompt` as the authoritative
   * system prompt rather than appending it to the backend's default. Use this
   * for structured completions (brief expansion, fixture generation) where
   * Claude Code's conversational default prompt would otherwise leak into
   * the output as "Would you like me to…" framing.
   */
  replaceSystemPrompt?: boolean;
  /** Optional model id override (e.g. `claude-sonnet-4-6`). */
  model?: string;
  /** Working directory. Adapters may set the spawn cwd to this. */
  cwd?: string;
  /** Stream callback. Adapters call this synchronously per event. */
  onEvent: (e: AiEvent) => void;
  /** Abort signal — if signalled the adapter stops streaming and resolves. */
  signal?: AbortSignal;
}

export interface AiAdapter {
  name: AiBackend;
  /** True iff the adapter has the credentials/binary it needs to run. */
  isConfigured(): Promise<{ ok: boolean; reason?: string }>;
  /** Send a single prompt; emit events; resolve when done. */
  prompt(args: PromptArgs): Promise<void>;
}
