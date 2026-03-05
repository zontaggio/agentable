import { createHash } from 'node:crypto';
import { CATALOG_VERSION } from '../catalog/v1';
import { AiRecommendationGuidance } from '../types';
import { AiProviderConfig } from './ai-provider';
import {
  enrichRecommendationsWithOpenRouter,
  OpenRouterRecommendationPromptItem,
  openRouterProvider,
} from './providers/openrouter';

export const DEFAULT_OPENROUTER_MODEL = 'gpt-oss-120b';
export const DEFAULT_AI_PROVIDER = 'openrouter' as const;

export function resolveAiProvider() {
  return openRouterProvider;
}

export function defaultModelForProvider(): string {
  return DEFAULT_OPENROUTER_MODEL;
}

export function computeAssessmentCacheKey(input: {
  repoIdentifier: string;
  fingerprint: string;
  provider: string;
  model: string;
  baseUrl?: string;
}): string {
  const key = `${input.repoIdentifier}::${input.fingerprint}::${CATALOG_VERSION}::${input.provider}::${input.model}::${(input.baseUrl ?? '').trim()}`;
  return createHash('sha256').update(key).digest('hex');
}

export function computeRecommendationCacheKey(input: {
  repoIdentifier: string;
  fingerprint: string;
  provider: string;
  model: string;
  recommendations: OpenRouterRecommendationPromptItem[];
  baseUrl?: string;
}): string {
  const recommendationSignature = input.recommendations
    .map((item) => ({
      criterionId: item.criterionId,
      status: item.status,
      priorityScore: item.priorityScore,
      actionabilityScore: item.actionabilityScore,
      rank: item.rank,
      reason: item.reason,
      evidence: item.evidence,
      evidenceDetails: item.evidenceDetails,
      deterministic: item.deterministic,
    }))
    .sort((a, b) => a.criterionId.localeCompare(b.criterionId));

  const key = JSON.stringify({
    repoIdentifier: input.repoIdentifier,
    fingerprint: input.fingerprint,
    provider: input.provider,
    model: input.model,
    baseUrl: (input.baseUrl ?? '').trim(),
    catalogVersion: CATALOG_VERSION,
    recommendationSignature,
  });

  return createHash('sha256').update(key).digest('hex');
}

export async function enrichRecommendationsByProvider(input: {
  config: AiProviderConfig;
  repositoryContextJson: string;
  recommendations: OpenRouterRecommendationPromptItem[];
}): Promise<Record<string, AiRecommendationGuidance>> {
  return enrichRecommendationsWithOpenRouter(input.config, {
    repositoryContextJson: input.repositoryContextJson,
    recommendations: input.recommendations,
  });
}
