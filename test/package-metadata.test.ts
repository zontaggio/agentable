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
    repository: { url: string };
    bugs: { url: string };
    homepage: string;
  };

  assert.deepEqual(packageJson.files, ['dist', 'README.md', 'LICENSE', 'SECURITY.md']);

  assert.equal(fs.existsSync(path.join(root, packageJson.main)), true);
  assert.equal(fs.existsSync(path.join(root, packageJson.types)), true);
  assert.equal(packageJson.repository.url, 'https://github.com/zontaggio/agentable.git');
  assert.equal(packageJson.bugs.url, 'https://github.com/zontaggio/agentable/issues');
  assert.equal(packageJson.homepage, 'https://github.com/zontaggio/agentable#readme');

  for (const binPath of Object.values(packageJson.bin)) {
    const absBinPath = path.join(root, binPath);
    assert.equal(fs.existsSync(absBinPath), true);
    const mode = fs.statSync(absBinPath).mode & 0o777;
    assert.equal(mode & 0o111, 0o111);
  }
});
