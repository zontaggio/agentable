import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.cache',
  '.idea',
  '.vscode',
]);

function toPosix(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

/**
 * Recursively walk directory tree and return all file paths.
 * Automatically excludes common build/dependency directories.
 * @param root - Root directory to walk
 * @returns Array of relative POSIX-style file paths, sorted alphabetically
 */
export async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];

  async function visit(currentAbs: string): Promise<void> {
    const entries = await fs.readdir(currentAbs, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(currentAbs, entry.name);
      const rel = toPosix(path.relative(root, abs));

      if (entry.isDirectory()) {
        if (DEFAULT_IGNORE_DIRS.has(entry.name)) {
          continue;
        }
        await visit(abs);
        continue;
      }

      if (entry.isFile()) {
        out.push(rel);
      }
    }
  }

  await visit(root);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

export function hasAnyFile(fileSet: Set<string>, candidates: string[]): boolean {
  for (const candidate of candidates) {
    if (fileSet.has(candidate)) {
      return true;
    }
  }
  return false;
}

export function findFilesByRegex(files: string[], regex: RegExp): string[] {
  return files.filter((file) => regex.test(file));
}

export async function safeReadText(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function statMtimeMs(filePath: string): Promise<number | null> {
  try {
    const stat = await fs.stat(filePath);
    return stat.mtimeMs;
  } catch {
    return null;
  }
}
