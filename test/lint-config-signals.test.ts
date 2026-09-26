const test = require('node:test');
const assert = require('node:assert/strict');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testHome = fsSync.mkdtempSync(path.join(os.tmpdir(), 'agentable-lint-home-'));
process.env.HOME = testHome;

const { runAgentReadiness } = require('../dist/core/engine');

async function fixtureWithEslintConfig(configSource: string | null, readme = '# Fixture\n') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-lint-repo-'));
  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'lint-fixture',
      version: '1.0.0',
      devDependencies: { eslint: '^9.0.0' },
    }),
    'utf8',
  );
  await fs.writeFile(path.join(root, 'README.md'), readme, 'utf8');
  if (configSource !== null) {
    await fs.writeFile(path.join(root, 'eslint.config.mjs'), configSource, 'utf8');
  }
  return root;
}

async function statusOf(root: string, id: string) {
  const result = await runAgentReadiness({
    repoPath: root,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });
  return result.results.find((item: { id: string }) => item.id === id)?.status;
}

test('complexity and naming rules are read from the ESLint config', async () => {
  const root = await fixtureWithEslintConfig(`export default [{
    rules: {
      complexity: ['error', 15],
      '@typescript-eslint/naming-convention': ['error', { selector: 'default', format: ['camelCase'] }],
    },
  }];`);
  assert.equal(await statusOf(root, 'cyclomatic_complexity'), 'pass');
  assert.equal(await statusOf(root, 'naming_consistency'), 'pass');
});

test('an ESLint config without those rules does not pass them', async () => {
  const root = await fixtureWithEslintConfig(
    `export default [{ rules: { 'no-console': 'warn' } }];`,
  );
  assert.equal(await statusOf(root, 'cyclomatic_complexity'), 'fail');
  assert.equal(await statusOf(root, 'naming_consistency'), 'fail');
});

test('mentioning complexity in the README is not a complexity rule', async () => {
  const root = await fixtureWithEslintConfig(
    `export default [{ rules: {} }];`,
    '# Fixture\n\nWe keep cyclomatic complexity low.\n',
  );
  assert.equal(await statusOf(root, 'cyclomatic_complexity'), 'fail');
});

export {};
