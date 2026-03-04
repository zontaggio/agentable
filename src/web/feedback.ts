import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const MAX_FEEDBACK_ITEMS = 2_000;

export interface RecommendationFeedback {
  criterionId: string;
  useful: boolean;
  reason: string;
}

export interface RecommendationFeedbackEntry extends RecommendationFeedback {
  timestamp: string;
  repoKey: string;
  repoIdentifier: string;
  fingerprint: string;
}

export function getDefaultFeedbackDir(): string {
  return path.join(os.homedir(), '.cache', 'agentable', 'feedback');
}

function feedbackFilePath(repoKey: string, baseDir?: string): string {
  return path.join(baseDir ?? getDefaultFeedbackDir(), `${repoKey}.json`);
}

async function ensureDir(baseDir?: string): Promise<void> {
  await fs.mkdir(baseDir ?? getDefaultFeedbackDir(), { recursive: true });
}

async function loadFeedbackFile(filePath: string): Promise<RecommendationFeedbackEntry[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => item as RecommendationFeedbackEntry)
      .filter((item) => typeof item.criterionId === 'string' && typeof item.useful === 'boolean');
  } catch {
    return [];
  }
}

export async function appendRecommendationFeedback(
  entry: RecommendationFeedbackEntry,
  baseDir?: string,
): Promise<void> {
  await ensureDir(baseDir);
  const filePath = feedbackFilePath(entry.repoKey, baseDir);
  const current = await loadFeedbackFile(filePath);
  const next = [...current, entry].slice(-MAX_FEEDBACK_ITEMS);
  await fs.writeFile(filePath, JSON.stringify(next, null, 2), 'utf8');
}
