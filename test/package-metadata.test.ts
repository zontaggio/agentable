import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('package entrypoints and publish files are configured for release', () => {
  const root = path.resolve(__dirname, '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as {
    main: string;
    types: string;
    bin: Record<string, string>;
    files: string[];
  };

  assert.deepEqual(packageJson.files, [
    'dist',
    'README.md',
    'LICENSE',
    'CHANGELOG.md',
    'SECURITY.md',
  ]);

  assert.equal(fs.existsSync(path.join(root, packageJson.main)), true);
  assert.equal(fs.existsSync(path.join(root, packageJson.types)), true);

  for (const binPath of Object.values(packageJson.bin)) {
    const absBinPath = path.join(root, binPath);
    assert.equal(fs.existsSync(absBinPath), true);
    const mode = fs.statSync(absBinPath).mode & 0o777;
    assert.equal(mode & 0o111, 0o111);
  }
});
