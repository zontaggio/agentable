import { runCommand } from '../../utils/command';
import { hasAnyDependency, hasAnyFilePattern, hasAnyScript, includesAny } from './helpers';
import { makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateBuildSystem(
  input: CriterionEvaluatorInput,
) {
  const { criterion, ctx, gitData, signals } = input;
  const { local, ghData } = ctx;

  switch (criterion.id) {
    case 'agentic_development': {
      const agentsSignals =
        local.fileSet.has('AGENTS.md') ||
        hasAnyFilePattern(local, [/\.claude\/skills\//, /\.skills\//, /\.factory\//]);

      if (agentsSignals) {
        return makeResult(criterion, 'pass', 'Repository contains agent-development artifacts.');
      }

      if (gitData.isGitRepo) {
        const logCheck = await runCommand('git', ['log', '--format=%B', '-n', '25'], local.rootPath);
        if (
          logCheck.ok &&
          includesAny(logCheck.stdout, ['co-authored-by', 'copilot', 'claude', 'chatgpt', 'ai'])
        ) {
          return makeResult(criterion, 'pass', 'Recent git history indicates agent-assisted contributions.');
        }
      }

      return makeResult(criterion, 'fail', 'No strong evidence of agentic development workflow.');
    }

    case 'automated_pr_review':
      if (
        includesAny(signals.workflowText, [
          'reviewdog',
          'danger',
          'coderabbit',
          'pull_request_review',
        ])
      ) {
        return makeResult(criterion, 'pass', 'Automated PR review tooling found in workflows.');
      }
      return ghData.available && ghData.authenticated
        ? makeResult(criterion, 'fail', 'No automated PR review tooling detected.')
        : makeResult(
            criterion,
            'unverified',
            'Unable to verify automated PR review without authenticated gh CLI.',
          );

    case 'build_cmd_doc':
      return includesAny(signals.readmeText, [
        'npm run build',
        'pnpm build',
        'yarn build',
        'make build',
      ])
        ? makeResult(criterion, 'pass', 'Build command documented in README.')
        : makeResult(criterion, 'fail', 'README does not document a build command.');

    case 'build_performance_tracking':
      return includesAny(signals.workflowText, ['turbo', 'cache', 'build time', 'timing']) ||
        includesAny(signals.allTextIndex, ['size-limit', 'bundle-analyzer', 'speed measure'])
        ? makeResult(criterion, 'pass', 'Build performance monitoring/caching signals detected.')
        : makeResult(criterion, 'fail', 'No build performance tracking found.');

    case 'dead_feature_flag_detection':
      return hasAnyScript(local, [/stale.*flag|dead.*flag|cleanup.*flag/i])
        ? makeResult(criterion, 'pass', 'Dead flag detection/cleanup script detected.')
        : makeResult(criterion, 'fail', 'No dead feature flag detection configured.');

    case 'deployment_frequency':
      if (!gitData.isGitRepo) {
        return makeResult(
          criterion,
          'unverified',
          'Cannot infer deployment frequency outside a git repository.',
        );
      }
      return gitData.releaseTagsInLast90Days >= 2 || gitData.commitCountLast30Days >= 20
        ? makeResult(
            criterion,
            'pass',
            `Recent activity detected (${gitData.releaseTagsInLast90Days} tags in 90d, ${gitData.commitCountLast30Days} commits in 30d).`,
          )
        : makeResult(
            criterion,
            'fail',
            `Low recent release activity (${gitData.releaseTagsInLast90Days} tags in 90d, ${gitData.commitCountLast30Days} commits in 30d).`,
          );

    case 'deps_pinned':
      return hasAnyFilePattern(local, [
        /package-lock\.json$/,
        /yarn\.lock$/,
        /pnpm-lock\.yaml$/,
        /poetry\.lock$/,
      ])
        ? makeResult(criterion, 'pass', 'Lockfile detected for pinned dependencies.')
        : makeResult(criterion, 'fail', 'No dependency lockfile found.');

    case 'fast_ci_feedback': {
      if (local.workflowFiles.length === 0) {
        return makeResult(criterion, 'fail', 'No CI workflow detected.');
      }
      const hasTimeoutSignal = includesAny(signals.workflowText, [
        'timeout-minutes: 10',
        'timeout-minutes: 5',
      ]);
      const hasFastSignal = includesAny(signals.workflowText, [
        'actions/cache',
        'pnpm/action-setup',
        'turbo',
      ]);
      return hasTimeoutSignal || hasFastSignal
        ? makeResult(criterion, 'pass', 'CI appears optimized for quick feedback.')
        : makeResult(criterion, 'fail', 'No clear fast-feedback CI optimization detected.');
    }

    case 'feature_flag_infrastructure':
      return hasAnyDependency(local, ['launchdarkly', 'statsig', 'unleash', 'flagsmith'])
        ? makeResult(criterion, 'pass', 'Feature flag infrastructure dependency detected.')
        : makeResult(criterion, 'fail', 'No feature flag infrastructure detected.');

    case 'heavy_dependency_detection':
      return hasAnyDependency(local, ['size-limit', 'bundlesize', 'webpack-bundle-analyzer']) ||
        includesAny(signals.allTextIndex, ['bundlesize', 'size-limit'])
        ? makeResult(criterion, 'pass', 'Heavy dependency detection configured.')
        : makeResult(criterion, 'fail', 'No heavy dependency detection tooling found.');

    case 'monorepo_tooling':
      return hasAnyDependency(local, ['turbo', 'nx', 'lerna', 'lage']) ||
        hasAnyFilePattern(local, [/^turbo\.json$/, /^nx\.json$/, /^lerna\.json$/])
        ? makeResult(criterion, 'pass', 'Monorepo tooling detected.')
        : makeResult(criterion, 'fail', 'Monorepo detected but tooling not found.');

    case 'progressive_rollout':
      return includesAny(signals.allTextIndex, [
        'canary',
        'progressive rollout',
        'blue-green',
        'feature flag rollout',
      ])
        ? makeResult(
            criterion,
            'unverified',
            'Text-only rollout references were found; explicit rollout automation evidence is missing.',
            [],
            [
              {
                kind: 'text',
                strength: 'weak',
                detail:
                  'Canary/progressive rollout keywords found in repository text index.',
              },
            ],
          )
        : makeResult(criterion, 'fail', 'No progressive rollout strategy detected.');

    case 'release_automation':
      return includesAny(signals.workflowText, [
        'semantic-release',
        'changesets',
        'release please',
        'npm publish',
      ])
        ? makeResult(criterion, 'pass', 'Release automation signals found in CI workflows.')
        : makeResult(criterion, 'fail', 'No release automation workflow detected.');

    case 'release_notes_automation':
      return hasAnyDependency(local, ['changesets', 'semantic-release', 'standard-version']) ||
        includesAny(signals.workflowText, ['changelog', 'release notes', 'release-please'])
        ? makeResult(criterion, 'pass', 'Release notes automation detected.')
        : makeResult(criterion, 'fail', 'No release notes automation detected.');

    case 'rollback_automation':
      return includesAny(signals.allTextIndex, ['rollback', 'helm rollback', 'revert deployment'])
        ? makeResult(
            criterion,
            'unverified',
            'Text-only rollback references were found; explicit rollback automation evidence is missing.',
            [],
            [
              {
                kind: 'text',
                strength: 'weak',
                detail: 'Rollback keywords found in repository text index.',
              },
            ],
          )
        : makeResult(criterion, 'fail', 'No rollback automation detected.');

    case 'single_command_setup':
      return includesAny(signals.readmeText, [
        'npm install',
        'pnpm install',
        'yarn install',
        'make setup',
      ])
        ? makeResult(criterion, 'pass', 'Single-command setup instructions found.')
        : makeResult(criterion, 'fail', 'No single-command setup documentation found.');

    case 'unused_dependencies_detection':
      return hasAnyDependency(local, ['depcheck', 'knip', 'npm-check']) ||
        hasAnyScript(local, [/depcheck|knip|npm-check/i])
        ? makeResult(criterion, 'pass', 'Unused dependency detection tooling found.')
        : makeResult(criterion, 'fail', 'No unused dependency detection tooling found.');

    case 'vcs_cli_tools': {
      const ghVersion = await runCommand('gh', ['--version'], local.rootPath);
      return ghVersion.ok
        ? makeResult(criterion, 'pass', 'gh CLI available in execution environment.')
        : makeResult(criterion, 'fail', 'gh CLI not available in environment.');
    }

    case 'version_drift_detection':
      return includesAny(signals.allTextIndex, ['syncpack', 'version drift', 'manypkg']) ||
        hasAnyDependency(local, ['syncpack', '@manypkg'])
        ? makeResult(criterion, 'pass', 'Version drift detection tooling found.')
        : makeResult(criterion, 'fail', 'No version drift detection tooling found.');

    default:
      return null;
  }
}
