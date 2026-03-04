import { LocalProjectContext } from '../../types';

export function hasAnyDependency(local: LocalProjectContext, keywords: string[]): boolean {
  const deps = {
    ...local.dependencies,
    ...local.devDependencies,
  };

  const keys = Object.keys(deps).map((k) => k.toLowerCase());
  return keywords.some((keyword) =>
    keys.some((dep) => dep.includes(keyword.toLowerCase())),
  );
}

export function hasAnyFilePattern(
  local: LocalProjectContext,
  patterns: RegExp[],
): boolean {
  return local.files.some((file) =>
    patterns.some((pattern) => pattern.test(file)),
  );
}

export function hasAnyScript(local: LocalProjectContext, patterns: RegExp[]): boolean {
  const values = Object.values(local.scripts).map((v) => v.toLowerCase());
  return values.some((value) => patterns.some((pattern) => pattern.test(value)));
}

export function inferTopLevelSourceFolders(local: LocalProjectContext): number {
  const top = new Set<string>();
  for (const file of local.files) {
    if (!file.startsWith('src/')) {
      continue;
    }

    const parts = file.split('/');
    if (parts.length >= 2 && parts[1]) {
      top.add(parts[1]);
    }
  }
  return top.size;
}

export function includesAny(text: string, keywords: string[]): boolean {
  const low = text.toLowerCase();
  return keywords.some((keyword) => low.includes(keyword.toLowerCase()));
}

export function countKeywordMatches(text: string, keywords: string[]): number {
  const low = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (low.includes(keyword.toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

export function parseGitignoreEntries(content: string): Set<string> {
  const entries = new Set<string>();
  for (const raw of content.split('\n')) {
    const line = raw.trim().toLowerCase();
    if (!line || line.startsWith('#') || line.startsWith('!')) {
      continue;
    }

    const normalized = line.startsWith('/') ? line.slice(1) : line;
    entries.add(normalized);
  }
  return entries;
}

export function gitignoreEntryMatches(entries: Set<string>, candidate: string): boolean {
  const normalizedCandidate = candidate.toLowerCase().replace(/^\//, '');
  if (entries.has(normalizedCandidate)) {
    return true;
  }

  for (const entry of entries) {
    if (entry === `${normalizedCandidate}/**` || entry === `**/${normalizedCandidate}`) {
      return true;
    }
    if (entry.endsWith('/') && entry.slice(0, -1) === normalizedCandidate) {
      return true;
    }
    if (
      normalizedCandidate.startsWith('.env') &&
      (entry === '.env*' || entry === '.env.*' || entry === '**/.env*' || entry === '**/.env.*')
    ) {
      return true;
    }
  }

  return false;
}
