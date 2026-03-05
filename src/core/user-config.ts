import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface AgentReadinessUserConfig {
  provider: 'openrouter';
  apiKey: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserConfigLoadResult {
  config: AgentReadinessUserConfig | null;
  warnings: string[];
  needsSetup: boolean;
}

const CONFIG_DIR = path.join(os.homedir(), '.agentable');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOpenRouterConfig(value: unknown): AgentReadinessUserConfig | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const providerRaw = normalizeString(raw.provider).toLowerCase();
  const provider = providerRaw || 'openrouter';
  const apiKey = normalizeString(raw.apiKey) || normalizeString(raw.openRouterApiKey);
  const model = normalizeString(raw.model) || normalizeString(raw.openRouterModel);
  const createdAt = normalizeString(raw.createdAt);
  const updatedAt = normalizeString(raw.updatedAt);

  if (provider !== 'openrouter') {
    return null;
  }
  if (!apiKey || !model || !createdAt || !updatedAt) {
    return null;
  }

  return {
    provider: 'openrouter',
    apiKey,
    model,
    createdAt,
    updatedAt,
  };
}

function parseLegacyCompatConfigForMigration(value: unknown): {
  apiKey: string;
  model: string;
  createdAt?: string;
} | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const provider = normalizeString(raw.provider);
  if (provider !== 'openai_compatible') {
    return null;
  }

  const apiKey = normalizeString(raw.apiKey);
  const model = normalizeString(raw.model);
  const createdAt = normalizeString(raw.createdAt);
  if (!apiKey || !model) {
    return null;
  }

  return {
    apiKey,
    model,
    createdAt: createdAt || undefined,
  };
}

async function loadPersistedConfig(): Promise<AgentReadinessUserConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return parseOpenRouterConfig(parsed);
  } catch {
    return null;
  }
}

export function getUserConfigPath(): string {
  return CONFIG_FILE;
}

export async function loadUserConfig(): Promise<UserConfigLoadResult> {
  let rawText: string;
  try {
    rawText = await fs.readFile(CONFIG_FILE, 'utf8');
  } catch {
    return {
      config: null,
      warnings: [],
      needsSetup: false,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return {
      config: null,
      warnings: [
        `Existing AI config at ${CONFIG_FILE} is not valid JSON. Run \`agentable --setup\` to replace it.`,
      ],
      needsSetup: true,
    };
  }

  const current = parseOpenRouterConfig(parsed);
  if (current) {
    return {
      config: current,
      warnings: [],
      needsSetup: false,
    };
  }

  const legacyCompat = parseLegacyCompatConfigForMigration(parsed);
  if (legacyCompat) {
    const migrated = await saveUserConfig(
      {
        provider: 'openrouter',
        apiKey: legacyCompat.apiKey,
        model: legacyCompat.model,
      },
      { createdAt: legacyCompat.createdAt },
    );
    return {
      config: migrated,
      warnings: [`Migrated previous AI config to OpenRouter mode at ${CONFIG_FILE}.`],
      needsSetup: false,
    };
  }

  return {
    config: null,
    warnings: [
      `Existing AI config at ${CONFIG_FILE} is incompatible with OpenRouter mode. Run \`agentable --setup\`.`,
    ],
    needsSetup: true,
  };
}

export async function saveUserConfig(
  config: Pick<AgentReadinessUserConfig, 'provider' | 'apiKey' | 'model'>,
  options?: { createdAt?: string },
): Promise<AgentReadinessUserConfig> {
  await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });

  const existing = await loadPersistedConfig();
  const now = new Date().toISOString();
  const provider = config.provider;
  const apiKey = normalizeString(config.apiKey);
  const model = normalizeString(config.model);

  if (provider !== 'openrouter') {
    throw new Error('Only provider=openrouter is currently supported.');
  }
  if (!apiKey) {
    throw new Error('OpenRouter API key cannot be empty.');
  }
  if (!model) {
    throw new Error('OpenRouter model cannot be empty.');
  }

  const next: AgentReadinessUserConfig = {
    provider: 'openrouter',
    apiKey,
    model,
    createdAt: options?.createdAt ?? existing?.createdAt ?? now,
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
