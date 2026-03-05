import path from 'node:path';
import { CRITERIA } from '../catalog/v1';
import { GitData } from '../collectors/git';
import { CriterionDefinition, CriterionResult, EvaluationContext } from '../types';
import { fileExists } from '../utils/files';
import { applyAiIfPresent } from './evaluate/ai';
import { evaluateApplicabilitySkip } from './evaluate/applicability';
import { enforceConservativeDecision, makeResult } from './evaluate/result';
import { getCriterionEvaluator } from './evaluate/rules-index';
import { buildSignals } from './evaluate/signals';
import { EvalSignals } from './evaluate/types';

function evaluateProjectConfigSkip(
  criterion: CriterionDefinition,
  ctx: EvaluationContext,
): { skip: boolean; reason?: string } {
  const override = ctx.local.projectConfig.overrides[criterion.id];
  if (override?.applicable === false) {
    return {
      skip: true,
      reason: override.reason || 'Skipped via .agentable.json override.',
    };
  }

  if (ctx.local.projectConfig.skip.includes(criterion.id)) {
    return {
      skip: true,
      reason: 'Skipped via .agentable.json skip list.',
    };
  }

  return { skip: false };
}

async function evaluateCriterion(
  criterion: CriterionDefinition,
  ctx: EvaluationContext,
  gitData: GitData,
  signals: EvalSignals,
): Promise<CriterionResult> {
  const configuredSkip = evaluateProjectConfigSkip(criterion, ctx);
  if (configuredSkip.skip) {
    return makeResult(
      criterion,
      'skip',
      configuredSkip.reason ?? 'Skipped via .agentable.json.',
      [],
      [],
      undefined,
      false,
    );
  }

  const applicability = evaluateApplicabilitySkip(criterion.id, ctx.profile, ctx.local);
  if (applicability.skip) {
    return makeResult(
      criterion,
      'skip',
      applicability.reason ?? 'Skipped - not applicable.',
      [],
      [],
      undefined,
      false,
    );
  }

  if (criterion.aiAssisted) {
    const ai = applyAiIfPresent(criterion, ctx.aiAssessments);
    if (ai) {
      return ai;
    }
  }

  const evaluator = getCriterionEvaluator(criterion.id);
  if (evaluator) {
    const evaluated = await evaluator({ criterion, ctx, gitData, signals });
    if (evaluated) {
      return evaluated;
    }
  }

  return makeResult(criterion, 'unverified', 'Criterion evaluator not implemented yet.');
}

export async function evaluateAllCriteria(
  ctx: EvaluationContext,
  gitData: GitData,
): Promise<CriterionResult[]> {
  const signals = await buildSignals(ctx.local);
  const results: CriterionResult[] = [];

  for (const criterion of CRITERIA) {
    const result = enforceConservativeDecision(
      await evaluateCriterion(criterion, ctx, gitData, signals),
    );
    results.push(result);
  }

  if (ctx.ghData.errors.length > 0) {
    for (const result of results) {
      if (
        (result.id === 'branch_protection' ||
          result.id === 'secret_scanning' ||
          result.id === 'backlog_health' ||
          result.id === 'issue_labeling_system') &&
        result.status === 'unverified'
      ) {
        result.evidence.push(...ctx.ghData.errors.slice(0, 2));
      }
    }
  }

  if (await fileExists(path.join(ctx.local.rootPath, '.git'))) {
    return results;
  }

  return results.map((result) => {
    if (
      [
        'branch_protection',
        'secret_scanning',
        'backlog_health',
        'issue_labeling_system',
        'automated_pr_review',
      ].includes(result.id) &&
      result.status === 'fail'
    ) {
      return {
        ...result,
        status: 'unverified' as const,
        reason: 'GitHub metadata unavailable outside a git/github context.',
      };
    }

    return result;
  });
}
