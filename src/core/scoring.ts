import { CATEGORY_LABELS } from '../catalog/v1';
import { CategoryId, CategoryScore, CriterionResult, ScoreSummary } from '../types';

/**
 * Round number to 2 decimal places
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute percentage score: (pass / (pass + fail)) * 100
 * Skip and unverified criteria are excluded from calculation
 */
function computeScore(pass: number, fail: number): number {
  const denominator = pass + fail;
  if (denominator === 0) {
    return 0;
  }
  return round2((pass / denominator) * 100);
}

function confidenceWeight(value: CriterionResult['confidence']): number {
  if (value === 'high') {
    return 1;
  }
  if (value === 'medium') {
    return 0.65;
  }
  return 0.35;
}

/**
 * Aggregate criterion results into summary with scores by category
 * @param results - Array of evaluated criterion results
 * @returns Overall score summary with category breakdowns
 */
export function summarizeResults(results: CriterionResult[]): ScoreSummary {
  const counts = {
    pass: 0,
    fail: 0,
    skip: 0,
    unverified: 0,
    total: results.length,
    applicable: 0,
    evaluated: 0,
  };

  for (const result of results) {
    counts[result.status] += 1;
    if (result.applicable) {
      counts.applicable += 1;
    }
    if (result.status === 'pass' || result.status === 'fail') {
      counts.evaluated += 1;
    }
  }

  const coverage = counts.total > 0 ? round2((counts.evaluated / counts.total) * 100) : 0;
  const score = computeScore(counts.pass, counts.fail);
  const evaluatedResults = results.filter((result) => result.status === 'pass' || result.status === 'fail');
  const totalConfidenceWeight = evaluatedResults.reduce((acc, result) => acc + confidenceWeight(result.confidence), 0);
  const highConfidenceCount = evaluatedResults.filter((result) => result.confidence === 'high').length;
  const confidenceScore =
    evaluatedResults.length > 0 ? round2((totalConfidenceWeight / evaluatedResults.length) * 100) : 0;
  const highConfidenceCoverage =
    evaluatedResults.length > 0 ? round2((highConfidenceCount / evaluatedResults.length) * 100) : 0;

  const categories = new Map<CategoryId, CriterionResult[]>();
  for (const result of results) {
    if (!categories.has(result.category)) {
      categories.set(result.category, []);
    }
    categories.get(result.category)?.push(result);
  }

  const categoryScores: CategoryScore[] = [];

  for (const [category, items] of categories.entries()) {
    let pass = 0;
    let fail = 0;
    let skip = 0;
    let unverified = 0;
    let applicable = 0;
    let evaluatedCount = 0;
    let confidenceWeightSum = 0;
    let highConfidence = 0;

    for (const item of items) {
      if (item.status === 'pass') {
        pass += 1;
      }
      if (item.status === 'fail') {
        fail += 1;
      }
      if (item.status === 'skip') {
        skip += 1;
      }
      if (item.status === 'unverified') {
        unverified += 1;
      }
      if (item.applicable) {
        applicable += 1;
      }
      if (item.status === 'pass' || item.status === 'fail') {
        evaluatedCount += 1;
        confidenceWeightSum += confidenceWeight(item.confidence);
        if (item.confidence === 'high') {
          highConfidence += 1;
        }
      }
    }

    categoryScores.push({
      category,
      pass,
      fail,
      skip,
      unverified,
      applicable,
      score: computeScore(pass, fail),
      confidenceScore: evaluatedCount > 0 ? round2((confidenceWeightSum / evaluatedCount) * 100) : 0,
      highConfidenceCoverage: evaluatedCount > 0 ? round2((highConfidence / evaluatedCount) * 100) : 0,
    });
  }

  categoryScores.sort((a, b) => CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category]));

  return {
    score,
    coverage,
    confidenceScore,
    highConfidenceCoverage,
    counts,
    categoryScores,
  };
}
