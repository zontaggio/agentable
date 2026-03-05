import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AiProviderName } from '../types';

export interface AgentReadinessUserConfig {
  provider: AiProviderName;
  apiKey?: string;
  model: string;
  baseUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.agentable');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeProvider(value: unknown): AiProviderName {
  return value === 'openai' ? 'openai' : 'openrouter';
}

function parseConfig(value: unknown): AgentReadinessUserConfig | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const provider = normalizeProvider(raw.provider);
  const model = normalizeString(raw.model) || normalizeString(raw.openRouterModel);
  const apiKey =
    normalizeOptionalString(raw.apiKey) || normalizeOptionalString(raw.openRouterApiKey);
  const baseUrl =
    normalizeOptionalString(raw.baseUrl) || normalizeOptionalString(raw.openAiBaseUrl);
  const createdAt = normalizeString(raw.createdAt);
  const updatedAt = normalizeString(raw.updatedAt);

  if (!model || !createdAt || !updatedAt) {
    return null;
  }

  if (provider === 'openrouter' && !apiKey) {
    return null;
  }

  return {
    provider,
    apiKey,
    model,
    baseUrl,
    createdAt,
    updatedAt,
  };
}

export function getUserConfigPath(): string {
  return CONFIG_FILE;
}

export async function loadUserConfig(): Promise<AgentReadinessUserConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return parseConfig(parsed);
  } catch {
    return null;
  }
}

export async function saveUserConfig(
  config: Pick<AgentReadinessUserConfig, 'provider' | 'apiKey' | 'model' | 'baseUrl'>,
): Promise<AgentReadinessUserConfig> {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const existing = await loadUserConfig();
  const now = new Date().toISOString();
  const provider = config.provider;
  const apiKey = normalizeOptionalString(config.apiKey);
  const model = normalizeString(config.model);
  const baseUrl = normalizeOptionalString(config.baseUrl);

  if (!model) {
    throw new Error('AI model cannot be empty.');
  }

  if (provider === 'openrouter' && !apiKey) {
    throw new Error('OpenRouter API key cannot be empty.');
  }

  const next: AgentReadinessUserConfig = {
    provider,
    apiKey,
    model,
    baseUrl,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  await fs.chmod(CONFIG_FILE, 0o600).catch(() => {
    // Best effort on non-POSIX filesystems.
  });

  return next;
}
