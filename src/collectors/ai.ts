import { createHash } from 'node:crypto';
import path from 'node:path';
import { CATALOG_VERSION } from '../catalog/v1';
import { loadAiBaseline, saveAiBaseline } from '../core/cache';
import { AiAssessment, AiBaseline, LocalProjectContext, ProjectProfile } from '../types';
import { openRouterProvider } from './providers/openrouter';
import { safeReadText } from '../utils/files';

export const DEFAULT_OPENROUTER_MODEL = 'gpt-oss-120b';
export const ACTIVE_AI_PROVIDER = openRouterProvider;

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

function computeCacheKey(repoIdentifier: string, fingerprint: string, model: string): string {
  const input = `${repoIdentifier}::${fingerprint}::${CATALOG_VERSION}::${model}`;
  return createHash('sha256').update(input).digest('hex');
}

async function buildPromptContext(local: LocalProjectContext, profile: ProjectProfile): Promise<string> {
  const readmeText = local.readmePath
    ? await safeReadText(path.join(local.rootPath, local.readmePath))
    : '';

  const trimmedReadme = readmeText.slice(0, 4_000);

  return JSON.stringify(
    {
      profile,
      filesSample: local.files.slice(0, 150),
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

  const context = await buildPromptContext(input.local, input.profile);
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
    throw new Error(`AI provider request failed: ${error instanceof Error ? error.message : String(error)}`);
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
