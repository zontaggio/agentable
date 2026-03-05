import { promises as fs } from 'node:fs';
import path from 'node:path';
import { LocalProjectContext } from '../types';
import { safeReadText, statMtimeMs, walkFiles } from '../utils/files';

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = String(val);
  }
  return out;
}

async function readPackageJson(rootPath: string): Promise<Record<string, unknown> | null> {
  const pkgPath = path.join(rootPath, 'package.json');
  try {
    const content = await fs.readFile(pkgPath, 'utf8');
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function estimateLoc(rootPath: string, files: string[]): Promise<number> {
  const codeFiles = files.filter((f) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|java|kt|rs|php|cs|scala|swift|md)$/i.test(f),
  );

  let loc = 0;
  for (const rel of codeFiles.slice(0, 1200)) {
    const abs = path.join(rootPath, rel);
    try {
      const content = await fs.readFile(abs, 'utf8');
      loc += content.split('\n').length;
    } catch {
      // ignore unreadable files
    }
  }

  return loc;
}

export async function collectLocalProjectContext(rootPath: string): Promise<LocalProjectContext> {
  const files = await walkFiles(rootPath);
  const fileSet = new Set(files);
  const packageJson = await readPackageJson(rootPath);

  const dependencies = asRecord(packageJson?.dependencies);
  const devDependencies = asRecord(packageJson?.devDependencies);
  const scripts = asRecord(packageJson?.scripts);

  const readmeCandidates = files.filter((f) => /^readme(\.|$)/i.test(path.basename(f)));
  const readmePath = readmeCandidates.at(0) ?? null;

  const gitignoreContent = await safeReadText(path.join(rootPath, '.gitignore'));

  const workflowFiles = files.filter(
    (f) => f.startsWith('.github/workflows/') && /\.ya?ml$/i.test(f),
  );

  const locEstimate = await estimateLoc(rootPath, files);

  return {
    rootPath,
    files,
    fileSet,
    packageJson,
    dependencies,
    devDependencies,
    scripts,
    readmePath,
    gitignoreContent,
    workflowFiles,
    locEstimate,
    now: new Date(),
  };
}

export async function readReadmeMtimeMs(local: LocalProjectContext): Promise<number | null> {
  if (!local.readmePath) {
    return null;
  }
  return statMtimeMs(path.join(local.rootPath, local.readmePath));
}
