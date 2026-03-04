import { ActionPlan, CriterionResult, RecommendationItem } from '../../types';
import { getCardMeta } from '../card-meta';
import { assignBucketsByRank } from './buckets';
import {
  defaultExpectedOutcome,
  defaultNextSteps,
  defaultWhatGoodLooksLike,
  defaultWhyItMatters,
} from './defaults';
import { computePriorityScore } from './priority';
import {
  DeterministicActionPlanResult,
  RecommendationEnrichment,
  RecommendationSeed,
} from './types';

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

      const recommendation: RecommendationItem = {
        id: `rec-${result.id}`,
        criterionId: result.id,
        criterionName,
        category: result.category,
        status,
        confidence: result.confidence,
        bucket: 'quickWins',
        priorityScore,
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
      Array.isArray(enriched.nextSteps) && enriched.nextSteps.length > 0
        ? enriched.nextSteps.filter((step) => step.trim().length > 0).slice(0, 5)
        : item.nextSteps;

    const updated: RecommendationItem = {
      ...item,
      whyItMatters: enriched.whyItMatters?.trim() ? enriched.whyItMatters.trim() : item.whyItMatters,
      whatGoodLooksLike: enriched.whatGoodLooksLike?.trim() ? enriched.whatGoodLooksLike.trim() : item.whatGoodLooksLike,
      nextSteps,
      expectedOutcome: enriched.expectedOutcome?.trim() ? enriched.expectedOutcome.trim() : item.expectedOutcome,
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
