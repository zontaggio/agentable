const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeResults } = require('../dist/core/scoring');

test('score ignores skip and unverified in denominator', () => {
  const summary = summarizeResults([
    {
      id: 'a',
      category: 'testing',
      status: 'pass',
      reason: '',
      evidence: [],
      source: 'local',
      applicable: true,
    },
    {
      id: 'b',
      category: 'testing',
      status: 'fail',
      reason: '',
      evidence: [],
      source: 'local',
      applicable: true,
    },
    {
      id: 'c',
      category: 'testing',
      status: 'skip',
      reason: '',
      evidence: [],
      source: 'local',
      applicable: false,
    },
    {
      id: 'd',
      category: 'testing',
      status: 'unverified',
      reason: '',
      evidence: [],
      source: 'gh',
      applicable: true,
    },
  ]);

  assert.equal(summary.score, 50);
  assert.equal(summary.coverage, 50);
  assert.equal(summary.counts.pass, 1);
  assert.equal(summary.counts.fail, 1);
  assert.equal(summary.counts.skip, 1);
  assert.equal(summary.counts.unverified, 1);
});
