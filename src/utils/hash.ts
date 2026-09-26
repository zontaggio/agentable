import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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

    // Size and contents come from one open handle, so a file that changes between the
    // two can't slip past the size limit.
    let handle: fs.FileHandle | undefined;
    try {
      handle = await fs.open(abs, 'r');
      const stat = await handle.stat();
      if (stat.size > MAX_HASH_FILE_SIZE) {
        hash.update(`large:${stat.size}:${Math.floor(stat.mtimeMs)}`);
        continue;
      }
      hash.update(await handle.readFile());
    } catch {
      hash.update('missing');
    } finally {
      await handle?.close();
    }
  }

  return hash.digest('hex');
}
