#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve('src');
const MAX_LINES = 300;

async function walkTsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkTsFiles(abs)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
      continue;
    }

    files.push(abs);
  }

  return files;
}

function countLines(text) {
  if (text.length === 0) {
    return 0;
  }
  return text.split(/\r?\n/).length;
}

async function main() {
  const files = await walkTsFiles(ROOT_DIR);
  const violations = [];

  for (const absPath of files) {
    const content = await fs.readFile(absPath, 'utf8');
    const lines = countLines(content);
    if (lines > MAX_LINES) {
      violations.push({
        file: path.relative(process.cwd(), absPath),
        lines,
      });
    }
  }

  if (violations.length === 0) {
    console.log(`check-max-lines: OK (${files.length} files scanned, max ${MAX_LINES} lines).`);
    return;
  }

  console.error(`check-max-lines: found ${violations.length} file(s) over ${MAX_LINES} lines.`);
  for (const violation of violations.sort((a, b) => b.lines - a.lines)) {
    console.error(` - ${violation.file}: ${violation.lines} lines`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(
    `check-max-lines failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
