const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRemediationPrompt } = require('../dist/web/remediation-template');

test('buildRemediationPrompt renders required sections with dynamic content', () => {
  const prompt = buildRemediationPrompt({
    repoName: 'importinghub',
    signalName: 'N+1 Query Detection',
    scoreLabel: '1/2',
    description: 'N+1 query detection tooling configured',
    reason: 'API has custom N+1 detection (queryTracker module). Web is frontend-only without ORM',
    evidence: ['Found queryTracker references in src/api/queryTracker.ts'],
    evidenceDetails: [
      {
        kind: 'file',
        strength: 'medium',
        detail: 'src/api/queryTracker.ts contains query batch instrumentation.',
      },
    ],
  });

  assert.match(prompt, /\[Readiness Fix\] importinghub N\+1 Query Detection/);
  assert.match(prompt, /Fix the failing signal: N\+1 Query Detection \(\[1\/2\]\)/);
  assert.match(prompt, /\*\*Description\*\*: N\+1 query detection tooling configured/);
  assert.match(prompt, /\*\*Why it failed\*\*: API has custom N\+1 detection/);
  assert.match(prompt, /## Original Signal Evaluation Criteria/);
  assert.match(prompt, /PASS when explicit, strong evidence is present/);
  assert.match(
    prompt,
    /- file \(medium\): src\/api\/queryTracker\.ts contains query batch instrumentation\./,
  );
  assert.match(prompt, /- text note: Found queryTracker references in src\/api\/queryTracker\.ts/);
  assert.match(prompt, /## CRITICAL: Quality Standards/);
  assert.match(prompt, /## Completion/);
  assert.equal(prompt.includes('<Signal Name>'), false);
});

test('buildRemediationPrompt includes fallback evidence line when none exist', () => {
  const prompt = buildRemediationPrompt({
    repoName: 'repo',
    signalName: 'Lint Config',
    scoreLabel: '0/1',
    description: 'Linting configured for code quality',
    reason: 'No lint configuration found.',
    evidence: [],
    evidenceDetails: [],
  });

  assert.match(
    prompt,
    /No explicit evidence lines were captured in this run; inspect repository dependencies, configuration files, and CI workflows directly\./,
  );
});

export {};
