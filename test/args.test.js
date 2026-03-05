const test = require('node:test');
const assert = require('node:assert/strict');

const { parseArgs } = require('../dist/cli/args');

test('parseArgs defaults ai failure mode to fallback', () => {
  const parsed = parseArgs(['.']);
  assert.ok(parsed);
  assert.equal(parsed.runOptions.aiFailureMode, 'fallback');
});

test('parseArgs accepts strict ai failure mode', () => {
  const parsed = parseArgs(['.', '--ai-failure-mode', 'strict']);
  assert.ok(parsed);
  assert.equal(parsed.runOptions.aiFailureMode, 'strict');
});

test('parseArgs rejects invalid ai failure mode', () => {
  assert.throws(
    () => parseArgs(['.', '--ai-failure-mode', 'invalid']),
    /Invalid --ai-failure-mode value/,
  );
});

test('parseArgs enables dry-run mode', () => {
  const parsed = parseArgs(['.', '--dry-run']);
  assert.ok(parsed);
  assert.equal(parsed.dryRun, true);
});

test('parseArgs rejects --setup with --dry-run', () => {
  assert.throws(
    () => parseArgs(['.', '--setup', '--dry-run']),
    /--setup and --dry-run cannot be used together/,
  );
});
