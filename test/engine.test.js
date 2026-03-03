const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { runAgentReadiness } = require('../dist/core/engine');

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

  await fs.writeFile(path.join(root, 'README.md'), '# Fixture\n\nRun `npm install` and `npm run build`.', 'utf8');
  await fs.writeFile(path.join(root, '.gitignore'), 'node_modules\n.env\n.DS_Store\n.idea\n.vscode\n', 'utf8');
  await fs.writeFile(path.join(root, 'src/index.ts'), 'export const ok = true;\n', 'utf8');
  await fs.writeFile(path.join(root, 'test/basic.test.ts'), 'export {};\n', 'utf8');

  return root;
}

test('engine runs in local-only mode and produces summary/report', async () => {
  const repoPath = await createRepoFixture();

  const result = await runAgentReadiness({
    repoPath,
    verbose: false,
    noAi: true,
    noGh: true,
  });

  assert.equal(typeof result.report, 'string');
  assert.ok(result.report.includes('Agentable Score'));
  assert.ok(result.summary.counts.total > 10);

  const result2 = await runAgentReadiness({
    repoPath,
    verbose: false,
    noAi: true,
    noGh: true,
  });

  assert.equal(result.summary.score, result2.summary.score);
  assert.equal(result.summary.coverage, result2.summary.coverage);
});
