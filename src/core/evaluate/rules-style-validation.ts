import path from 'node:path';
import { safeReadText } from '../../utils/files';
import {
  hasAnyDependency,
  hasAnyFilePattern,
  hasAnyScript,
  includesAny,
  inferTopLevelSourceFolders,
} from './helpers';
import { makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateStyleValidation(input: CriterionEvaluatorInput) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
    case 'code_modularization': {
      if (local.locEstimate < 3000) {
        return makeResult(
          criterion,
          'skip',
          `Skipped - small repository (~${local.locEstimate} lines), module boundaries less meaningful.`,
          [],
          [],
          undefined,
          false,
        );
      }

      const topFolders = inferTopLevelSourceFolders(local);
      if (topFolders >= 3) {
        return makeResult(
          criterion,
          'pass',
          `Source tree has ${topFolders} top-level modules under src/.`,
          [`src/* top-level folders: ${topFolders}`],
        );
      }

      if (criterion.aiAssisted && Object.keys(ctx.aiAssessments).length === 0) {
        return makeResult(
          criterion,
          'unverified',
          'Needs semantic review; configure OpenRouter in local setup to baseline this criterion.',
          [],
        );
      }

      return makeResult(criterion, 'fail', 'Source tree has limited module separation.', [
        `src/* top-level folders: ${topFolders}`,
      ]);
    }

    case 'cyclomatic_complexity':
      return hasAnyFilePattern(local, [/\.eslintrc/i, /^eslint\.config\./]) &&
        includesAny(signals.allTextIndex, ['complexity', 'sonarjs/cognitive-complexity'])
        ? makeResult(criterion, 'pass', 'Complexity rule detected in lint configuration.')
        : makeResult(criterion, 'fail', 'No complexity analysis rule detected.');

    case 'dead_code_detection':
      return hasAnyDependency(local, ['knip', 'ts-prune', 'unimported', 'depcheck']) ||
        hasAnyScript(local, [/knip|ts-prune|unimported|depcheck/i])
        ? makeResult(criterion, 'pass', 'Dead code detection tooling configured.')
        : makeResult(criterion, 'fail', 'No dead code detection tooling found.');

    case 'duplicate_code_detection':
      return hasAnyDependency(local, ['jscpd', 'duplication']) ||
        hasAnyScript(local, [/jscpd|duplication/i])
        ? makeResult(criterion, 'pass', 'Duplicate code detection tooling configured.')
        : makeResult(criterion, 'fail', 'No duplicate code detection tooling found.');

    case 'formatter':
      return hasAnyFilePattern(local, [
        /\.prettierrc/,
        /prettier\.config\./,
        /^pyproject\.toml$/,
      ]) || hasAnyDependency(local, ['prettier', 'black', 'ruff'])
        ? makeResult(criterion, 'pass', 'Formatter configuration detected.')
        : makeResult(criterion, 'fail', 'No formatter configuration files found.');

    case 'large_file_detection':
      return includesAny(signals.workflowText, ['maxkb', 'max-size', 'git lfs', 'size-limit']) ||
        includesAny(signals.allTextIndex, ['filesize', 'size-limit'])
        ? makeResult(criterion, 'pass', 'Large file/bundle size detection found in CI or tooling.')
        : makeResult(criterion, 'fail', 'No large file detection checks found.');

    case 'lint_config':
      return hasAnyFilePattern(local, [
        /\.eslintrc/,
        /^eslint\.config\./,
        /\.ruff\.toml$/,
        /^pyproject\.toml$/,
      ]) || hasAnyDependency(local, ['eslint', 'ruff', 'pylint'])
        ? makeResult(criterion, 'pass', 'Lint configuration detected.')
        : makeResult(criterion, 'fail', 'No lint configuration found.');

    case 'n_plus_one_detection':
      return hasAnyDependency(local, ['django-debug-toolbar', 'bullet', 'nplusone']) ||
        includesAny(signals.allTextIndex, ['n+1', 'n plus one'])
        ? hasAnyDependency(local, ['django-debug-toolbar', 'bullet', 'nplusone'])
          ? makeResult(
              criterion,
              'pass',
              'N+1 detection dependency found.',
              [],
              [
                {
                  kind: 'dependency',
                  strength: 'strong',
                  detail: 'Found dependency commonly used for N+1 query detection.',
                },
              ],
            )
          : makeResult(
              criterion,
              'unverified',
              'Only weak textual references to N+1 query detection were found.',
              [],
              [
                {
                  kind: 'text',
                  strength: 'weak',
                  detail: 'N+1 keywords found in repository text index.',
                },
              ],
            )
        : makeResult(criterion, 'fail', 'No N+1 detection tooling found.');

    case 'naming_consistency':
      return includesAny(signals.allTextIndex, ['naming-convention', 'naming convention'])
        ? makeResult(criterion, 'pass', 'Naming convention rules documented/configured.')
        : makeResult(criterion, 'fail', 'No naming convention rule detected.');

    case 'pre_commit_hooks':
      return local.fileSet.has('.husky/pre-commit') ||
        local.fileSet.has('.pre-commit-config.yaml') ||
        hasAnyDependency(local, ['husky', 'lint-staged', 'pre-commit'])
        ? makeResult(criterion, 'pass', 'Pre-commit hooks configuration detected.')
        : makeResult(criterion, 'fail', 'No pre-commit hook configuration detected.');

    case 'strict_typing': {
      const tsconfig = await safeReadText(path.join(local.rootPath, 'tsconfig.json'));
      const pyproject = await safeReadText(path.join(local.rootPath, 'pyproject.toml'));

      if (
        includesAny(tsconfig, ['"strict": true', '"strict":true']) ||
        includesAny(pyproject, ['strict = true'])
      ) {
        return makeResult(criterion, 'pass', 'Strict typing mode configured.');
      }

      return makeResult(criterion, 'fail', 'No strict typing mode detected in typed project.');
    }

    case 'tech_debt_tracking':
      return hasAnyDependency(local, ['sonarqube', 'sonar-scanner']) ||
        hasAnyScript(local, [/todo|fixme|sonar/i]) ||
        includesAny(signals.workflowText, ['todo', 'fixme', 'sonar'])
        ? makeResult(criterion, 'pass', 'Tech debt tracking signals detected.')
        : makeResult(criterion, 'fail', 'No tech debt tracking automation found.');

    case 'type_check':
      return hasAnyScript(local, [
        /tsc\s+--noemit|npm\s+run\s+typecheck|mypy|pyright|typecheck/i,
      ]) || hasAnyDependency(local, ['typescript', 'mypy', 'pyright'])
        ? makeResult(criterion, 'pass', 'Type checking command/tooling detected.')
        : makeResult(criterion, 'fail', 'No type-checking setup found.');

    default:
      return null;
  }
}
