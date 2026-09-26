const test = require('node:test');
const assert = require('node:assert/strict');

const { openBrowser } = require('../dist/cli/browser');

test('openBrowser refuses anything that is not an http(s) URL without spawning', async () => {
  for (const url of [
    'file:///etc/passwd',
    'javascript:alert(1)',
    'ftp://example.com',
    'not a url',
  ]) {
    assert.equal(await openBrowser(url), false, url);
  }
});

export {};
