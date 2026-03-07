import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAccessibleUrl } from '../dist/web/url';

test('buildAccessibleUrl maps wildcard hosts to localhost', () => {
  assert.equal(buildAccessibleUrl('0.0.0.0', 4173), 'http://localhost:4173');
  assert.equal(buildAccessibleUrl('::', 4173), 'http://localhost:4173');
});

test('buildAccessibleUrl preserves explicit hosts', () => {
  assert.equal(buildAccessibleUrl('127.0.0.1', 4173), 'http://127.0.0.1:4173');
  assert.equal(buildAccessibleUrl('::1', 4173), 'http://[::1]:4173');
});
