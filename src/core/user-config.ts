import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface AgentReadinessUserConfig {
  openRouterApiKey: string;
  openRouterModel: string;
  createdAt: string;
  updatedAt: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.agentable');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidConfig(value: unknown): value is AgentReadinessUserConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const v = value as Record<string, unknown>;
  return (
    normalizeString(v.openRouterApiKey).length > 0 &&
    normalizeString(v.openRouterModel).length > 0 &&
    normalizeString(v.createdAt).length > 0 &&
    normalizeString(v.updatedAt).length > 0
  );
}

export function getUserConfigPath(): string {
  return CONFIG_FILE;
}

export async function loadUserConfig(): Promise<AgentReadinessUserConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;

    if (!isValidConfig(parsed)) {
      return null;
    }

    return {
      openRouterApiKey: parsed.openRouterApiKey.trim(),
      openRouterModel: parsed.openRouterModel.trim(),
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function saveUserConfig(
  config: Pick<AgentReadinessUserConfig, 'openRouterApiKey' | 'openRouterModel'>,
): Promise<AgentReadinessUserConfig> {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const existing = await loadUserConfig();
  const now = new Date().toISOString();

  const next: AgentReadinessUserConfig = {
    openRouterApiKey: config.openRouterApiKey.trim(),
    openRouterModel: config.openRouterModel.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), { encoding: 'utf8', mode: 0o600 });
  await fs.chmod(CONFIG_FILE, 0o600).catch(() => {
    // Best effort on non-POSIX filesystems.
  });

  return next;
}
