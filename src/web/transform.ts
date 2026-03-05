import path from 'node:path';
import { CATEGORY_LABELS, CRITERIA } from '../catalog/v1';
import {
  ActionPlan,
  CategoryId,
  CriterionResult,
  EngineMeta,
  ScoreSummary,
  WebCategorySummary,
  WebCriterionCard,
  WebHistoryPoint,
  WebReportPayload,
} from '../types';
import { getCardMeta } from './card-meta';
import { getImprovementTips } from './improvement-tips';
import { buildRemediationPrompt } from './remediation-template';

export interface WebTransformInput {
  summary: ScoreSummary;
  results: CriterionResult[];
  warnings: string[];
  meta: EngineMeta;
  actionPlan: ActionPlan;
}

export const QUALITY_GATE_VERSION = 'functional-v1.0.0';

const KNOWN_LIMITATIONS = [
  'AI-assisted criteria can degrade to UNVERIFIED when provider requests fail or are unavailable.',
  'Signals are intentionally conservative to reduce false positives, which may reduce coverage in edge cases.',
  'Actionability scores are heuristic guidance for prioritization, not execution guarantees.',
];

function createCategoryBuckets(): Record<CategoryId, WebCriterionCard[]> {
  return {
    style_validation: [],
    build_system: [],
    testing: [],
    documentation: [],
    dev_environment: [],
    debugging_observability: [],
    security: [],
    task_discovery: [],
    product_analytics: [],
  };
}

function categoryOrder(): CategoryId[] {
  const seen = new Set<CategoryId>();
  const ordered: CategoryId[] = [];

  for (const criterion of CRITERIA) {
    if (!seen.has(criterion.category)) {
      seen.add(criterion.category);
      ordered.push(criterion.category);
    }
  }

  return ordered;
}

function getDescription(criterionId: string): string {
  const found = CRITERIA.find((criterion) => criterion.id === criterionId);
  return found?.description ?? 'No description available.';
}

function toScoreLabel(status: CriterionResult['status'], maxPoints: number): string {
  if (status === 'pass') {
    return `${maxPoints}/${maxPoints}`;
  }

  if (status === 'fail') {
    return `0/${maxPoints}`;
  }

  return 'N/A';
}

function cardSort(a: WebCriterionCard, b: WebCriterionCard): number {
  const rankA = a.priorityRank ?? Number.MAX_SAFE_INTEGER;
  const rankB = b.priorityRank ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) {
    return rankA - rankB;
  }

  const statusWeight = (status: WebCriterionCard['status']): number => {
    if (status === 'fail') {
      return 0;
    }
    if (status === 'unverified') {
      return 1;
    }
    if (status === 'pass') {
      return 2;
    }
    return 3;
  };

  const statusDiff = statusWeight(a.status) - statusWeight(b.status);
  if (statusDiff !== 0) {
    return statusDiff;
  }

  return a.name.localeCompare(b.name);
}

function emptyActionPlan(): ActionPlan {
  return {
    critical: [],
    highLeverage: [],
    quickWins: [],
    all: [],
    generatedWithAi: false,
  };
}

export function scoreToLevel(score: number): number {
  if (score < 20) {
    return 1;
  }
  if (score < 40) {
    return 2;
  }
  if (score < 60) {
    return 3;
  }
  if (score < 80) {
    return 4;
  }
  return 5;
}

export function buildWebPayload(
  input: WebTransformInput,
  history: WebHistoryPoint[],
): WebReportPayload {
  const criteriaByCategory = createCategoryBuckets();
  const actionPlan = input.actionPlan ?? emptyActionPlan();
  const guidanceByCriterion = new Map(actionPlan.all.map((item) => [item.criterionId, item]));
  const repoName = path.basename(input.meta.repoPath);

  for (const result of input.results) {
    const cardMeta = getCardMeta(result.id);
    const guidance = guidanceByCriterion.get(result.id);
    const description = getDescription(result.id);
    const scoreLabel = toScoreLabel(result.status, cardMeta.maxPoints);
    const remediationPrompt =
      result.status === 'fail' || result.status === 'unverified'
        ? buildRemediationPrompt({
            repoName,
            signalName: cardMeta.name,
            scoreLabel,
            description,
            reason: result.reason,
            evidence: result.evidence,
            evidenceDetails: result.evidenceDetails,
          })
        : undefined;

    const card: WebCriterionCard = {
      id: result.id,
      name: cardMeta.name,
      description,
      category: result.category,
      badge: cardMeta.badge,
      maxPoints: cardMeta.maxPoints,
      scoreLabel,
      status: result.status,
      confidence: result.confidence,
      reason: result.reason,
      evidence: result.evidence,
      evidenceDetails: result.evidenceDetails,
      improvementTips: getImprovementTips(result, guidance),
      remediationPrompt,
      guidance,
      priorityRank: guidance?.rank,
      source: result.source,
      applicable: result.applicable,
    };

    criteriaByCategory[result.category].push(card);
  }

  for (const category of Object.keys(criteriaByCategory) as CategoryId[]) {
    criteriaByCategory[category].sort(cardSort);
  }

  const categories: WebCategorySummary[] = categoryOrder().map((category) => {
    const row = input.summary.categoryScores.find((item) => item.category === category);
    return {
      id: category,
      label: CATEGORY_LABELS[category],
      score: row?.score ?? 0,
      confidenceScore: row?.confidenceScore ?? 0,
      highConfidenceCoverage: row?.highConfidenceCoverage ?? 0,
      pass: row?.pass ?? 0,
      fail: row?.fail ?? 0,
      skip: row?.skip ?? 0,
      unverified: row?.unverified ?? 0,
    };
  });

  return {
    header: {
      repoName,
      repoPath: input.meta.repoPath,
      lastUpdated: input.meta.generatedAt,
      level: scoreToLevel(input.summary.score),
      score: input.summary.score,
      coverage: input.summary.coverage,
      confidenceScore: input.summary.confidenceScore,
      highConfidenceCoverage: input.summary.highConfidenceCoverage,
      fingerprint: input.meta.fingerprint,
    },
    summary: input.summary,
    actionPlan,
    categories,
    criteriaByCategory,
    history,
    warnings: input.warnings,
    knownLimitations: KNOWN_LIMITATIONS,
    qualityGateVersion: QUALITY_GATE_VERSION,
    generatedAt: input.meta.generatedAt,
    meta: input.meta,
  };
}
