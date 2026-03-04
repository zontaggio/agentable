import { GhData } from '../types';
import { runCommand } from '../utils/command';

function parseJson<T>(input: string): T | null {
  if (!input) {
    return null;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function parseGhHttpStatus(stderr: string): number | undefined {
  const match = stderr.match(/HTTP\s+(\d{3})/i);
  if (!match || !match[1]) {
    return undefined;
  }
  const code = Number.parseInt(match[1], 10);
  return Number.isInteger(code) ? code : undefined;
}

export async function collectGhData(repoPath: string, enabled: boolean): Promise<GhData> {
  if (!enabled) {
    return {
      available: false,
      authenticated: false,
      errors: ['GitHub checks disabled by --no-gh flag.'],
    };
  }

  const ghVersion = await runCommand('gh', ['--version'], repoPath);
  if (!ghVersion.ok) {
    return {
      available: false,
      authenticated: false,
      errors: ['gh CLI not found.'],
    };
  }

  const auth = await runCommand('gh', ['auth', 'status'], repoPath);
  if (!auth.ok) {
    return {
      available: true,
      authenticated: false,
      errors: ['gh is installed but not authenticated.'],
    };
  }

  const repoView = await runCommand(
    'gh',
    ['repo', 'view', '--json', 'nameWithOwner,defaultBranchRef', '--jq', '.'],
    repoPath,
  );

  if (!repoView.ok) {
    return {
      available: true,
      authenticated: true,
      errors: ['Unable to resolve repository metadata from gh.'],
    };
  }

  const repoJson = parseJson<{
    nameWithOwner?: string;
    defaultBranchRef?: { name?: string };
  }>(repoView.stdout);

  if (!repoJson?.nameWithOwner) {
    return {
      available: true,
      authenticated: true,
      errors: ['Repository is not linked to GitHub remote in current context.'],
    };
  }

  const repo = repoJson.nameWithOwner;
  const defaultBranch = repoJson.defaultBranchRef?.name ?? 'main';
  const encodedDefaultBranch = encodeURIComponent(defaultBranch);

  const [protectionRes, securityRes, labelsRes, issuesRes] = await Promise.all([
    runCommand('gh', ['api', `repos/${repo}/branches/${encodedDefaultBranch}/protection`], repoPath),
    runCommand('gh', ['api', `repos/${repo}`], repoPath),
    runCommand('gh', ['api', `repos/${repo}/labels?per_page=100`], repoPath),
    runCommand(
      'gh',
      [
        'issue',
        'list',
        '--repo',
        repo,
        '--limit',
        '100',
        '--state',
        'all',
        '--json',
        'title,labels,createdAt,state',
      ],
      repoPath,
    ),
  ]);

  const errors: string[] = [];

  let branchProtectionEnabled: boolean | undefined;
  if (protectionRes.ok) {
    branchProtectionEnabled = true;
  } else {
    const httpStatus = parseGhHttpStatus(protectionRes.stderr);
    const notProtected = /branch not protected/i.test(protectionRes.stderr) || /not protected/i.test(protectionRes.stdout);
    if (httpStatus === 404 && notProtected) {
      branchProtectionEnabled = false;
    } else {
      branchProtectionEnabled = undefined;
      errors.push('Branch protection API unavailable or permission-limited.');
    }
  }

  let secretScanningEnabled: boolean | undefined;
  if (securityRes.ok) {
    const parsed = parseJson<{
      security_and_analysis?: { secret_scanning?: { status?: string } };
    }>(securityRes.stdout);

    const status = parsed?.security_and_analysis?.secret_scanning?.status;
    secretScanningEnabled = status === 'enabled';
    if (status === undefined) {
      errors.push('Secret scanning status unavailable (likely permission-limited).');
    }
  } else {
    const httpStatus = parseGhHttpStatus(securityRes.stderr);
    if (httpStatus === 401 || httpStatus === 403) {
      errors.push('Repository security metadata unavailable due to insufficient permissions.');
    } else {
      errors.push('Repository security metadata unavailable.');
    }
  }

  let labelsCount: number | undefined;
  if (labelsRes.ok) {
    const labels = parseJson<Array<{ name?: string }>>(labelsRes.stdout) ?? [];
    labelsCount = labels.length;
  } else {
    errors.push('Issue labels metadata unavailable (likely permission-limited).');
  }

  let issueStats:
    | {
        total: number;
        labeled: number;
        oldOpenOver365Days: number;
        goodTitleAndLabels: number;
      }
    | undefined;

  if (issuesRes.ok) {
    const issues =
      parseJson<Array<{ title?: string; labels?: Array<{ name?: string }>; createdAt?: string; state?: string }>>(
        issuesRes.stdout,
      ) ?? [];

    const now = Date.now();
    let labeled = 0;
    let oldOpenOver365Days = 0;
    let goodTitleAndLabels = 0;

    for (const issue of issues) {
      const title = issue.title ?? '';
      const labels = issue.labels ?? [];
      const createdAt = issue.createdAt ? Date.parse(issue.createdAt) : null;

      if (labels.length > 0) {
        labeled += 1;
      }

      if (labels.length > 0 && title.trim().length >= 12) {
        goodTitleAndLabels += 1;
      }

      if (issue.state === 'OPEN' && createdAt) {
        const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
        if (ageDays > 365) {
          oldOpenOver365Days += 1;
        }
      }
    }

    issueStats = {
      total: issues.length,
      labeled,
      oldOpenOver365Days,
      goodTitleAndLabels,
    };
  } else {
    errors.push('Issue metrics unavailable from gh issue list (possibly permission-limited).');
  }

  return {
    available: true,
    authenticated: true,
    repo,
    defaultBranch,
    branchProtectionEnabled,
    secretScanningEnabled,
    labelsCount,
    issueStats,
    errors,
  };
}
