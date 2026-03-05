const test = require('node:test');
const assert = require('node:assert/strict');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testHome = fsSync.mkdtempSync(path.join(os.tmpdir(), 'agentable-home-'));
process.env.HOME = testHome;

const { runAgentReadiness } = require('../dist/core/engine');

const REAL_FETCH = global.fetch;

function createAiResponse() {
  return {
    choices: [
      {
        message: {
          content: JSON.stringify({
            assessments: [
              {
                id: 'code_modularization',
                status: 'pass',
                reason: 'Module boundaries are clear.',
                evidence: ['src/* folders'],
              },
              {
                id: 'service_flow_documented',
                status: 'unverified',
                reason: 'Not applicable for non-service repository.',
                evidence: [],
              },
            ],
          }),
        },
      },
    ],
  };
}

function installAiMock() {
  const previousFetch = global.fetch;
  global.fetch = async (url, init) => {
    const target = typeof url === 'string' ? url : String(url);
    if (target.includes('openrouter.ai/api/v1/chat/completions')) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async json() {
          return createAiResponse();
        },
      };
    }

    return REAL_FETCH(url, init);
  };

  return () => {
    global.fetch = previousFetch;
  };
}

async function createRepoFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-repo-'));

  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  await fs.mkdir(path.join(root, 'test'), { recursive: true });

  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'fixture-repo',
        version: '1.0.0',
        scripts: {
          test: 'node --test',
          build: 'echo build',
        },
        devDependencies: {
          eslint: '^9.0.0',
          prettier: '^3.0.0',
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  await fs.writeFile(
    path.join(root, 'README.md'),
    '# Fixture\n\nRun `npm install` and `npm run build`.',
    'utf8',
  );
  await fs.writeFile(
    path.join(root, '.gitignore'),
    'node_modules\n.env\n.DS_Store\n.idea\n.vscode\n',
    'utf8',
  );
  await fs.writeFile(path.join(root, 'src/index.ts'), 'export const ok = true;\n', 'utf8');
  await fs.writeFile(path.join(root, 'test/basic.test.ts'), 'export {};\n', 'utf8');

  return root;
}

test('engine runs in local-only mode and produces summary/report', async () => {
  const restoreFetch = installAiMock();
  const repoPath = await createRepoFixture();

  try {
    const result = await runAgentReadiness({
      repoPath,
      verbose: false,
      noGh: true,
      aiApiKey: 'test-openrouter-key',
      aiModel: 'gpt-oss-120b',
    });

    assert.equal(typeof result.report, 'string');
    assert.ok(result.report.includes('Agentable Score'));
    assert.ok(result.summary.counts.total > 10);
    assert.ok(result.actionPlan);
    assert.ok(Array.isArray(result.actionPlan.all));
    const gitignoreCriterion = result.results.find((item) => item.id === 'gitignore_comprehensive');
    assert.ok(gitignoreCriterion);
    assert.equal(gitignoreCriterion.status, 'pass');
    const secretsManagementCriterion = result.results.find(
      (item) => item.id === 'secrets_management',
    );
    assert.ok(secretsManagementCriterion);
    assert.equal(secretsManagementCriterion.status, 'skip');

    const result2 = await runAgentReadiness({
      repoPath,
      verbose: false,
      noGh: true,
      aiApiKey: 'test-openrouter-key',
      aiModel: 'gpt-oss-120b',
    });

    assert.equal(result.summary.score, result2.summary.score);
    assert.equal(result.summary.coverage, result2.summary.coverage);
    assert.equal(result.actionPlan.all.length, result2.actionPlan.all.length);
    assert.deepEqual(
      result.actionPlan.all.map((item) => item.criterionId),
      result2.actionPlan.all.map((item) => item.criterionId),
    );
  } finally {
    restoreFetch();
  }
});

test('engine propagates AI configuration errors', async () => {
  const repoPath = await createRepoFixture();

  await assert.rejects(
    () =>
      runAgentReadiness({
        repoPath,
        verbose: false,
        noGh: true,
        aiFailureMode: 'strict',
      }),
    /OpenRouter API key is missing/,
  );
});

test('engine falls back to deterministic mode when AI is unavailable', async () => {
  const repoPath = await createRepoFixture();

  const result = await runAgentReadiness({
    repoPath,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });

  assert.ok(result.warnings.some((item) => item.includes('fallback mode enabled')));
  const modularization = result.results.find((item) => item.id === 'code_modularization');
  assert.ok(modularization);
  assert.equal(modularization.status, 'unverified');
});
