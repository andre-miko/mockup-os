import type { AiAdapter } from './adapter';

/**
 * Fallback adapter for environments with no AI configured.
 * Returns a single `error` event with a friendly message so the UI can
 * disable AI controls without crashing.
 */
export const noneAdapter: AiAdapter = {
  name: 'none',
  async isConfigured() {
    return {
      ok: false,
      reason:
        'No AI backend configured. Install the Claude Code CLI or set ANTHROPIC_API_KEY, then restart the sidecar.',
    };
  },
  async prompt({ onEvent }) {
    onEvent({
      type: 'error',
      code: 'not_configured',
      text:
        'No AI backend is configured. Set `ai.backend` in project.json to ' +
        '"claude-code" or "anthropic", and ensure the corresponding credential is available.',
    });
  },
};
