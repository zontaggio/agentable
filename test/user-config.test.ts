const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

function loadUserConfigModule(homeDir) {
  process.env.HOME = homeDir;
  const modulePath = require.resolve('../dist/core/user-config');
  delete require.cache[modulePath];
  return require('../dist/core/user-config');
}

test('openrouter config loads as current format', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-user-config-openrouter-v2-'));
  const configDir = path.join(home, '.agentable');
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(
    path.join(configDir, 'config.json'),
    JSON.stringify(
      {
        provider: 'openrouter',
        apiKey: 'legacy-key',
        model: 'gpt-oss-120b',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      null,
      2,
    ),
    'utf8',
  );

  const mod = loadUserConfigModule(home);
  const result = await mod.loadUserConfig();

  assert.ok(result.config);
  assert.equal(result.needsSetup, false);
  assert.equal(result.config.provider, 'openrouter');
  assert.equal(result.config.apiKey, 'legacy-key');
  assert.equal(result.config.model, 'gpt-oss-120b');
  assert.equal(result.warnings.length, 0);
});

test('previous config auto-migrates to openrouter format', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'agentable-user-config-legacy-'));
  const configDir = path.join(home, '.agentable');
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(
    path.join(configDir, 'config.json'),
    JSON.stringify(
      {
        schemaVersion: 'v2',
        provider: 'openai_compatible',
        apiKey: 'legacy-key',
        model: 'gpt-oss-120b',
        baseUrl: 'http://127.0.0.1:4000/v1',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
      null,
      2,
    ),
    'utf8',
  );

  const mod = loadUserConfigModule(home);
  const result = await mod.loadUserConfig();

  assert.ok(result.config);
  assert.equal(result.needsSetup, false);
  assert.equal(result.config.provider, 'openrouter');
  assert.equal(result.config.apiKey, 'legacy-key');
  assert.equal(result.config.model, 'gpt-oss-120b');
  assert.ok(result.warnings.some((item) => item.includes('Migrated previous AI config')));

  const persistedRaw = await fs.readFile(mod.getUserConfigPath(), 'utf8');
  const persisted = JSON.parse(persistedRaw);
  assert.equal(persisted.provider, 'openrouter');
  assert.equal(persisted.model, 'gpt-oss-120b');
});

export {};
