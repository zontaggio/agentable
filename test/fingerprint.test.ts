const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { computeRepoFingerprint } = require('../dist/utils/hash');

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'agentable-fp-'));
}

test('fingerprint is stable and changes when file content changes', async () => {
  const dir = await makeTempDir();
  const fileA = path.join(dir, 'a.txt');
  const fileB = path.join(dir, 'b.txt');

  await fs.writeFile(fileA, 'hello', 'utf8');
  await fs.writeFile(fileB, 'world', 'utf8');

  const files = ['a.txt', 'b.txt'];

  const fp1 = await computeRepoFingerprint(dir, files);
  const fp2 = await computeRepoFingerprint(dir, files);
  assert.equal(fp1, fp2);

  await fs.writeFile(fileB, 'world-v2', 'utf8');
  const fp3 = await computeRepoFingerprint(dir, files);
  assert.notEqual(fp2, fp3);
});

export {};
