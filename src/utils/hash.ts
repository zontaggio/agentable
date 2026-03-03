import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Compute SHA-256 hash of the given input
 * @param input - String or Buffer to hash
 * @returns Hexadecimal hash string
 */
export async function sha256(input: string | Buffer): Promise<string> {
  return createHash('sha256').update(input).digest('hex');
}

const MAX_HASH_FILE_SIZE = 2 * 1024 * 1024;

/**
 * Compute a deterministic fingerprint for a repository based on file contents.
 * Large files are hashed by metadata only to avoid performance issues.
 * @param root - Repository root path
 * @param files - List of relative file paths to include
 * @returns Hexadecimal fingerprint string
 */
export async function computeRepoFingerprint(root: string, files: string[]): Promise<string> {
  const hash = createHash('sha256');

  for (const rel of files) {
    const abs = path.join(root, rel);
    hash.update(rel);

    try {
      const stat = await fs.stat(abs);
      if (stat.size > MAX_HASH_FILE_SIZE) {
        hash.update(`large:${stat.size}:${Math.floor(stat.mtimeMs)}`);
        continue;
      }

      const content = await fs.readFile(abs);
      hash.update(content);
    } catch {
      hash.update('missing');
    }
  }

  return hash.digest('hex');
}
