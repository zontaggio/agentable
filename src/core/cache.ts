import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AiBaseline } from '../types';

const CACHE_DIR = path.join(os.homedir(), '.cache', 'agentable');

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function baselinePath(key: string): string {
  return path.join(CACHE_DIR, `${key}.json`);
}

export async function loadAiBaseline(key: string): Promise<AiBaseline | null> {
  const filePath = baselinePath(key);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as AiBaseline;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAiBaseline(baseline: AiBaseline): Promise<void> {
  await ensureCacheDir();
  const filePath = baselinePath(baseline.key);
  await fs.writeFile(filePath, JSON.stringify(baseline, null, 2), 'utf8');
}

export function getCacheDirectory(): string {
  return CACHE_DIR;
}
