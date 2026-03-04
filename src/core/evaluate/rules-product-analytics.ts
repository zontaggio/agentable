import { countKeywordMatches, hasAnyDependency } from './helpers';
import { evidenceDetail, makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateProductAnalytics(
  input: CriterionEvaluatorInput,
) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
    case 'error_to_insight_pipeline':
      if (
        countKeywordMatches(signals.workflowText, [
          'sentry',
          'github issue',
          'error automation',
          'incident',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'pass',
          'Error-to-insight automation signals detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow links errors/incidents to issue automation.',
            ),
          ],
        );
      }
      if (
        countKeywordMatches(signals.allTextIndex, [
          'sentry',
          'github issue',
          'error automation',
          'incident to issue',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to error-to-insight flows were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Error-to-insight keywords present in text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No error-to-insight pipeline detected.');

    case 'product_analytics_instrumentation':
      if (
        hasAnyDependency(local, [
          'mixpanel',
          'amplitude',
          'posthog',
          'segment',
          'plausible',
        ])
      ) {
        return makeResult(
          criterion,
          'pass',
          'Product analytics dependency detected.',
          [],
          [
            evidenceDetail(
              'dependency',
              'strong',
              'Found product analytics dependency (Mixpanel/Amplitude/PostHog/Segment/Plausible).',
            ),
          ],
        );
      }
      if (
        countKeywordMatches(signals.workflowText, [
          'mixpanel',
          'amplitude',
          'posthog',
          'segment',
          'plausible',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'pass',
          'Product analytics signals detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow references product analytics tooling.',
            ),
          ],
        );
      }
      if (
        countKeywordMatches(signals.allTextIndex, [
          'mixpanel',
          'amplitude',
          'posthog',
          'analytics',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'unverified',
          'Only generic analytics text mentions were found; instrumentation evidence is missing.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Generic analytics keywords present in repository text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No product analytics instrumentation detected.');

    default:
      return null;
  }
}
