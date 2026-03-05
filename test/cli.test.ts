const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('cli rejects removed --no-ai flag with explicit error', () => {
  const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
  const result = spawnSync(process.execPath, [cliPath, '--no-ai'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Option --no-ai was removed\. AI is now mandatory\./);
});

test('cli rejects removed --terminal flag with explicit error', () => {
  const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
  const result = spawnSync(process.execPath, [cliPath, '--terminal'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Option --terminal was removed/);
});

test('cli fails in non-interactive mode when AI config is missing', () => {
  const cliPath = path.join(__dirname, '..', 'dist', 'cli.js');
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'agentable-cli-home-'));
  const result = spawnSync(process.execPath, [cliPath, '.', '--ai-failure-mode', 'strict'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: tempHome,
    },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /AI config not found or invalid and strict AI mode is enabled/);
  assert.match(result.stderr, /agentable --setup/);
});

export {};
