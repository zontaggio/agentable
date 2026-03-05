import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CATALOG_VERSION, CRITERIA } from '../catalog/v1';
import {
  collectAiAssessments,
  DEFAULT_OPENROUTER_MODEL,
  enrichActionPlanRecommendations,
} from '../collectors/ai';
import { collectGhData } from '../collectors/gh';
import { collectGitData } from '../collectors/git';
import { collectLocalProjectContext } from '../collectors/local';
import { ActionPlan, CriterionResult, EngineMeta, EvaluationContext, RunOptions } from '../types';
import { computeRepoFingerprint } from '../utils/hash';
import { evaluateAllCriteria } from './evaluate';
import { buildProjectProfile } from './profile';
import { renderReport } from './reporter';
import { summarizeResults } from './scoring';
import { applyActionPlanEnrichment, buildDeterministicActionPlan } from '../web/improvement-tips';

export interface EngineOutput {
  report: string;
  summary: ReturnType<typeof summarizeResults>;
  warnings: string[];
  results: CriterionResult[];
  actionPlan: ActionPlan;
  meta: EngineMeta;
}

async function ensureDirectory(inputPath: string): Promise<void> {
  const stat = await fs.stat(inputPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${inputPath}`);
  }
}

function findAiCriteriaIds(): string[] {
  return CRITERIA.filter((criterion) => criterion.aiAssisted).map((criterion) => criterion.id);
}

function buildFallbackAiAssessments(
  criteriaIds: string[],
  reason: string,
): Record<
  string,
  {
    id: string;
    status: 'unverified';
    reason: string;
    evidence: string[];
  }
> {
  const output: Record<
    string,
    {
      id: string;
      status: 'unverified';
      reason: string;
      evidence: string[];
    }
  > = {};

  for (const criterionId of criteriaIds) {
    output[criterionId] = {
      id: criterionId,
      status: 'unverified',
      reason: `AI assessment unavailable; deterministic fallback applied. ${reason}`,
      evidence: ['AI provider unavailable or misconfigured during this run.'],
    };
  }

  return output;
}

export async function runAgentReadiness(
  options: RunOptions,
  onProgress?: (step: string) => void,
): Promise<EngineOutput> {
  const repoPath = path.resolve(options.repoPath);
  await ensureDirectory(repoPath);

  onProgress?.('Scanning repository');
  const local = await collectLocalProjectContext(repoPath);
  const profile = buildProjectProfile(local);
  const fingerprint = await computeRepoFingerprint(repoPath, local.files);

  onProgress?.('Collecting git data');
  const gitData = await collectGitData(repoPath);

  onProgress?.('Checking GitHub');
  const ghData = await collectGhData(repoPath, !options.noGh);

  onProgress?.('Running AI assessments');
  const aiFailureMode = options.aiFailureMode ?? 'fallback';
  const model = options.aiModel || DEFAULT_OPENROUTER_MODEL;
  const aiCriteriaIds = findAiCriteriaIds();
  const warnings: string[] = [];
  let aiFallbackError: string | null = null;
  let aiResult: Awaited<ReturnType<typeof collectAiAssessments>>;

  try {
    aiResult = await collectAiAssessments({
      repoPath,
      repoIdentifier: gitData.repoIdentifier,
      fingerprint,
      criteriaIds: aiCriteriaIds,
      local,
      profile,
      apiKey: options.aiApiKey,
      model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (aiFailureMode === 'strict') {
      throw error;
    }

    aiFallbackError = message;
    warnings.push(`AI assessments unavailable; fallback mode enabled. ${message}`);
    aiResult = {
      assessments: buildFallbackAiAssessments(aiCriteriaIds, message),
      cacheKey: `fallback-${fingerprint}`,
      model,
      provider: 'openrouter',
      fromCache: false,
    };
  }

  const evaluationContext: EvaluationContext = {
    options,
    local,
    profile,
    fingerprint,
    ghData,
    aiAssessments: aiResult.assessments,
  };

  onProgress?.('Evaluating criteria');
  const results = await evaluateAllCriteria(evaluationContext, gitData);
  const summary = summarizeResults(results);
  const generatedAt = new Date().toISOString();

  onProgress?.('Building action plan');
  const deterministicPlan = buildDeterministicActionPlan(results);
  let actionPlan = deterministicPlan.actionPlan;

  if (!aiFallbackError) {
    onProgress?.('Enriching recommendations');
    const recommendationEnrichment = await enrichActionPlanRecommendations({
      repoIdentifier: gitData.repoIdentifier,
      fingerprint,
      local,
      profile,
      recommendations: deterministicPlan.seeds,
      apiKey: options.aiApiKey,
      model,
    });

    if (recommendationEnrichment.error) {
      warnings.push(
        `Action plan AI enrichment unavailable; using deterministic guidance. ${recommendationEnrichment.error}`,
      );
    } else if (recommendationEnrichment.usedAi) {
      actionPlan = applyActionPlanEnrichment(
        actionPlan,
        recommendationEnrichment.guidanceByCriterion,
      );
    }
  } else {
    warnings.push('Action plan AI enrichment skipped because AI assessments were unavailable.');
  }

  if (ghData.errors.length > 0) {
    warnings.push(...ghData.errors.slice(0, 2));
  }
  warnings.push(
    `Fingerprint: ${fingerprint.slice(0, 12)} | AI provider: ${aiResult.provider} | AI model: ${aiResult.model} | AI cache: ${aiResult.fromCache ? 'hit' : 'miss'}`,
  );

  const report = renderReport(summary, results, {
    verbose: options.verbose,
    warnings,
  });

  const meta: EngineMeta = {
    fingerprint,
    generatedAt,
    repoPath,
    model: aiResult.model,
    aiCache: aiResult.fromCache ? 'hit' : 'miss',
    aiProvider: aiResult.provider,
    catalogVersion: CATALOG_VERSION,
    repoIdentifier: gitData.repoIdentifier,
  };

  return {
    report,
    summary,
    warnings,
    results,
    actionPlan,
    meta,
  };
}
