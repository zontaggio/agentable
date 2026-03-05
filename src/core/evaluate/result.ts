import {
  CriterionConfidence,
  CriterionDefinition,
  CriterionEvidenceDetail,
  CriterionResult,
  EvidenceKind,
  EvidenceStrength,
} from '../../types';

const CONSERVATIVE_CRITERIA = new Set<string>([
  'alerting_configured',
  'circuit_breakers',
  'code_quality_metrics',
  'deployment_observability',
  'distributed_tracing',
  'error_tracking_contextualized',
  'health_checks',
  'metrics_collection',
  'profiling_instrumentation',
  'structured_logging',
  'log_scrubbing',
  'pii_handling',
  'privacy_compliance',
  'secrets_management',
  'error_to_insight_pipeline',
  'product_analytics_instrumentation',
  'progressive_rollout',
  'rollback_automation',
]);

export function evidenceDetail(
  kind: EvidenceKind,
  strength: EvidenceStrength,
  detail: string,
): CriterionEvidenceDetail {
  return {
    kind,
    strength,
    detail,
  };
}

function inferConfidence(
  status: CriterionResult['status'],
  evidenceDetails: CriterionEvidenceDetail[],
): CriterionConfidence {
  if (status === 'unverified') {
    return 'low';
  }
  if (status === 'skip') {
    return 'medium';
  }

  const hasStrong = evidenceDetails.some((item) => item.strength === 'strong');
  if (hasStrong) {
    return 'high';
  }
  const hasMedium = evidenceDetails.some((item) => item.strength === 'medium');
  if (hasMedium) {
    return 'medium';
  }
  return 'low';
}

export function makeResult(
  criterion: CriterionDefinition,
  status: CriterionResult['status'],
  reason: string,
  evidence: string[] = [],
  evidenceDetails: CriterionEvidenceDetail[] = [],
  confidence?: CriterionConfidence,
  applicable = true,
): CriterionResult {
  const normalizedEvidenceDetails =
    evidenceDetails.length > 0
      ? evidenceDetails
      : (evidence.length > 0 ? evidence : [reason]).map((detail) => ({
          kind: 'text' as const,
          strength: 'weak' as const,
          detail,
        }));

  const finalConfidence = confidence ?? inferConfidence(status, normalizedEvidenceDetails);

  return {
    id: criterion.id,
    category: criterion.category,
    status,
    confidence: finalConfidence,
    reason,
    evidence,
    evidenceDetails: normalizedEvidenceDetails,
    source: criterion.source,
    applicable,
  };
}

export function enforceConservativeDecision(result: CriterionResult): CriterionResult {
  if (!CONSERVATIVE_CRITERIA.has(result.id)) {
    return result;
  }

  if (result.status !== 'pass') {
    return result;
  }

  const strongEvidence = result.evidenceDetails.filter((item) => item.strength === 'strong').length;
  const mediumEvidence = result.evidenceDetails.filter((item) => item.strength === 'medium').length;
  if (strongEvidence > 0 || mediumEvidence >= 2) {
    return result;
  }

  return {
    ...result,
    status: 'unverified',
    confidence: 'low',
    reason: `${result.reason} Evidence is not strong enough for a conservative pass decision.`,
    evidenceDetails: [
      ...result.evidenceDetails,
      evidenceDetail(
        'text',
        'weak',
        'Conservative mode requires strong evidence (or multiple corroborating medium signals) for pass.',
      ),
    ],
  };
}
