#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const VALID_CATEGORIES = new Set([
  'style_validation',
  'build_system',
  'testing',
  'documentation',
  'dev_environment',
  'debugging_observability',
  'security',
  'task_discovery',
  'product_analytics',
]);

const VALID_SOURCES = new Set(['local', 'gh', 'ai', 'hybrid']);

function usage() {
  console.log('Usage: npm run new:criterion -- <criterion_id> <category> [source] [--ai-assisted]');
  console.log('Example: npm run new:criterion -- api_rate_limit security local');
}

function normalizeBooleanFlag(args, flagName) {
  return args.includes(flagName);
}

async function writeFile(absPath, content) {
  await fs.writeFile(absPath, `${content.trim()}\n`, 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    usage();
    process.exit(0);
  }

  if (args.length < 2) {
    usage();
    process.exit(1);
  }

  const criterionId = (args[0] || '').trim();
  const category = (args[1] || '').trim();
  const sourceArg = args[2] && !args[2].startsWith('--') ? args[2].trim() : 'local';
  const aiAssisted = normalizeBooleanFlag(args, '--ai-assisted');

  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(criterionId)) {
    throw new Error('criterion_id must be snake_case (lowercase letters, numbers, underscores).');
  }

  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid category: ${category}`);
  }

  if (!VALID_SOURCES.has(sourceArg)) {
    throw new Error(`Invalid source: ${sourceArg}`);
  }

  const scaffoldDir = path.join(process.cwd(), 'scaffolds', 'criteria', criterionId);
  await fs.mkdir(scaffoldDir, { recursive: true });

  await writeFile(
    path.join(scaffoldDir, 'catalog-entry.ts'),
    `{
  id: '${criterionId}',
  category: '${category}',
  source: '${sourceArg}',
  description: 'TODO: describe the criterion intent and expected signal.',
  aiAssisted: ${aiAssisted},
}`,
  );

  await writeFile(
    path.join(scaffoldDir, 'evaluator-case.ts'),
    `case '${criterionId}':
  return makeResult(
    criterion,
    'fail',
    'TODO: implement deterministic evaluation logic.',
    [],
    [evidenceDetail('text', 'weak', 'TODO: replace with machine-verifiable evidence.')],
  );`,
  );

  await writeFile(
    path.join(scaffoldDir, 'card-meta.ts'),
    `// Optional: add display overrides in src/web/card-meta.ts
// OVERRIDE_NAMES['${criterionId}'] = 'Human Friendly Name';
// BASIC_IDS.add('${criterionId}') or ADVANCED_IDS.add('${criterionId}');`,
  );

  await writeFile(
    path.join(scaffoldDir, 'applicability.ts'),
    `// Optional: add skip logic in src/core/evaluate/applicability.ts
// case '${criterionId}':
//   return { skip: false };`,
  );

  await writeFile(
    path.join(scaffoldDir, 'test.todo.md'),
    `# ${criterionId} test checklist

- Add PASS test in test/*.test.js
- Add FAIL test in test/*.test.js
- Add UNVERIFIED/SKIP tests when relevant
- Run: npm run build && npm test && npm run check:max-lines`,
  );

  console.log(`Created criterion scaffold at ${path.relative(process.cwd(), scaffoldDir)}`);
}

main().catch((error) => {
  console.error(`new-criterion failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
