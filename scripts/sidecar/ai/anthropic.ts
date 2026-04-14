/**
 * Anthropic SDK adapter.
 *
 * Streams via the `messages.stream` API. The system prompt + project
 * brief are sent as cacheable blocks (`cache_control: ephemeral`) so
 * subsequent prompts within the same project hit the prompt cache.
 *
 * Requires `ANTHROPIC_API_KEY` in env. Default model is `claude-sonnet-4-6`
 * — projects can override via `project.json#ai.model`.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AiAdapter, PromptArgs } from './adapter';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export const anthropicAdapter: AiAdapter = {
  name: 'anthropic',

  async isConfigured() {
    if (!process.env.ANTHROPIC_API_KEY) {
      return { ok: false, reason: 'ANTHROPIC_API_KEY is not set' };
    }
    return { ok: true };
  },

  async prompt(args: PromptArgs) {
    const c = getClient();
    if (!c) {
      args.onEvent({
        type: 'error',
        code: 'not_configured',
        text: 'ANTHROPIC_API_KEY is not set',
      });
      return;
    }

    // Build cacheable system blocks. Anthropic charges full price on the
    // first turn, then ~10% on subsequent reads of the same cached block.
    const system: Anthropic.Messages.TextBlockParam[] = [];
    if (args.systemPrompt) {
      system.push({
        type: 'text',
        text: args.systemPrompt,
        cache_control: { type: 'ephemeral' },
      });
    }

    try {
      const stream = c.messages.stream({
        model: args.model ?? DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        system: system.length > 0 ? system : undefined,
        messages: [{ role: 'user', content: args.userPrompt }],
      });

      let aborted = false;
      const onAbort = () => {
        aborted = true;
        try {
          stream.abort();
        } catch {
          // ignore
        }
      };
      args.signal?.addEventListener('abort', onAbort, { once: true });

      stream.on('text', (delta) => {
        args.onEvent({ type: 'chunk', text: delta });
      });

      const final = await stream.finalMessage();
      args.signal?.removeEventListener('abort', onAbort);

      if (aborted) {
        args.onEvent({ type: 'error', code: 'aborted', text: 'Cancelled by client' });
      } else {
        args.onEvent({
          type: 'meta',
          data: {
            backend: 'anthropic',
            model: final.model,
            usage: final.usage,
            stopReason: final.stop_reason,
          },
        });
        args.onEvent({ type: 'done' });
      }
    } catch (err) {
      args.onEvent({
        type: 'error',
        code: 'api_error',
        text: err instanceof Error ? err.message : String(err),
      });
    }
  },
};
