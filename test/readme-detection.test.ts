const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { collectLocalProjectContext } = require('../dist/collectors/local');

test('the root README wins over nested ones that sort earlier', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-readme-'));
  await fs.mkdir(path.join(root, 'docs'), { recursive: true });
  await fs.mkdir(path.join(root, 'fixtures/sample'), { recursive: true });
  await fs.writeFile(path.join(root, 'README.md'), '# Project\n', 'utf8');
  await fs.writeFile(path.join(root, 'docs/README.md'), '# Docs\n', 'utf8');
  await fs.writeFile(path.join(root, 'fixtures/sample/README.md'), '# Fixture\n', 'utf8');

  const local = await collectLocalProjectContext(root);
  assert.equal(local.readmePath, 'README.md');
});

test('a nested README is used when the root has none', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-readme-'));
  await fs.mkdir(path.join(root, 'docs'), { recursive: true });
  await fs.writeFile(path.join(root, 'docs/README.md'), '# Docs\n', 'utf8');

  const local = await collectLocalProjectContext(root);
  assert.equal(local.readmePath, 'docs/README.md');
});

export {};
