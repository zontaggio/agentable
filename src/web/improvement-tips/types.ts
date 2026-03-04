import { ActionPlan, CategoryId, CriterionConfidence, CriterionResult } from '../../types';

export interface RecommendationSeed {
  criterionId: string;
  criterionName: string;
  category: CategoryId;
  status: Exclude<CriterionResult['status'], 'pass' | 'skip'>;
  confidence: CriterionConfidence;
  priorityScore: number;
  rank: number;
  reason: string;
  evidence: string[];
  evidenceDetails: string[];
  deterministic: {
    whyItMatters: string;
    whatGoodLooksLike: string;
    nextSteps: string[];
    expectedOutcome: string;
  };
}

export interface DeterministicActionPlanResult {
  actionPlan: ActionPlan;
  seeds: RecommendationSeed[];
}

export interface RecommendationEnrichment {
  whyItMatters?: string;
  whatGoodLooksLike?: string;
  nextSteps?: string[];
  expectedOutcome?: string;
}
