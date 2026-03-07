const test = require('node:test');
const assert = require('node:assert/strict');
const { defaultWhyItMatters } = require('../dist/web/improvement-tips/defaults');

test('defaultWhyItMatters uses manual agent-readiness copy for branch protection', () => {
  const text = defaultWhyItMatters(
    {
      id: 'branch_protection',
      category: 'security',
      status: 'fail',
      confidence: 'high',
      reason: 'Branch protection is enabled.',
      evidence: [],
      evidenceDetails: [],
      source: 'gh',
      applicable: true,
    },
    'Branch Protection',
  );

  assert.equal(
    text,
    'Branch protection keeps agent-generated changes inside enforced review and CI gates instead of relying on manual discipline.',
  );
});

test('defaultWhyItMatters no longer falls back to current-state wording', () => {
  const text = defaultWhyItMatters(
    {
      id: 'formatter',
      category: 'style_validation',
      status: 'unverified',
      confidence: 'medium',
      reason: 'Formatter signal is ambiguous.',
      evidence: [],
      evidenceDetails: [],
      source: 'local',
      applicable: true,
    },
    'Formatter',
  );

  assert.doesNotMatch(text, /currently weak/i);
  assert.match(text, /agents/i);
});

export {};
