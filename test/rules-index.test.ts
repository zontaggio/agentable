const test = require('node:test');
const assert = require('node:assert/strict');

const { CRITERIA } = require('../dist/catalog/v1');
const { getCriterionEvaluator } = require('../dist/core/evaluate/rules-index');

test('every catalog criterion is mapped to an evaluator', () => {
  for (const criterion of CRITERIA) {
    const evaluator = getCriterionEvaluator(criterion.id);
    assert.equal(typeof evaluator, 'function', `Missing evaluator for ${criterion.id}`);
  }
});

test('unknown criterion returns no evaluator', () => {
  assert.equal(getCriterionEvaluator('missing_criterion_id'), undefined);
});

export {};
