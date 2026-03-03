const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWebPayload, scoreToLevel } = require('../dist/web/transform');

test('scoreToLevel maps score ranges correctly', () => {
  assert.equal(scoreToLevel(0), 1);
  assert.equal(scoreToLevel(19.9), 1);
  assert.equal(scoreToLevel(20), 2);
  assert.equal(scoreToLevel(45), 3);
  assert.equal(scoreToLevel(61), 4);
  assert.equal(scoreToLevel(88), 5);
});

test('buildWebPayload creates category buckets and card metadata', () => {
  const payload = buildWebPayload(
    {
      summary: {
        score: 72,
        coverage: 80,
        counts: {
          pass: 2,
          fail: 1,
          skip: 1,
          unverified: 0,
          total: 4,
          applicable: 3,
          evaluated: 3,
        },
        categoryScores: [
          {
            category: 'style_validation',
            pass: 1,
            fail: 1,
            skip: 0,
            unverified: 0,
            applicable: 2,
            score: 50,
          },
          {
            category: 'build_system',
            pass: 1,
            fail: 0,
            skip: 1,
            unverified: 0,
            applicable: 1,
            score: 100,
          },
        ],
      },
      results: [
        {
          id: 'formatter',
          category: 'style_validation',
          status: 'pass',
          reason: 'Formatter found',
          evidence: ['.prettierrc'],
          source: 'local',
          applicable: true,
        },
        {
          id: 'cyclomatic_complexity',
          category: 'style_validation',
          status: 'fail',
          reason: 'No complexity rule',
          evidence: [],
          source: 'local',
          applicable: true,
        },
        {
          id: 'single_command_setup',
          category: 'build_system',
          status: 'skip',
          reason: 'Skipped test',
          evidence: [],
          source: 'local',
          applicable: false,
        },
      ],
      warnings: ['example warning'],
      meta: {
        fingerprint: 'abc123',
        generatedAt: '2026-03-01T00:00:00.000Z',
        repoPath: '/tmp/repo',
        model: 'openai/gpt-4o-mini',
        aiCache: 'miss',
        aiProvider: 'openrouter',
        catalogVersion: 'v1.0.0',
        repoIdentifier: '/tmp/repo',
      },
    },
    [
      {
        timestamp: '2026-03-01T00:00:00.000Z',
        score: 72,
        coverage: 80,
        level: 4,
        fingerprint: 'abc123',
      },
    ],
  );

  assert.equal(payload.header.level, 4);
  assert.equal(payload.header.repoName, 'repo');
  assert.equal(payload.warnings.length, 1);
  assert.equal(payload.criteriaByCategory.style_validation.length, 2);
  assert.equal(payload.criteriaByCategory.build_system.length, 1);

  const formatterCard = payload.criteriaByCategory.style_validation.find((item) => item.id === 'formatter');
  assert.ok(formatterCard);
  assert.equal(formatterCard.badge, 'BASIC');
  assert.equal(formatterCard.scoreLabel, '1/1');
  assert.ok(Array.isArray(formatterCard.improvementTips));
  assert.ok(formatterCard.improvementTips.length > 0);

  const complexityCard = payload.criteriaByCategory.style_validation.find(
    (item) => item.id === 'cyclomatic_complexity',
  );
  assert.ok(complexityCard);
  assert.equal(complexityCard.badge, 'ADVANCED');
  assert.equal(complexityCard.scoreLabel, '0/2');
});
