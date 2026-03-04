import {
  AiAssessment,
  CriterionDefinition,
  CriterionResult,
} from '../../types';
import { evidenceDetail } from './result';

export function applyAiIfPresent(
  criterion: CriterionDefinition,
  aiAssessments: Record<string, AiAssessment>,
): CriterionResult | null {
  const ai = aiAssessments[criterion.id];
  if (!ai) {
    return null;
  }

  return {
    id: criterion.id,
    category: criterion.category,
    status: ai.status,
    confidence: ai.status === 'unverified' ? 'low' : 'medium',
    reason: ai.reason,
    evidence: ai.evidence,
    evidenceDetails: ai.evidence.map((item) => evidenceDetail('ai', 'medium', item)),
    source: 'ai',
    applicable: true,
  };
}
