#!/usr/bin/env node

import { chmod } from 'node:fs/promises';
import path from 'node:path';

const binFile = path.join(process.cwd(), 'dist', 'cli.js');

async function main() {
  await chmod(binFile, 0o755);
}

main().catch((error) => {
  console.error(
    `ensure-bin-permissions failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
