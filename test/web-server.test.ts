const test = require('node:test');
const assert = require('node:assert/strict');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testHome = fsSync.mkdtempSync(path.join(os.tmpdir(), 'agentable-web-home-'));
process.env.HOME = testHome;

const { startWebServer } = require('../dist/web/server');

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
  global.fetch = (async (url, init) => {
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
  }) as unknown as typeof fetch;

  return () => {
    global.fetch = previousFetch;
  };
}

async function createRepoFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-webrepo-'));

  await fs.mkdir(path.join(root, 'src'), { recursive: true });
  await fs.mkdir(path.join(root, 'test'), { recursive: true });

  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'fixture-web-repo',
        version: '1.0.0',
        scripts: {
          test: 'node --test',
          build: 'echo build',
        },
        devDependencies: {
          eslint: '^9.0.0',
        },
      },
      null,
      2,
    ),
    'utf8',
  );

  await fs.writeFile(
    path.join(root, 'README.md'),
    '# Fixture Web Repo\n\nRun npm install.',
    'utf8',
  );
  await fs.writeFile(
    path.join(root, '.gitignore'),
    'node_modules\n.env\n.DS_Store\n.idea\n.vscode\n',
    'utf8',
  );
  await fs.writeFile(path.join(root, 'src/index.ts'), 'export const ready = true;\n', 'utf8');
  await fs.writeFile(path.join(root, 'test/basic.test.ts'), 'export {};\n', 'utf8');

  return root;
}

test('web server exposes report and refresh endpoints', async () => {
  const restoreFetch = installAiMock();
  const repoPath = await createRepoFixture();
  const historyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-web-history-'));

  let started;
  try {
    started = await startWebServer({
      runOptions: {
        repoPath,
        verbose: false,
        noGh: true,
        aiApiKey: 'test-openrouter-key',
        aiModel: 'gpt-oss-120b',
      },
      host: '127.0.0.1',
      port: 0,
      historyDir,
    });

    const reportRes = await fetch(`${started.url}/api/report`);
    assert.equal(reportRes.status, 200);
    const payload = (await reportRes.json()) as any;
    assert.equal(typeof payload.header.repoPath, 'string');
    assert.ok(Array.isArray(payload.categories));
    assert.ok(payload.actionPlan);
    assert.ok(Array.isArray(payload.actionPlan.all));
    assert.equal(typeof payload.qualityGateVersion, 'string');
    assert.ok(Array.isArray(payload.knownLimitations));

    const targetCriterionId = payload.actionPlan.all[0] && payload.actionPlan.all[0].criterionId;
    assert.ok(typeof targetCriterionId === 'string');

    const feedbackRes = await fetch(`${started.url}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        criterionId: targetCriterionId,
        useful: true,
        reason: 'Actionable and clear.',
      }),
    });
    assert.equal(feedbackRes.status, 200);

    const invalidFeedbackRes = await fetch(`${started.url}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        criterionId: 'unknown_criterion',
        useful: false,
      }),
    });
    assert.equal(invalidFeedbackRes.status, 400);

    const refreshRes = await fetch(`${started.url}/api/refresh`, { method: 'POST' });
    assert.equal(refreshRes.status, 200);

    const jsonExport = await fetch(`${started.url}/api/export.json`);
    assert.equal(jsonExport.status, 200);

    const htmlExport = await fetch(`${started.url}/api/export.html`);
    assert.equal(htmlExport.status, 200);

    const indexRes = await fetch(`${started.url}/`);
    assert.equal(indexRes.status, 200);
    const indexHtml = await indexRes.text();
    assert.ok(indexHtml.includes('Agentable'));
  } finally {
    if (started) {
      await started.close();
    }
    restoreFetch();
  }
});

export {};
