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
    }

    categoryScores.push({
      category,
      pass,
      fail,
      skip,
      unverified,
      applicable,
      score: computeScore(pass, fail),
    });
  }

  categoryScores.sort((a, b) => CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category]));

  return {
    score,
    coverage,
    counts,
    categoryScores,
  };
}
