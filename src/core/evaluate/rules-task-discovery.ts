import { hasAnyFilePattern } from './helpers';
import { makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateTaskDiscovery(
  input: CriterionEvaluatorInput,
) {
  const { criterion, ctx } = input;
  const { local, ghData } = ctx;

  switch (criterion.id) {
    case 'backlog_health': {
      if (!ghData.available || !ghData.authenticated || !ghData.issueStats) {
        return makeResult(
          criterion,
          'unverified',
          'Requires authenticated gh CLI and issue access to evaluate backlog health.',
        );
      }

      const stats = ghData.issueStats;
      if (stats.total === 0) {
        return makeResult(
          criterion,
          'unverified',
          'No issues available to evaluate backlog health.',
        );
      }

      const goodRatio = stats.goodTitleAndLabels / stats.total;
      const oldIssueRatio = stats.oldOpenOver365Days / stats.total;
      const pass = goodRatio >= 0.7 && oldIssueRatio <= 0.2;

      return pass
        ? makeResult(
            criterion,
            'pass',
            `Backlog healthy (${Math.round(goodRatio * 100)}% good title+label, ${stats.oldOpenOver365Days} old open issues).`,
          )
        : makeResult(
            criterion,
            'fail',
            `Backlog needs cleanup (${Math.round(goodRatio * 100)}% good title+label, ${stats.oldOpenOver365Days} old open issues).`,
          );
    }

    case 'issue_labeling_system':
      if (ghData.labelsCount && ghData.labelsCount >= 5) {
        return makeResult(
          criterion,
          'pass',
          `Repository has ${ghData.labelsCount} labels configured.`,
        );
      }
      if (ghData.available && ghData.authenticated && ghData.labelsCount === undefined) {
        return makeResult(
          criterion,
          'unverified',
          'Issue label metadata is unavailable (likely permission-limited).',
        );
      }
      return hasAnyFilePattern(local, [/\.github\/labels\.ya?ml$/, /\.github\/labeler\.ya?ml$/])
        ? makeResult(criterion, 'pass', 'Labeling automation/configuration detected in repository.')
        : ghData.available && ghData.authenticated
          ? makeResult(criterion, 'fail', 'No strong issue labeling system signals detected.')
          : makeResult(criterion, 'unverified', 'Unable to verify issue labels without authenticated gh CLI.');

    case 'issue_templates':
      return hasAnyFilePattern(local, [/^\.github\/ISSUE_TEMPLATE\//, /^\.github\/issue_template\.md$/i])
        ? makeResult(criterion, 'pass', 'Issue template(s) detected.')
        : makeResult(criterion, 'fail', 'No issue templates found.');

    case 'pr_templates':
      return hasAnyFilePattern(local, [/^\.github\/pull_request_template\.md$/i, /^pull_request_template\.md$/i])
        ? makeResult(criterion, 'pass', 'Pull request template detected.')
        : makeResult(criterion, 'fail', 'No pull request template found.');

    default:
      return null;
  }
}
