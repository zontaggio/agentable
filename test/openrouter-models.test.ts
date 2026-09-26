const test = require('node:test');
const assert = require('node:assert/strict');

const { toOpenRouterModelId } = require('../dist/collectors/providers/openrouter/models');

test('bare preset names saved by earlier versions get their vendor prefix', () => {
  assert.equal(toOpenRouterModelId('gpt-oss-120b'), 'openai/gpt-oss-120b');
  assert.equal(toOpenRouterModelId('claude-sonnet-4.6'), 'anthropic/claude-sonnet-4.6');
  assert.equal(toOpenRouterModelId(' claude-opus-5.5 '), 'anthropic/claude-opus-5.5');
});

test('full OpenRouter IDs and unknown names pass through', () => {
  assert.equal(toOpenRouterModelId('anthropic/claude-sonnet-5'), 'anthropic/claude-sonnet-5');
  assert.equal(toOpenRouterModelId('qwen/qwen3-coder'), 'qwen/qwen3-coder');
  assert.equal(toOpenRouterModelId('my-custom-model'), 'my-custom-model');
});

export {};
