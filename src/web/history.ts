import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WebHistoryPoint } from '../types';

export const MAX_HISTORY_SNAPSHOTS = 200;

export function getDefaultHistoryDir(): string {
  return path.join(os.homedir(), '.cache', 'agentable', 'history');
}

export function computeRepoKey(repoIdentifier: string): string {
  return createHash('sha256').update(repoIdentifier).digest('hex');
}

function historyFilePath(repoKey: string, baseDir?: string): string {
  const root = baseDir ?? getDefaultHistoryDir();
  return path.join(root, `${repoKey}.json`);
}

async function ensureDir(baseDir?: string): Promise<void> {
  const root = baseDir ?? getDefaultHistoryDir();
  await fs.mkdir(root, { recursive: true });
}

function normalizePoint(point: unknown): WebHistoryPoint | null {
  if (!point || typeof point !== 'object') {
    return null;
  }

  const p = point as Record<string, unknown>;
  const timestamp = typeof p.timestamp === 'string' ? p.timestamp : null;
  const score = typeof p.score === 'number' ? p.score : null;
  const coverage = typeof p.coverage === 'number' ? p.coverage : null;
  const level = typeof p.level === 'number' ? p.level : null;
  const fingerprint = typeof p.fingerprint === 'string' ? p.fingerprint : null;

  if (!timestamp || score === null || coverage === null || level === null || !fingerprint) {
    return null;
  }

  return {
    timestamp,
    score,
    coverage,
    level,
    fingerprint,
  };
}

export async function loadHistory(repoKey: string, baseDir?: string): Promise<WebHistoryPoint[]> {
  const filePath = historyFilePath(repoKey, baseDir);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed
      .map((item) => normalizePoint(item))
      .filter((item): item is WebHistoryPoint => item !== null)
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

    return normalized;
  } catch {
    return [];
  }
}

export async function appendHistory(
  repoKey: string,
  snapshot: WebHistoryPoint,
  baseDir?: string,
): Promise<WebHistoryPoint[]> {
  await ensureDir(baseDir);

  const current = await loadHistory(repoKey, baseDir);
  const last = current[current.length - 1];

  if (last && last.fingerprint === snapshot.fingerprint) {
    return current;
  }

  const next = [...current, snapshot].slice(-MAX_HISTORY_SNAPSHOTS);
  const filePath = historyFilePath(repoKey, baseDir);
  await fs.writeFile(filePath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
