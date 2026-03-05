const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDeterministicActionPlan } = require('../dist/web/improvement-tips');

function result(id, category, status) {
  return {
    id,
    category,
    status,
    confidence: status === 'fail' ? 'medium' : 'low',
    reason: 'sample reason',
    evidence: [],
    evidenceDetails: [],
    source: 'local',
    applicable: true,
  };
}

test('deterministic action plan spreads buckets for larger weak sets', () => {
  const input = [
    result('branch_protection', 'security', 'fail'),
    result('secret_scanning', 'security', 'fail'),
    result('metrics_collection', 'debugging_observability', 'fail'),
    result('build_cmd_doc', 'build_system', 'fail'),
    result('unit_tests_exist', 'testing', 'fail'),
    result('readme', 'documentation', 'fail'),
    result('env_template', 'dev_environment', 'unverified'),
    result('issue_templates', 'task_discovery', 'unverified'),
    result('product_analytics_instrumentation', 'product_analytics', 'unverified'),
  ];

  const plan = buildDeterministicActionPlan(input).actionPlan;
  assert.equal(plan.all.length, input.length);
  assert.ok(plan.critical.length > 0);
  assert.ok(plan.highLeverage.length > 0);
  assert.ok(plan.quickWins.length > 0);
  assert.equal(
    plan.critical.length + plan.highLeverage.length + plan.quickWins.length,
    input.length,
  );
  for (const item of plan.all) {
    assert.equal(typeof item.actionabilityScore, 'number');
    assert.ok(item.actionabilityScore >= 0 && item.actionabilityScore <= 100);
  }
});

test('deterministic action plan keeps all three buckets for exactly three items', () => {
  const input = [
    result('branch_protection', 'security', 'fail'),
    result('metrics_collection', 'debugging_observability', 'fail'),
    result('issue_templates', 'task_discovery', 'unverified'),
  ];

  const plan = buildDeterministicActionPlan(input).actionPlan;
  assert.equal(plan.critical.length, 1);
  assert.equal(plan.highLeverage.length, 1);
  assert.equal(plan.quickWins.length, 1);
});

export {};
