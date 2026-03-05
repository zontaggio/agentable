import { createHash } from 'node:crypto';
import path from 'node:path';
import { CATALOG_VERSION } from '../catalog/v1';
import {
  loadAiBaseline,
  loadAiRecommendationBaseline,
  saveAiBaseline,
  saveAiRecommendationBaseline,
} from '../core/cache';
import {
  AiAssessment,
  AiBaseline,
  AiRecommendationBaseline,
  AiRecommendationGuidance,
  LocalProjectContext,
  ProjectProfile,
} from '../types';
import {
  enrichRecommendationsWithOpenRouter,
  OpenRouterRecommendationPromptItem,
  openRouterProvider,
} from './providers/openrouter';
import { safeReadText } from '../utils/files';

export const DEFAULT_OPENROUTER_MODEL = 'gpt-oss-120b';
export const ACTIVE_AI_PROVIDER = openRouterProvider;
const ASSESSMENT_CONTEXT_LIMITS = {
  files: 150,
  readme: 4_000,
};
const RECOMMENDATION_CONTEXT_LIMITS = {
  files: 70,
  readme: 2_000,
};

interface AiCollectionInput {
  repoPath: string;
  repoIdentifier: string;
  fingerprint: string;
  criteriaIds: string[];
  local: LocalProjectContext;
  profile: ProjectProfile;
  apiKey?: string;
  model?: string;
}

interface AiCollectionOutput {
  assessments: Record<string, AiAssessment>;
  cacheKey: string;
  model: string;
  provider: string;
  fromCache: boolean;
}

export interface RecommendationEnrichmentOutput {
  guidanceByCriterion: Record<string, AiRecommendationGuidance>;
  provider: string;
  model: string;
  usedAi: boolean;
  error?: string;
}

function computeCacheKey(repoIdentifier: string, fingerprint: string, model: string): string {
  const input = `${repoIdentifier}::${fingerprint}::${CATALOG_VERSION}::${model}`;
  return createHash('sha256').update(input).digest('hex');
}

function computeRecommendationCacheKey(
  repoIdentifier: string,
  fingerprint: string,
  model: string,
  recommendations: OpenRouterRecommendationPromptItem[],
): string {
  const recommendationSignature = recommendations
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

  const input = JSON.stringify({
    repoIdentifier,
    fingerprint,
    model,
    catalogVersion: CATALOG_VERSION,
    provider: ACTIVE_AI_PROVIDER.name,
    recommendationSignature,
  });

  return createHash('sha256').update(input).digest('hex');
}

async function buildPromptContext(
  local: LocalProjectContext,
  profile: ProjectProfile,
  limits: { files: number; readme: number },
): Promise<string> {
  const readmeText = local.readmePath
    ? await safeReadText(path.join(local.rootPath, local.readmePath))
    : '';

  const trimmedReadme = readmeText.slice(0, limits.readme);

  return JSON.stringify(
    {
      profile,
      filesSample: local.files.slice(0, limits.files),
      workflows: local.workflowFiles,
      scripts: local.scripts,
      readmeExcerpt: trimmedReadme,
    },
    null,
    2,
  );
}

export async function collectAiAssessments(input: AiCollectionInput): Promise<AiCollectionOutput> {
  const model = input.model || DEFAULT_OPENROUTER_MODEL;
  const cacheKey = computeCacheKey(input.repoIdentifier, input.fingerprint, model);

  const cached = await loadAiBaseline(cacheKey);
  if (cached) {
    return {
      assessments: cached.assessments,
      cacheKey,
      model,
      provider: ACTIVE_AI_PROVIDER.name,
      fromCache: true,
    };
  }

  if (input.criteriaIds.length === 0) {
    return {
      assessments: {},
      cacheKey,
      model,
      provider: ACTIVE_AI_PROVIDER.name,
      fromCache: false,
    };
  }

  const providerConfig = ACTIVE_AI_PROVIDER.validateConfig({
    apiKey: input.apiKey,
    model,
  });

  const context = await buildPromptContext(input.local, input.profile, ASSESSMENT_CONTEXT_LIMITS);
  let assessments: Record<string, AiAssessment>;

  try {
    assessments = await ACTIVE_AI_PROVIDER.assessCriteria(
      {
        criteriaIds: input.criteriaIds,
        contextJson: context,
      },
      providerConfig,
    );
  } catch (error) {
    throw new Error(
      `AI provider request failed: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }

  const baseline: AiBaseline = {
    key: cacheKey,
    fingerprint: input.fingerprint,
    model,
    createdAt: new Date().toISOString(),
    assessments,
  };

  await saveAiBaseline(baseline);

  return {
    assessments,
    cacheKey,
    model,
    provider: ACTIVE_AI_PROVIDER.name,
    fromCache: false,
  };
}

export async function enrichActionPlanRecommendations(input: {
  repoIdentifier: string;
  fingerprint: string;
  local: LocalProjectContext;
  profile: ProjectProfile;
  recommendations: OpenRouterRecommendationPromptItem[];
  apiKey?: string;
  model?: string;
}): Promise<RecommendationEnrichmentOutput> {
  const model = input.model || DEFAULT_OPENROUTER_MODEL;
  if (input.recommendations.length === 0) {
    return {
      guidanceByCriterion: {},
      provider: ACTIVE_AI_PROVIDER.name,
      model,
      usedAi: false,
    };
  }

  const cacheKey = computeRecommendationCacheKey(
    input.repoIdentifier,
    input.fingerprint,
    model,
    input.recommendations,
  );
  const cached = await loadAiRecommendationBaseline(cacheKey);
  if (cached) {
    return {
      guidanceByCriterion: cached.guidanceByCriterion,
      provider: cached.provider,
      model: cached.model,
      usedAi: Object.keys(cached.guidanceByCriterion).length > 0,
    };
  }

  try {
    const config = ACTIVE_AI_PROVIDER.validateConfig({
      apiKey: input.apiKey,
      model,
    });
    const repositoryContextJson = await buildPromptContext(
      input.local,
      input.profile,
      RECOMMENDATION_CONTEXT_LIMITS,
    );
    const guidanceByCriterion = await enrichRecommendationsWithOpenRouter(config, {
      repositoryContextJson,
      recommendations: input.recommendations,
    });
    const baseline: AiRecommendationBaseline = {
      key: cacheKey,
      fingerprint: input.fingerprint,
      model,
      provider: ACTIVE_AI_PROVIDER.name,
      createdAt: new Date().toISOString(),
      guidanceByCriterion,
    };
    await saveAiRecommendationBaseline(baseline);

    return {
      guidanceByCriterion,
      provider: ACTIVE_AI_PROVIDER.name,
      model,
      usedAi: Object.keys(guidanceByCriterion).length > 0,
    };
  } catch (error) {
    return {
      guidanceByCriterion: {},
      provider: ACTIVE_AI_PROVIDER.name,
      model,
      usedAi: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
