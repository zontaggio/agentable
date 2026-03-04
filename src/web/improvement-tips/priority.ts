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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function countConcreteSteps(nextSteps: string[]): number {
  const vagueTerms = /(improve|optimi[sz]e|enhance|consider|etc|best practice|as needed|when possible)/i;
  return nextSteps.filter((step) => {
    const text = step.trim();
    if (text.length < 18) {
      return false;
    }
    return !vagueTerms.test(text);
  }).length;
}

export function computeActionabilityScore(input: {
  status: Exclude<CriterionResult['status'], 'pass' | 'skip'>;
  confidence: CriterionConfidence;
  nextSteps: string[];
  whyItMatters: string;
  expectedOutcome: string;
}): number {
  let score = 45;

  score += input.status === 'fail' ? 15 : 9;

  if (input.confidence === 'high') {
    score += 14;
  } else if (input.confidence === 'medium') {
    score += 10;
  } else {
    score += 6;
  }

  const concreteSteps = countConcreteSteps(input.nextSteps);
  score += Math.min(20, concreteSteps * 5);

  if (input.whyItMatters.trim().length >= 60) {
    score += 4;
  }
  if (input.expectedOutcome.trim().length >= 45) {
    score += 4;
  }

  return Math.round(clamp(score, 0, 100));
}
