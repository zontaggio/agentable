import path from 'node:path';
import {
  loadAiBaseline,
  loadAiRecommendationBaseline,
  saveAiBaseline,
  saveAiRecommendationBaseline,
} from '../core/cache';
import {
  AiAssessment,
  AiBaseline,
  AiProviderName,
  AiRecommendationBaseline,
  AiRecommendationGuidance,
  LocalProjectContext,
  ProjectProfile,
} from '../types';
import {
  computeAssessmentCacheKey,
  computeRecommendationCacheKey,
  defaultModelForProvider,
  enrichRecommendationsByProvider,
  resolveAiProvider,
} from './ai-helpers';
import { OpenRouterRecommendationPromptItem } from './providers/openrouter';
import { safeReadText } from '../utils/files';

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
  provider?: AiProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
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
  const provider = resolveAiProvider(input.provider);
  const providerName = provider.name as AiProviderName;
  const model = input.model || defaultModelForProvider(providerName);
  const cacheKey = computeAssessmentCacheKey({
    repoIdentifier: input.repoIdentifier,
    fingerprint: input.fingerprint,
    provider: providerName,
    model,
    baseUrl: input.baseUrl,
  });

  const cached = await loadAiBaseline(cacheKey);
  if (cached) {
    return {
      assessments: cached.assessments,
      cacheKey,
      model,
      provider: provider.name,
      fromCache: true,
    };
  }

  if (input.criteriaIds.length === 0) {
    return {
      assessments: {},
      cacheKey,
      model,
      provider: provider.name,
      fromCache: false,
    };
  }

  const providerConfig = provider.validateConfig({
    apiKey: input.apiKey,
    model,
    baseUrl: input.baseUrl,
  });

  const context = await buildPromptContext(input.local, input.profile, ASSESSMENT_CONTEXT_LIMITS);
  let assessments: Record<string, AiAssessment>;

  try {
    assessments = await provider.assessCriteria(
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
    provider: provider.name,
    fromCache: false,
  };
}

export async function enrichActionPlanRecommendations(input: {
  repoIdentifier: string;
  fingerprint: string;
  local: LocalProjectContext;
  profile: ProjectProfile;
  recommendations: OpenRouterRecommendationPromptItem[];
  provider?: AiProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}): Promise<RecommendationEnrichmentOutput> {
  const provider = resolveAiProvider(input.provider);
  const providerName = provider.name as AiProviderName;
  const model = input.model || defaultModelForProvider(providerName);

  if (input.recommendations.length === 0) {
    return {
      guidanceByCriterion: {},
      provider: provider.name,
      model,
      usedAi: false,
    };
  }

  const cacheKey = computeRecommendationCacheKey({
    repoIdentifier: input.repoIdentifier,
    fingerprint: input.fingerprint,
    provider: providerName,
    model,
    recommendations: input.recommendations,
    baseUrl: input.baseUrl,
  });

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
    const config = provider.validateConfig({
      apiKey: input.apiKey,
      model,
      baseUrl: input.baseUrl,
    });
    const repositoryContextJson = await buildPromptContext(
      input.local,
      input.profile,
      RECOMMENDATION_CONTEXT_LIMITS,
    );
    const guidanceByCriterion = await enrichRecommendationsByProvider({
      provider: providerName,
      config,
      repositoryContextJson,
      recommendations: input.recommendations,
    });
    const baseline: AiRecommendationBaseline = {
      key: cacheKey,
      fingerprint: input.fingerprint,
      model,
      provider: provider.name,
      createdAt: new Date().toISOString(),
      guidanceByCriterion,
    };
    await saveAiRecommendationBaseline(baseline);

    return {
      guidanceByCriterion,
      provider: provider.name,
      model,
      usedAi: Object.keys(guidanceByCriterion).length > 0,
    };
  } catch (error) {
    return {
      guidanceByCriterion: {},
      provider: provider.name,
      model,
      usedAi: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export { DEFAULT_AI_PROVIDER, DEFAULT_OPENAI_MODEL, DEFAULT_OPENROUTER_MODEL } from './ai-helpers';
