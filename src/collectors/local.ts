import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AgentableProjectConfig, LocalProjectContext } from '../types';
import { safeReadText, statMtimeMs, walkFiles } from '../utils/files';

const DEFAULT_PROJECT_CONFIG: AgentableProjectConfig = {
  skip: [],
  overrides: {},
};

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = String(val);
  }
  return out;
}

async function readPackageJson(rootPath: string): Promise<Record<string, unknown> | null> {
  const pkgPath = path.join(rootPath, 'package.json');
  try {
    const content = await fs.readFile(pkgPath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function sanitizeProjectConfig(value: unknown): AgentableProjectConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PROJECT_CONFIG;
  }

  const record = value as Record<string, unknown>;
  const skip = Array.isArray(record.skip)
    ? Array.from(
        new Set(
          record.skip
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0),
        ),
      )
    : [];

  const overridesRaw =
    record.overrides && typeof record.overrides === 'object' && !Array.isArray(record.overrides)
      ? (record.overrides as Record<string, unknown>)
      : {};

  const overrides: AgentableProjectConfig['overrides'] = {};
  for (const [criterionId, overrideValue] of Object.entries(overridesRaw)) {
    if (!overrideValue || typeof overrideValue !== 'object' || Array.isArray(overrideValue)) {
      continue;
    }

    const overrideRecord = overrideValue as Record<string, unknown>;
    const applicable =
      typeof overrideRecord.applicable === 'boolean' ? overrideRecord.applicable : undefined;
    const reason =
      typeof overrideRecord.reason === 'string' ? overrideRecord.reason.trim() : undefined;

    if (applicable === undefined && !reason) {
      continue;
    }

    overrides[criterionId] = {
      applicable,
      reason,
    };
  }

  return {
    skip,
    overrides,
  };
}

async function readProjectConfig(rootPath: string): Promise<AgentableProjectConfig> {
  const configPath = path.join(rootPath, '.agentable.json');
  try {
    const content = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    return sanitizeProjectConfig(parsed);
  } catch {
    return DEFAULT_PROJECT_CONFIG;
  }
}

async function estimateLoc(rootPath: string, files: string[]): Promise<number> {
  const codeFiles = files.filter((f) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|java|kt|rs|php|cs|scala|swift|md)$/i.test(f),
  );
  const LOC_SAMPLE_LIMIT = 1200;
  const LOC_READ_CONCURRENCY = 50;
  const sampledFiles = codeFiles.slice(0, LOC_SAMPLE_LIMIT);

  if (sampledFiles.length === 0) {
    return 0;
  }

  let loc = 0;
  for (let index = 0; index < sampledFiles.length; index += LOC_READ_CONCURRENCY) {
    const batch = sampledFiles.slice(index, index + LOC_READ_CONCURRENCY);
    const counts = await Promise.all(
      batch.map(async (rel) => {
        const abs = path.join(rootPath, rel);
        try {
          const content = await fs.readFile(abs, 'utf8');
          return content.split('\n').length;
        } catch {
          return 0;
        }
      }),
    );
    loc += counts.reduce((sum, count) => sum + count, 0);
  }

  return loc;
}

export async function collectLocalProjectContext(rootPath: string): Promise<LocalProjectContext> {
  const files = await walkFiles(rootPath);
  const fileSet = new Set(files);
  const packageJson = await readPackageJson(rootPath);
  const projectConfig = await readProjectConfig(rootPath);

  const dependencies = asRecord(packageJson?.dependencies);
  const devDependencies = asRecord(packageJson?.devDependencies);
  const scripts = asRecord(packageJson?.scripts);

  const readmeCandidates = files.filter((f) => /^readme(\.|$)/i.test(path.basename(f)));
  const readmePath = readmeCandidates.at(0) ?? null;

  const gitignoreContent = await safeReadText(path.join(rootPath, '.gitignore'));

  const workflowFiles = files.filter(
    (f) => f.startsWith('.github/workflows/') && /\.ya?ml$/i.test(f),
  );

  const locEstimate = await estimateLoc(rootPath, files);

  return {
    rootPath,
    files,
    fileSet,
    projectConfig,
    packageJson,
    dependencies,
    devDependencies,
    scripts,
    readmePath,
    gitignoreContent,
    workflowFiles,
    locEstimate,
    now: new Date(),
  };
}

export async function readReadmeMtimeMs(local: LocalProjectContext): Promise<number | null> {
  if (!local.readmePath) {
    return null;
  }
  return statMtimeMs(path.join(local.rootPath, local.readmePath));
}
