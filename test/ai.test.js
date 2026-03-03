const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { collectAiAssessments } = require('../dist/collectors/ai');

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

  global.fetch = async (url, init) => {
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
  };

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
