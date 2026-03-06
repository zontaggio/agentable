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
    assert.equal(fs.existsSync(path.join(root, binPath)), true);
  }
});
