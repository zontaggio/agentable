import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CATALOG_VERSION, CRITERIA } from '../catalog/v1';
import { collectAiAssessments, DEFAULT_OPENROUTER_MODEL } from '../collectors/ai';
import { collectGhData } from '../collectors/gh';
import { collectGitData } from '../collectors/git';
import { collectLocalProjectContext } from '../collectors/local';
import { CriterionResult, EngineMeta, EvaluationContext, RunOptions } from '../types';
import { computeRepoFingerprint } from '../utils/hash';
import { evaluateAllCriteria } from './evaluate';
import { buildProjectProfile } from './profile';
import { renderReport } from './reporter';
import { summarizeResults } from './scoring';

export interface EngineOutput {
  report: string;
  summary: ReturnType<typeof summarizeResults>;
  warnings: string[];
  results: CriterionResult[];
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

export async function runAgentReadiness(options: RunOptions): Promise<EngineOutput> {
  const repoPath = path.resolve(options.repoPath);
  await ensureDirectory(repoPath);

  const local = await collectLocalProjectContext(repoPath);
  const profile = buildProjectProfile(local);
  const fingerprint = await computeRepoFingerprint(repoPath, local.files);

  const gitData = await collectGitData(repoPath);
  const ghData = await collectGhData(repoPath, !options.noGh);

  const model = options.aiModel || DEFAULT_OPENROUTER_MODEL;
  const aiCriteriaIds = findAiCriteriaIds();
  const aiResult = await collectAiAssessments({
    repoPath,
    repoIdentifier: gitData.repoIdentifier,
    fingerprint,
    criteriaIds: aiCriteriaIds,
    local,
    profile,
    enabled: !options.noAi,
    apiKey: options.aiApiKey,
    model,
  });

  const evaluationContext: EvaluationContext = {
    options,
    local,
    profile,
    fingerprint,
    ghData,
    aiAssessments: aiResult.assessments,
  };

  const results = await evaluateAllCriteria(evaluationContext, gitData);
  const summary = summarizeResults(results);
  const generatedAt = new Date().toISOString();

  const warnings: string[] = [];
  if (aiResult.warning) {
    warnings.push(aiResult.warning);
  }
  if (ghData.errors.length > 0) {
    warnings.push(...ghData.errors.slice(0, 2));
  }
  warnings.push(
    `Fingerprint: ${fingerprint.slice(0, 12)} | AI model: ${aiResult.model} | AI cache: ${aiResult.fromCache ? 'hit' : 'miss'}`,
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
    catalogVersion: CATALOG_VERSION,
    repoIdentifier: gitData.repoIdentifier,
  };

  return {
    report,
    summary,
    warnings,
    results,
    meta,
  };
}
