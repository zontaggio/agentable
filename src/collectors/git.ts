import path from 'node:path';
import { runCommand } from '../utils/command';

export interface GitData {
  isGitRepo: boolean;
  repoIdentifier: string;
  releaseTagsInLast90Days: number;
  commitCountLast30Days: number;
}

function normalizeRemoteUrl(remote: string): string {
  return remote.trim().replace(/\.git$/, '');
}

export async function collectGitData(repoPath: string): Promise<GitData> {
  const gitRoot = await runCommand('git', ['rev-parse', '--show-toplevel'], repoPath);
  if (!gitRoot.ok || !gitRoot.stdout) {
    return {
      isGitRepo: false,
      repoIdentifier: path.resolve(repoPath),
      releaseTagsInLast90Days: 0,
      commitCountLast30Days: 0,
    };
  }

  const root = gitRoot.stdout;

  const remoteRes = await runCommand('git', ['remote', 'get-url', 'origin'], root);
  const repoIdentifier =
    remoteRes.ok && remoteRes.stdout ? normalizeRemoteUrl(remoteRes.stdout) : root;

  const tagsRes = await runCommand(
    'git',
    ['tag', '--list', '--sort=-creatordate', '--format=%(creatordate:iso8601) %(refname:short)'],
    root,
  );

  let releaseTagsInLast90Days = 0;
  if (tagsRes.ok) {
    const now = Date.now();
    for (const line of tagsRes.stdout.split('\n')) {
      const firstSpace = line.indexOf(' ');
      if (firstSpace <= 0) {
        continue;
      }
      const dateText = line.slice(0, firstSpace).trim();
      const parsed = Date.parse(dateText);
      if (Number.isNaN(parsed)) {
        continue;
      }
      const ageDays = (now - parsed) / (1000 * 60 * 60 * 24);
      if (ageDays <= 90) {
        releaseTagsInLast90Days += 1;
      }
    }
  }

  const commitsRes = await runCommand(
    'git',
    ['rev-list', '--count', '--since=30.days', 'HEAD'],
    root,
  );
  const commitCountLast30Days = commitsRes.ok
    ? Number.parseInt(commitsRes.stdout || '0', 10) || 0
    : 0;

  return {
    isGitRepo: true,
    repoIdentifier,
    releaseTagsInLast90Days,
    commitCountLast30Days,
  };
}
