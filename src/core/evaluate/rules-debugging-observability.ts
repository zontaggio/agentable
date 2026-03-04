import { countKeywordMatches, hasAnyDependency, hasAnyFilePattern } from './helpers';
import { evidenceDetail, makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateDebuggingObservability(
  input: CriterionEvaluatorInput,
) {
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
          [
            evidenceDetail(
              'dependency',
              'strong',
              'Found circuit breaker library dependency.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['circuit breaker']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual references to circuit breaker patterns were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Repository text includes "circuit breaker" mention.',
            ),
          ],
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
      if (countKeywordMatches(signals.workflowText, ['codeql', 'coveralls', 'codecov', 'sonar']) > 0) {
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
          [
            evidenceDetail(
              'dependency',
              'strong',
              'Found OpenTelemetry/Jaeger/Zipkin dependency.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['traceid', 'request-id propagation']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to trace propagation were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Trace propagation keywords detected in text index.',
            ),
          ],
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
          [
            evidenceDetail(
              'dependency',
              'strong',
              'Found Sentry/Bugsnag/Rollbar dependency.',
            ),
          ],
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

    case 'health_checks':
      if (hasAnyFilePattern(local, [/health/i, /ready/i, /live/i])) {
        return makeResult(
          criterion,
          'pass',
          'Health check files/routes detected.',
          [],
          [
            evidenceDetail(
              'file',
              'strong',
              'Found files/routes matching health/ready/live patterns.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['/health', 'healthcheck']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual mentions of health checks were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Healthcheck keywords found in text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No health checks detected.');

    case 'metrics_collection':
      if (
        hasAnyDependency(local, [
          'prom-client',
          'prometheus',
          'datadog',
          'statsd',
          'opentelemetry',
        ])
      ) {
        return makeResult(
          criterion,
          'pass',
          'Metrics/telemetry dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found metrics/telemetry dependency.')],
        );
      }
      if (
        countKeywordMatches(signals.workflowText, [
          'prometheus',
          'datadog',
          'statsd',
          'telemetry',
        ]) > 0
      ) {
        return makeResult(
          criterion,
          'pass',
          'Metrics/telemetry signals detected in workflows.',
          [],
          [
            evidenceDetail(
              'workflow',
              'medium',
              'Workflow references metrics/telemetry systems.',
            ),
          ],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['metrics', 'telemetry']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only generic metrics/telemetry mentions were found; instrumentation evidence is missing.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Generic metrics/telemetry keywords present in repository text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No metrics collection instrumentation detected.');

    case 'profiling_instrumentation':
      if (hasAnyDependency(local, ['pyroscope', '0x'])) {
        return makeResult(
          criterion,
          'pass',
          'Profiling dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found profiling dependency (pyroscope/0x).')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['profiling', 'pyroscope', '0x']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to profiling were found.',
          [],
          [
            evidenceDetail(
              'text',
              'weak',
              'Profiling-related keywords present in text index.',
            ),
          ],
        );
      }
      return makeResult(criterion, 'fail', 'No profiling instrumentation detected.');

    case 'runbooks_documented': {
      if (hasAnyFilePattern(local, [/runbook/i, /playbook/i, /oncall/i])) {
        return makeResult(criterion, 'pass', 'Runbook/playbook documents detected.');
      }

      if (criterion.aiAssisted) {
        return makeResult(
          criterion,
          'unverified',
          'Runbook quality requires AI semantic assessment (no baseline found).',
        );
      }

      return makeResult(criterion, 'fail', 'No runbook documentation detected.');
    }

    case 'structured_logging':
      return hasAnyDependency(local, ['pino', 'winston', 'bunyan', 'debug'])
        ? makeResult(
            criterion,
            'pass',
            'Structured logging dependency detected.',
            [],
            [
              evidenceDetail(
                'dependency',
                'strong',
                'Found structured logging dependency (pino/winston/bunyan/debug).',
              ),
            ],
          )
        : makeResult(criterion, 'fail', 'No structured logging tooling detected.');

    default:
      return null;
  }
}
