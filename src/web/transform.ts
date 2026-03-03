import path from 'node:path';
import { CATEGORY_LABELS, CRITERIA } from '../catalog/v1';
import {
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

export interface WebTransformInput {
  summary: ScoreSummary;
  results: CriterionResult[];
  warnings: string[];
  meta: EngineMeta;
}

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

export function buildWebPayload(input: WebTransformInput, history: WebHistoryPoint[]): WebReportPayload {
  const criteriaByCategory = createCategoryBuckets();

  for (const result of input.results) {
    const cardMeta = getCardMeta(result.id);
    const card: WebCriterionCard = {
      id: result.id,
      name: cardMeta.name,
      description: getDescription(result.id),
      category: result.category,
      badge: cardMeta.badge,
      maxPoints: cardMeta.maxPoints,
      scoreLabel: toScoreLabel(result.status, cardMeta.maxPoints),
      status: result.status,
      reason: result.reason,
      evidence: result.evidence,
      improvementTips: getImprovementTips(result),
      source: result.source,
      applicable: result.applicable,
    };

    criteriaByCategory[result.category].push(card);
  }

  for (const category of Object.keys(criteriaByCategory) as CategoryId[]) {
    criteriaByCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  const categories: WebCategorySummary[] = categoryOrder().map((category) => {
    const row = input.summary.categoryScores.find((item) => item.category === category);
    return {
      id: category,
      label: CATEGORY_LABELS[category],
      score: row?.score ?? 0,
      pass: row?.pass ?? 0,
      fail: row?.fail ?? 0,
      skip: row?.skip ?? 0,
      unverified: row?.unverified ?? 0,
    };
  });

  const repoName = path.basename(input.meta.repoPath);

  return {
    header: {
      repoName,
      repoPath: input.meta.repoPath,
      lastUpdated: input.meta.generatedAt,
      level: scoreToLevel(input.summary.score),
      score: input.summary.score,
      coverage: input.summary.coverage,
      fingerprint: input.meta.fingerprint,
    },
    summary: input.summary,
    categories,
    criteriaByCategory,
    history,
    warnings: input.warnings,
    generatedAt: input.meta.generatedAt,
    meta: input.meta,
  };
}
