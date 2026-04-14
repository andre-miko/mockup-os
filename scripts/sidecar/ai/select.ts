/**
 * Adapter selection for a given project.
 *
 * Reads `project.json#ai.backend` (default: `auto`). When `auto`, prefers
 * the Claude Code CLI if it's on PATH, then the Anthropic SDK if a key
 * is set, and finally the no-op `none` adapter. The selected adapter is
 * cached per project so we don't re-probe the CLI on every prompt.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiAdapter, AiBackend } from './adapter';
import { anthropicAdapter } from './anthropic';
import { claudeCodeAdapter } from './claude-code';
import { noneAdapter } from './none';

interface AiConfig {
  backend?: 'auto' | AiBackend;
  model?: string;
}

interface ResolvedConfig {
  adapter: AiAdapter;
  configured: boolean;
  reason?: string;
  model?: string;
}

const cache = new Map<string, ResolvedConfig>();

function readAiConfig(projectRoot: string): AiConfig {
  const path = join(projectRoot, 'project.json');
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { ai?: AiConfig };
    return parsed.ai ?? {};
  } catch {
    return {};
  }
}

async function pickAdapter(prefer: AiBackend | 'auto'): Promise<AiAdapter> {
  if (prefer === 'claude-code') {
    return (await claudeCodeAdapter.isConfigured()).ok ? claudeCodeAdapter : noneAdapter;
  }
  if (prefer === 'anthropic') {
    return (await anthropicAdapter.isConfigured()).ok ? anthropicAdapter : noneAdapter;
  }
  if (prefer === 'none') return noneAdapter;

  // auto — try Claude Code first, then Anthropic, then none.
  if ((await claudeCodeAdapter.isConfigured()).ok) return claudeCodeAdapter;
  if ((await anthropicAdapter.isConfigured()).ok) return anthropicAdapter;
  return noneAdapter;
}

export async function selectAdapter(
  projectId: string,
  projectRoot: string,
): Promise<ResolvedConfig> {
  const hit = cache.get(projectId);
  if (hit) return hit;

  const ai = readAiConfig(projectRoot);
  const prefer = ai.backend ?? 'auto';
  const adapter = await pickAdapter(prefer);
  const probe = await adapter.isConfigured();

  const resolved: ResolvedConfig = {
    adapter,
    configured: probe.ok,
    reason: probe.ok ? undefined : probe.reason,
    model: ai.model,
  };
  cache.set(projectId, resolved);
  return resolved;
}

/** Force re-detection on the next call — used after env / config edits. */
export function resetAdapterCache(projectId?: string): void {
  if (projectId) cache.delete(projectId);
  else cache.clear();
}
