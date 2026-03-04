import { ActionPlan, CriterionResult, RecommendationItem } from '../../types';
import { getCardMeta } from '../card-meta';
import { assignBucketsByRank } from './buckets';
import {
  defaultExpectedOutcome,
  defaultNextSteps,
  defaultWhatGoodLooksLike,
  defaultWhyItMatters,
} from './defaults';
import { computeActionabilityScore, computePriorityScore } from './priority';
import {
  DeterministicActionPlanResult,
  RecommendationEnrichment,
  RecommendationSeed,
} from './types';

const VAGUE_TERMS = /(improve|optimi[sz]e|enhance|consider|etc|best practice|as needed|when possible|review regularly)/i;

function isSpecificText(value: string, minLength: number): boolean {
  const text = value.trim();
  if (text.length < minLength) {
    return false;
  }
  return !VAGUE_TERMS.test(text);
}

function sanitizeText(value: string | undefined, fallback: string, minLength: number): string {
  if (!value) {
    return fallback;
  }
  const text = value.trim();
  if (!isSpecificText(text, minLength)) {
    return fallback;
  }
  return text;
}

function sanitizeNextSteps(nextSteps: string[] | undefined, fallback: string[]): string[] {
  if (!Array.isArray(nextSteps) || nextSteps.length === 0) {
    return fallback;
  }

  const cleaned = Array.from(
    new Set(
      nextSteps
        .map((step) => step.trim())
        .filter((step) => step.length > 0),
    ),
  ).slice(0, 5);

  const concreteCount = cleaned.filter((step) => isSpecificText(step, 18)).length;
  if (cleaned.length === 0 || concreteCount < 2) {
    return fallback;
  }

  return cleaned;
}

export function buildDeterministicActionPlan(results: CriterionResult[]): DeterministicActionPlanResult {
  const weakResults = results.filter(
    (result) => result.applicable && (result.status === 'fail' || result.status === 'unverified'),
  );
  const weakCriteria = new Set(weakResults.map((result) => result.id));

  const ranked = weakResults
    .map((result) => {
      const cardMeta = getCardMeta(result.id);
      const criterionName = cardMeta.name;
      const priorityScore = computePriorityScore(result, weakCriteria);
      const whyItMatters = defaultWhyItMatters(result, criterionName);
      const whatGoodLooksLike = defaultWhatGoodLooksLike(result, criterionName);
      const nextSteps = defaultNextSteps(result);
      const expectedOutcome = defaultExpectedOutcome(result);
      const status = result.status as Exclude<CriterionResult['status'], 'pass' | 'skip'>;
      const actionabilityScore = computeActionabilityScore({
        status,
        confidence: result.confidence,
        nextSteps,
        whyItMatters,
        expectedOutcome,
      });

      const recommendation: RecommendationItem = {
        id: `rec-${result.id}`,
        criterionId: result.id,
        criterionName,
        category: result.category,
        status,
        confidence: result.confidence,
        bucket: 'quickWins',
        priorityScore,
        actionabilityScore,
        rank: 0,
        whyItMatters,
        whatGoodLooksLike,
        nextSteps,
        expectedOutcome,
      };

      return {
        result,
        recommendation,
      };
    })
    .sort((a, b) => {
      if (b.recommendation.priorityScore !== a.recommendation.priorityScore) {
        return b.recommendation.priorityScore - a.recommendation.priorityScore;
      }
      if (b.recommendation.actionabilityScore !== a.recommendation.actionabilityScore) {
        return b.recommendation.actionabilityScore - a.recommendation.actionabilityScore;
      }
      return a.recommendation.criterionId.localeCompare(b.recommendation.criterionId);
    })
    .map((entry, index) => ({
      ...entry,
      recommendation: {
        ...entry.recommendation,
        rank: index + 1,
      },
    }));

  const rankedRecommendations = assignBucketsByRank(ranked.map((entry) => entry.recommendation));
  const recommendationByCriterionId = new Map(
    rankedRecommendations.map((recommendation) => [recommendation.criterionId, recommendation]),
  );

  const rankedWithBuckets = ranked.map((entry) => ({
    ...entry,
    recommendation: recommendationByCriterionId.get(entry.recommendation.criterionId) ?? entry.recommendation,
  }));

  const all = rankedWithBuckets.map((entry) => entry.recommendation);
  const critical = all.filter((item) => item.bucket === 'critical');
  const highLeverage = all.filter((item) => item.bucket === 'highLeverage');
  const quickWins = all.filter((item) => item.bucket === 'quickWins');

  const seeds: RecommendationSeed[] = rankedWithBuckets.map(({ result, recommendation }) => ({
    criterionId: recommendation.criterionId,
    criterionName: recommendation.criterionName,
    category: recommendation.category,
    status: recommendation.status,
    confidence: recommendation.confidence,
    priorityScore: recommendation.priorityScore,
    actionabilityScore: recommendation.actionabilityScore,
    rank: recommendation.rank,
    reason: result.reason,
    evidence: result.evidence.slice(0, 4),
    evidenceDetails: result.evidenceDetails.map((item) => `${item.kind}:${item.strength}:${item.detail}`).slice(0, 5),
    deterministic: {
      whyItMatters: recommendation.whyItMatters,
      whatGoodLooksLike: recommendation.whatGoodLooksLike,
      nextSteps: recommendation.nextSteps,
      expectedOutcome: recommendation.expectedOutcome,
    },
  }));

  return {
    actionPlan: {
      critical,
      highLeverage,
      quickWins,
      all,
      generatedWithAi: false,
    },
    seeds,
  };
}

export function applyActionPlanEnrichment(
  actionPlan: ActionPlan,
  enrichmentByCriterion: Record<string, RecommendationEnrichment>,
): ActionPlan {
  if (Object.keys(enrichmentByCriterion).length === 0) {
    return actionPlan;
  }

  let enrichedCount = 0;
  const updatedAll = actionPlan.all.map((item) => {
    const enriched = enrichmentByCriterion[item.criterionId];
    if (!enriched) {
      return item;
    }

    const nextSteps =
      sanitizeNextSteps(enriched.nextSteps, item.nextSteps);

    const whyItMatters = sanitizeText(enriched.whyItMatters, item.whyItMatters, 60);
    const whatGoodLooksLike = sanitizeText(enriched.whatGoodLooksLike, item.whatGoodLooksLike, 40);
    const expectedOutcome = sanitizeText(enriched.expectedOutcome, item.expectedOutcome, 45);
    const actionabilityScore = computeActionabilityScore({
      status: item.status,
      confidence: item.confidence,
      nextSteps,
      whyItMatters,
      expectedOutcome,
    });

    const updated: RecommendationItem = {
      ...item,
      whyItMatters,
      whatGoodLooksLike,
      nextSteps,
      expectedOutcome,
      actionabilityScore,
    };
    enrichedCount += 1;
    return updated;
  });

  const regroup = {
    critical: updatedAll.filter((item) => item.bucket === 'critical'),
    highLeverage: updatedAll.filter((item) => item.bucket === 'highLeverage'),
    quickWins: updatedAll.filter((item) => item.bucket === 'quickWins'),
  };

  return {
    ...actionPlan,
    ...regroup,
    all: updatedAll,
    generatedWithAi: enrichedCount > 0 || actionPlan.generatedWithAi,
  };
}
