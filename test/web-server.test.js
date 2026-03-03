const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { startWebServer } = require('../dist/web/server');

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

  await fs.writeFile(path.join(root, 'README.md'), '# Fixture Web Repo\n\nRun npm install.', 'utf8');
  await fs.writeFile(path.join(root, '.gitignore'), 'node_modules\n.env\n.DS_Store\n.idea\n.vscode\n', 'utf8');
  await fs.writeFile(path.join(root, 'src/index.ts'), 'export const ready = true;\n', 'utf8');
  await fs.writeFile(path.join(root, 'test/basic.test.ts'), 'export {};\n', 'utf8');

  return root;
}

test('web server exposes report and refresh endpoints', async () => {
  const repoPath = await createRepoFixture();
  const historyDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-web-history-'));

  const started = await startWebServer({
    runOptions: {
      repoPath,
      verbose: false,
      noAi: true,
      noGh: true,
    },
    host: '127.0.0.1',
    port: 0,
    historyDir,
  });

  try {
    const reportRes = await fetch(`${started.url}/api/report`);
    assert.equal(reportRes.status, 200);
    const payload = await reportRes.json();
    assert.equal(typeof payload.header.repoPath, 'string');
    assert.ok(Array.isArray(payload.categories));

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
    await started.close();
  }
});
