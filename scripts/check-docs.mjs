#!/usr/bin/env node
// Keeps AGENTS.md and README.md honest: every `npm run` command they mention must exist,
// every path must resolve, and "N criteria / N categories" must match the catalog.
// Run after `npm run build` (it reads the compiled catalog).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const scripts = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).scripts ?? {};
const { CRITERIA, CATEGORY_LABELS } = require(path.join(root, 'dist/catalog/v1'));

const facts = {
  criteria: CRITERIA.length,
  categories: Object.keys(CATEGORY_LABELS).length,
};

// Paths that are generated or written by tools, not committed.
const GENERATED = [/^dist\b/, /^scaffolds\//, /^test-dist\b/];
const PATH_ROOTS = /^(src|test|scripts|fixtures|docs|\.github)(\/|$)/;

const problems = [];

function pathExists(relative) {
  if (!relative.includes('*')) return existsSync(path.join(root, relative));
  // Support a wildcard in the last segment, e.g. src/core/evaluate/rules-*.ts
  const dir = path.dirname(relative);
  const pattern = new RegExp(
    `^${path
      .basename(relative)
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')}$`,
  );
  return (
    existsSync(path.join(root, dir)) &&
    readdirSync(path.join(root, dir)).some((name) => pattern.test(name))
  );
}

for (const file of ['AGENTS.md', 'README.md']) {
  const text = readFileSync(path.join(root, file), 'utf8');

  for (const [, name] of text.matchAll(/npm run ([\w:-]+)/g)) {
    if (!scripts[name])
      problems.push(`${file}: \`npm run ${name}\` is not a script in package.json`);
  }

  for (const [, candidate] of text.matchAll(/`([^`\s]+)`/g)) {
    const clean = candidate.replace(/[,.:]$/, '');
    if (!PATH_ROOTS.test(clean) || clean.includes('<') || GENERATED.some((re) => re.test(clean)))
      continue;
    if (!pathExists(clean)) problems.push(`${file}: path \`${clean}\` does not exist`);
  }

  for (const [claim, count, noun] of text.matchAll(/\b(\d+) (criteria|categories)\b/g)) {
    if (Number(count) !== facts[noun]) {
      problems.push(`${file}: says "${claim}" but the catalog has ${facts[noun]} ${noun}`);
    }
  }
}

if (problems.length > 0) {
  console.error(
    `check-docs: ${problems.length} problem(s)\n${problems.map((p) => ` - ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(
  `check-docs: AGENTS.md and README.md match the code (${facts.criteria} criteria, ${facts.categories} categories).`,
);
