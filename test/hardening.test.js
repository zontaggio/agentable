const test = require('node:test');
const assert = require('node:assert/strict');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');

const testHome = fsSync.mkdtempSync(path.join(os.tmpdir(), 'agentable-hardening-home-'));
process.env.HOME = testHome;

const { runAgentReadiness } = require('../dist/core/engine');
const { collectGhData } = require('../dist/collectors/gh');

async function createBaseRepoFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-hardening-repo-'));
  await fs.writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: 'hardening-fixture',
        version: '1.0.0',
        scripts: {
          test: 'node --test',
        },
      },
      null,
      2,
    ),
    'utf8',
  );
  await fs.writeFile(path.join(root, 'README.md'), '# Fixture\n\nProject docs.', 'utf8');
  await fs.writeFile(path.join(root, '.gitignore'), 'node_modules\n.env\n', 'utf8');
  return root;
}

function initGitRepo(root) {
  execSync('git init', { cwd: root, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: root });
  execSync('git config user.name "Test User"', { cwd: root });
}

function commitAll(root, message) {
  execSync('git add .', { cwd: root });
  execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: root, stdio: 'ignore' });
}

test('agentic_development does not pass on generic "maintain" commit text', async () => {
  const root = await createBaseRepoFixture();
  initGitRepo(root);
  commitAll(root, 'maintain docs and cleanup');

  const result = await runAgentReadiness({
    repoPath: root,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });

  const criterion = result.results.find((item) => item.id === 'agentic_development');
  assert.ok(criterion);
  assert.equal(criterion.status, 'fail');
});

test('agentic_development passes on explicit agent signal in commit text', async () => {
  const root = await createBaseRepoFixture();
  initGitRepo(root);
  commitAll(root, 'copilot assisted refactor for lint rules');

  const result = await runAgentReadiness({
    repoPath: root,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });

  const criterion = result.results.find((item) => item.id === 'agentic_development');
  assert.ok(criterion);
  assert.equal(criterion.status, 'pass');
});

test('devcontainer_runnable fails when build is null', async () => {
  const root = await createBaseRepoFixture();
  await fs.mkdir(path.join(root, '.devcontainer'), { recursive: true });
  await fs.writeFile(
    path.join(root, '.devcontainer/devcontainer.json'),
    JSON.stringify({ build: null }, null, 2),
    'utf8',
  );

  const result = await runAgentReadiness({
    repoPath: root,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });

  const criterion = result.results.find((item) => item.id === 'devcontainer_runnable');
  assert.ok(criterion);
  assert.equal(criterion.status, 'fail');
});

test('devcontainer_runnable passes with image and with valid build object', async () => {
  const imageRoot = await createBaseRepoFixture();
  await fs.mkdir(path.join(imageRoot, '.devcontainer'), { recursive: true });
  await fs.writeFile(
    path.join(imageRoot, '.devcontainer/devcontainer.json'),
    JSON.stringify({ image: 'mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm' }, null, 2),
    'utf8',
  );

  const imageResult = await runAgentReadiness({
    repoPath: imageRoot,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });
  const imageCriterion = imageResult.results.find((item) => item.id === 'devcontainer_runnable');
  assert.ok(imageCriterion);
  assert.equal(imageCriterion.status, 'pass');

  const buildRoot = await createBaseRepoFixture();
  await fs.mkdir(path.join(buildRoot, '.devcontainer'), { recursive: true });
  await fs.writeFile(
    path.join(buildRoot, '.devcontainer/devcontainer.json'),
    JSON.stringify({ build: { context: '.', dockerfile: 'Dockerfile' } }, null, 2),
    'utf8',
  );

  const buildResult = await runAgentReadiness({
    repoPath: buildRoot,
    verbose: false,
    noGh: true,
    aiFailureMode: 'fallback',
  });
  const buildCriterion = buildResult.results.find((item) => item.id === 'devcontainer_runnable');
  assert.ok(buildCriterion);
  assert.equal(buildCriterion.status, 'pass');
});

test('collectGhData encodes default branch when checking protection endpoint', async () => {
  const repoPath = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-gh-repo-'));
  const binDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-gh-bin-'));
  const ghPath = path.join(binDir, 'gh');
  const fakeGhScript = `#!/usr/bin/env node
const args = process.argv.slice(2);

if (args[0] === '--version') {
  console.log('gh version 2.59.0');
  process.exit(0);
}

if (args[0] === 'auth' && args[1] === 'status') {
  console.log('Logged in to github.com');
  process.exit(0);
}

if (args[0] === 'repo' && args[1] === 'view') {
  console.log(JSON.stringify({ nameWithOwner: 'owner/repo', defaultBranchRef: { name: 'release/main' } }));
  process.exit(0);
}

if (args[0] === 'api') {
  const endpoint = args[1] || '';
  if (endpoint === 'repos/owner/repo/branches/release%2Fmain/protection') {
    console.log(JSON.stringify({ required_status_checks: { strict: true } }));
    process.exit(0);
  }
  if (endpoint === 'repos/owner/repo/branches/release/main/protection') {
    console.error('HTTP 404 Not Found');
    process.exit(1);
  }
  if (endpoint === 'repos/owner/repo') {
    console.log(JSON.stringify({ security_and_analysis: { secret_scanning: { status: 'enabled' } } }));
    process.exit(0);
  }
  if (endpoint.startsWith('repos/owner/repo/labels')) {
    console.log(JSON.stringify([{ name: 'bug' }, { name: 'enhancement' }]));
    process.exit(0);
  }
}

if (args[0] === 'issue' && args[1] === 'list') {
  console.log('[]');
  process.exit(0);
}

console.error('Unexpected gh args:', args.join(' '));
process.exit(1);
`;

  await fs.writeFile(ghPath, fakeGhScript, { encoding: 'utf8', mode: 0o755 });

  const originalPath = process.env.PATH || '';
  process.env.PATH = `${binDir}${path.delimiter}${originalPath}`;
  try {
    const data = await collectGhData(repoPath, true);
    assert.equal(data.available, true);
    assert.equal(data.authenticated, true);
    assert.equal(data.defaultBranch, 'release/main');
    assert.equal(data.branchProtectionEnabled, true);
    assert.ok(!data.errors.some((entry) => entry.includes('Branch protection API unavailable')));
  } finally {
    process.env.PATH = originalPath;
  }
});
