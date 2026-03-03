const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { appendHistory, computeRepoKey, loadHistory, MAX_HISTORY_SNAPSHOTS } = require('../dist/web/history');

async function makeDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'agentable-history-'));
}

test('appendHistory stores snapshots and deduplicates same consecutive fingerprint', async () => {
  const dir = await makeDir();
  const repoKey = computeRepoKey('owner/repo');

  await appendHistory(
    repoKey,
    {
      timestamp: '2026-03-01T00:00:00.000Z',
      score: 50,
      coverage: 60,
      level: 3,
      fingerprint: 'fp-1',
    },
    dir,
  );

  await appendHistory(
    repoKey,
    {
      timestamp: '2026-03-01T00:10:00.000Z',
      score: 50,
      coverage: 60,
      level: 3,
      fingerprint: 'fp-1',
    },
    dir,
  );

  await appendHistory(
    repoKey,
    {
      timestamp: '2026-03-01T00:20:00.000Z',
      score: 70,
      coverage: 70,
      level: 4,
      fingerprint: 'fp-2',
    },
    dir,
  );

  const points = await loadHistory(repoKey, dir);
  assert.equal(points.length, 2);
  assert.equal(points[0].fingerprint, 'fp-1');
  assert.equal(points[1].fingerprint, 'fp-2');
});

test('appendHistory keeps only max snapshots', async () => {
  const dir = await makeDir();
  const repoKey = computeRepoKey('owner/repo-max');

  for (let i = 0; i < MAX_HISTORY_SNAPSHOTS + 5; i += 1) {
    await appendHistory(
      repoKey,
      {
        timestamp: new Date(Date.UTC(2026, 0, 1, 0, i, 0)).toISOString(),
        score: i % 100,
        coverage: 75,
        level: 3,
        fingerprint: `fp-${i}`,
      },
      dir,
    );
  }

  const points = await loadHistory(repoKey, dir);
  assert.equal(points.length, MAX_HISTORY_SNAPSHOTS);
  assert.equal(points[0].fingerprint, 'fp-5');
});
