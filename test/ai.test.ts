const test = require('node:test');
const assert = require('node:assert/strict');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testHome = fsSync.mkdtempSync(path.join(os.tmpdir(), 'agentable-ai-home-'));
process.env.HOME = testHome;

const { collectAiAssessments, enrichActionPlanRecommendations } = require('../dist/collectors/ai');

function makeLocalContext(rootPath) {
  return {
    rootPath,
    files: [],
    fileSet: new Set(),
    packageJson: null,
    dependencies: {},
    devDependencies: {},
    scripts: {},
    readmePath: null,
    gitignoreContent: '',
    workflowFiles: [],
    locEstimate: 0,
    now: new Date(),
  };
}

function makeProfile() {
  return {
    isMonorepo: false,
    isService: false,
    isLibrary: true,
    hasDatabase: false,
    hasFeatureFlags: false,
    hasTypedLanguage: true,
    hasExternalServices: false,
    hasPiiSignals: false,
    hasFrontendBundle: false,
  };
}

function makeRecommendationSeed(index) {
  return {
    criterionId: `criterion_${String(index).padStart(2, '0')}`,
    criterionName: `Criterion ${index}`,
    category: 'security',
    status: 'fail',
    confidence: 'high',
    priorityScore: 100 - index,
    actionabilityScore: 80 - (index % 7),
    rank: index + 1,
    reason: `Reason ${index}`,
    evidence: [`Evidence ${index}`],
    evidenceDetails: [`Detail ${index}`],
    deterministic: {
      whyItMatters: `Why ${index}`,
      whatGoodLooksLike: `Good ${index}`,
      nextSteps: [`Step ${index}`],
      expectedOutcome: `Outcome ${index}`,
    },
  };
}

test('collectAiAssessments throws when API key is missing', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-ai-missing-key-'));

  await assert.rejects(
    () =>
      collectAiAssessments({
        repoPath: root,
        repoIdentifier: 'owner/repo',
        fingerprint: `fp-${Date.now()}-missing`,
        criteriaIds: ['code_modularization'],
        local: makeLocalContext(root),
        profile: makeProfile(),
        model: 'gpt-oss-120b',
      }),
    /OpenRouter API key is missing/,
  );
});

test('collectAiAssessments throws on provider request failure', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-ai-provider-fail-'));
  const realFetch = global.fetch;

  global.fetch = (async (url, init) => {
    const target = typeof url === 'string' ? url : String(url);
    if (target.includes('openrouter.ai/api/v1/chat/completions')) {
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        async json() {
          return {};
        },
      };
    }
    return realFetch(url, init);
  }) as unknown as typeof fetch;

  try {
    await assert.rejects(
      () =>
        collectAiAssessments({
          repoPath: root,
          repoIdentifier: 'owner/repo',
          fingerprint: `fp-${Date.now()}-provider-fail`,
          criteriaIds: ['code_modularization'],
          local: makeLocalContext(root),
          profile: makeProfile(),
          apiKey: 'fake-key',
          model: 'gpt-oss-120b',
        }),
      /AI provider request failed: OpenRouter request failed: 401 Unauthorized/,
    );
  } finally {
    global.fetch = realFetch;
  }
});

test('enrichActionPlanRecommendations batches and caches guidance', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-ai-enrich-cache-'));
  const local = makeLocalContext(root);
  const profile = makeProfile();
  const recommendations = Array.from({ length: 13 }, (_, index) =>
    makeRecommendationSeed(index + 1),
  );
  const fingerprint = `fp-${Date.now()}-enrich-cache`;

  const realFetch = global.fetch;
  let recommendationCalls = 0;

  global.fetch = (async (url, init) => {
    const target = typeof url === 'string' ? url : String(url);
    if (!target.includes('openrouter.ai/api/v1/chat/completions')) {
      return realFetch(url, init);
    }

    const payload = JSON.parse(String(init && init.body ? init.body : '{}'));
    const userContent = payload.messages?.[1]?.content ?? '';
    if (!userContent.includes('Recommendations JSON:')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async json() {
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({ recommendations: [] }),
                },
              },
            ],
          };
        },
      };
    }

    recommendationCalls += 1;
    const marker = 'Recommendations JSON:\n\n';
    const markerIndex = userContent.indexOf(marker);
    const batchJson =
      markerIndex === -1 ? '[]' : userContent.slice(markerIndex + marker.length).trim();
    const batch = JSON.parse(batchJson);

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: batch.map((item) => ({
                    criterionId: item.criterionId,
                    why_it_matters: `Why ${item.criterionId}`,
                    what_good_looks_like: `Good ${item.criterionId}`,
                    next_steps: [`Step 1 ${item.criterionId}`, `Step 2 ${item.criterionId}`],
                    expected_outcome: `Outcome ${item.criterionId}`,
                  })),
                }),
              },
            },
          ],
        };
      },
    };
  }) as unknown as typeof fetch;

  try {
    const first = await enrichActionPlanRecommendations({
      repoIdentifier: 'owner/repo',
      fingerprint,
      local,
      profile,
      recommendations,
      apiKey: 'fake-key',
      model: 'gpt-oss-120b',
    });

    assert.equal(Object.keys(first.guidanceByCriterion).length, recommendations.length);
    assert.equal(first.error, undefined);
    assert.ok(recommendationCalls >= 2);

    const callsAfterFirst = recommendationCalls;
    const second = await enrichActionPlanRecommendations({
      repoIdentifier: 'owner/repo',
      fingerprint,
      local,
      profile,
      recommendations,
      apiKey: 'fake-key',
      model: 'gpt-oss-120b',
    });

    assert.equal(Object.keys(second.guidanceByCriterion).length, recommendations.length);
    assert.equal(recommendationCalls, callsAfterFirst);
  } finally {
    global.fetch = realFetch;
  }
});

test('collectAiAssessments supports openai-compatible provider and custom base URL', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-ai-openai-provider-'));
  const realFetch = global.fetch;
  let requestedUrl = '';

  global.fetch = (async (url, init) => {
    const target = typeof url === 'string' ? url : String(url);
    requestedUrl = target;

    if (!target.includes('/chat/completions')) {
      return realFetch(url, init);
    }

    const payload = JSON.parse(String(init && init.body ? init.body : '{}'));
    assert.equal(payload.model, 'gpt-4o-mini');

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      async json() {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  assessments: [
                    {
                      id: 'code_modularization',
                      status: 'pass',
                      reason: 'Structured modules detected.',
                      evidence: ['src directory'],
                    },
                  ],
                }),
              },
            },
          ],
        };
      },
    };
  }) as unknown as typeof fetch;

  try {
    const result = await collectAiAssessments({
      repoPath: root,
      repoIdentifier: 'owner/repo',
      fingerprint: `fp-${Date.now()}-openai-provider`,
      criteriaIds: ['code_modularization'],
      local: makeLocalContext(root),
      profile: makeProfile(),
      provider: 'openai',
      model: 'gpt-4o-mini',
      baseUrl: 'http://127.0.0.1:11434/v1',
    });

    assert.equal(result.provider, 'openai');
    assert.ok(requestedUrl.startsWith('http://127.0.0.1:11434/v1/chat/completions'));
    assert.equal(result.assessments.code_modularization.status, 'pass');
  } finally {
    global.fetch = realFetch;
  }
});

export {};
