import { countKeywordMatches, hasAnyDependency } from './helpers';
import { evidenceDetail, makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateDebuggingObservabilityCore(input: CriterionEvaluatorInput) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
    case 'alerting_configured':
      if (hasAnyDependency(local, ['pagerduty', 'opsgenie', 'alertmanager'])) {
        return makeResult(
          criterion,
          'pass',
          'Alerting integration dependency detected.',
          [],
          [
            evidenceDetail(
              'dependency',
              'strong',
              'Found alerting dependency (PagerDuty/Opsgenie/Alertmanager).',
            ),
          ],
        );
      }
      if (
        countKeywordMatches(signals.workflowText, [
          'pagerduty',
          'opsgenie',
          'alertmanager',
          'alerts',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'pass',
          'Alerting integration signals found in CI/workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow mentions alerting integration/alerts path.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['pagerduty', 'opsgenie', 'alerts']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak text mentions for alerting were found; explicit integration evidence is missing.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Generic alerting keywords found in repository text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No alerting configuration detected.');

    case 'circuit_breakers':
      if (hasAnyDependency(local, ['opossum', 'resilience4j', 'hystrix'])) {
        return makeResult(
          criterion,
          'pass',
          'Circuit breaker dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found circuit breaker library dependency.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['circuit breaker']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual references to circuit breaker patterns were found.',
          [],
          [evidenceDetail('text', 'weak', 'Repository text includes "circuit breaker" mention.')],
        );
      }
      return makeResult(criterion, 'fail', 'No circuit breaker configuration detected.');

    case 'code_quality_metrics':
      if (hasAnyDependency(local, ['coveralls', 'codecov', 'sonar'])) {
        return makeResult(
          criterion,
          'pass',
          'Code quality metrics dependency detected.',
          [],
          [
            evidenceDetail(
              'dependency',
              'strong',
              'Found code quality metrics dependency (Codecov/Coveralls/Sonar).',
            ),
          ],
        );
      }
      if (
        countKeywordMatches(signals.workflowText, ['codeql', 'coveralls', 'codecov', 'sonar']) > 0
      ) {
        return makeResult(
          criterion,
          'pass',
          'Code quality metrics signals detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow contains CodeQL/Codecov/Coveralls/Sonar references.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No code quality metrics tooling detected.');

    case 'deployment_observability':
      if (countKeywordMatches(signals.workflowText, ['deploy notify', 'release monitor']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Deployment observability signals detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow references deploy notification/release monitoring.',
            ),
          ],
        );
      }
      if (
        countKeywordMatches(signals.allTextIndex, [
          'deployment dashboard',
          'deploy notify',
          'release monitor',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to deployment observability were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Repository text includes deploy dashboard/notify keywords.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No deployment observability signals detected.');

    case 'distributed_tracing':
      if (hasAnyDependency(local, ['opentelemetry', 'jaeger', 'zipkin'])) {
        return makeResult(
          criterion,
          'pass',
          'Distributed tracing dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found OpenTelemetry/Jaeger/Zipkin dependency.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['traceid', 'request-id propagation']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to trace propagation were found.',
          [],
          [evidenceDetail('text', 'weak', 'Trace propagation keywords detected in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No distributed tracing instrumentation detected.');

    case 'error_tracking_contextualized':
      if (hasAnyDependency(local, ['sentry', 'bugsnag', 'rollbar'])) {
        return makeResult(
          criterion,
          'pass',
          'Error tracking dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found Sentry/Bugsnag/Rollbar dependency.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['sentry', 'bugsnag', 'rollbar']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to error tracking were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Sentry/Bugsnag/Rollbar mentioned in repository text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No contextualized error tracking tooling detected.');

    default:
      return null;
  }
}
