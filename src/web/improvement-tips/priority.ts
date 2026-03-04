import { CriterionConfidence, CriterionResult } from '../../types';
import { getCardMeta } from '../card-meta';
import { CATEGORY_PRIORITY, CONFIDENCE_PRIORITY, DEPENDENCY_GRAPH, STATUS_PRIORITY } from './constants';

function statusWeight(status: Exclude<CriterionResult['status'], 'pass' | 'skip'>): number {
  return STATUS_PRIORITY[status];
}

function confidenceWeight(confidence: CriterionConfidence): number {
  return CONFIDENCE_PRIORITY[confidence];
}

function findDependencyBoost(criterionId: string, weakCriteria: Set<string>): number {
  const dependencies = DEPENDENCY_GRAPH[criterionId] ?? [];
  if (dependencies.length === 0) {
    return 0;
  }

  const unresolved = dependencies.filter((id) => weakCriteria.has(id)).length;
  return unresolved / dependencies.length;
}

export function computePriorityScore(result: CriterionResult, weakCriteria: Set<string>): number {
  const meta = getCardMeta(result.id);
  const categoryWeight = CATEGORY_PRIORITY[result.category];
  const severity = meta.maxPoints === 2 ? 1.2 : 1;
  const dependencyBoost = findDependencyBoost(result.id, weakCriteria);

  const score =
    categoryWeight * 18 +
    severity * 14 +
    statusWeight(result.status as Exclude<CriterionResult['status'], 'pass' | 'skip'>) * 26 +
    confidenceWeight(result.confidence) * 9 +
    dependencyBoost * 10;

  return Math.round(score * 10) / 10;
}
