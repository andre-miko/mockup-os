/**
 * Claude Code CLI adapter.
 *
 * Spawns `claude -p "<prompt>"` (Print mode) with the project as cwd so
 * the CLI's working-directory awareness picks up `.claude/` agents/skills.
 * Stdout is streamed to the caller as `chunk` events; errors surface as
 * `error` events. We intentionally use plain text mode rather than
 * `--output-format stream-json` for now — keeps the streaming model
 * simple and avoids depending on the exact event schema. Phase 10 can
 * upgrade to JSON streaming once we wire agents in.
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import type { AiAdapter, PromptArgs } from './adapter';

function detectClaudeCli(): { ok: true; bin: string } | { ok: false; reason: string } {
  // Try to locate `claude` on PATH. We don't actually invoke it here —
  // `which`/`where` is the cheapest reliable check across platforms.
  const probe = process.platform === 'win32' ? 'where' : 'which';
  try {
    const result = spawnSyncShim(probe, ['claude']);
    if (result.status === 0) {
      const bin = result.stdout.split(/\r?\n/).filter(Boolean)[0];
      if (bin && existsSync(bin)) return { ok: true, bin };
    }
  } catch {
    // fall through
  }
  return { ok: false, reason: '`claude` CLI not found on PATH' };
}

// Avoid importing child_process.spawnSync at module load time so tests can
// stub it later. We re-implement a tiny synchronous wrapper around `spawn`
// when we need to probe — only invoked from `isConfigured`.
function spawnSyncShim(cmd: string, args: string[]): { status: number; stdout: string } {
  // Lazy require — keeps the type surface narrow.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cp = require('node:child_process') as typeof import('node:child_process');
  const r = cp.spawnSync(cmd, args, { encoding: 'utf8' });
  return { status: r.status ?? -1, stdout: r.stdout ?? '' };
}

export const claudeCodeAdapter: AiAdapter = {
  name: 'claude-code',

  async isConfigured() {
    const detect = detectClaudeCli();
    if (!detect.ok) return { ok: false, reason: detect.reason };
    return { ok: true };
  },

  async prompt(args: PromptArgs) {
    const detect = detectClaudeCli();
    if (!detect.ok) {
      args.onEvent({
        type: 'error',
        code: 'cli_not_found',
        text: detect.reason,
      });
      return;
    }
    return runClaude(detect.bin, args);
  },
};

// Wrap a string so it survives a `shell: true` spawn. On Windows we need
// double quotes (single quotes don't work in cmd.exe) and escape embedded
// double quotes by doubling them. On POSIX shells we use single quotes
// and escape embedded single quotes by closing/reopening.
function shellQuote(value: string): string {
  if (process.platform === 'win32') {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function runClaude(bin: string, args: PromptArgs): Promise<void> {
  return new Promise((resolve) => {
    const cliArgs: string[] = ['-p', shellQuote(args.userPrompt)];
    if (args.systemPrompt) {
      cliArgs.push('--append-system-prompt', shellQuote(args.systemPrompt));
    }
    if (args.model) {
      cliArgs.push('--model', shellQuote(args.model));
    }

    const child = spawn(bin, cliArgs, {
      cwd: args.cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      // Critical on Windows: `claude` is usually a `.cmd` wrapper, which
      // requires shell:true to be invokable from spawn. On POSIX shell:true
      // also lets us pass quoted arguments cleanly.
      shell: true,
    });

    let stderr = '';
    let aborted = false;

    const onAbort = () => {
      aborted = true;
      try {
        child.kill();
      } catch {
        // ignore
      }
    };
    args.signal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      // Pass each chunk through verbatim. The CLI buffers some output, so
      // these chunks may not be at sentence boundaries.
      args.onEvent({ type: 'chunk', text: chunk });
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      args.onEvent({ type: 'error', code: 'process_failed', text: err.message });
      args.signal?.removeEventListener('abort', onAbort);
      resolve();
    });

    child.on('close', (code) => {
      args.signal?.removeEventListener('abort', onAbort);
      if (aborted) {
        args.onEvent({ type: 'error', code: 'aborted', text: 'Cancelled by client' });
      } else if (code === 0) {
        args.onEvent({
          type: 'meta',
          data: { backend: 'claude-code' },
        });
        args.onEvent({ type: 'done' });
      } else {
        args.onEvent({
          type: 'error',
          code: 'nonzero_exit',
          text: `claude exited ${code}${stderr ? `: ${stderr.trim()}` : ''}`,
        });
      }
      resolve();
    });
  });
}
