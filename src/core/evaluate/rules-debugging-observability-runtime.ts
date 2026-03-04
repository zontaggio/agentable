import { countKeywordMatches, hasAnyDependency, hasAnyFilePattern } from './helpers';
import { evidenceDetail, makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateDebuggingObservabilityRuntime(
  input: CriterionEvaluatorInput,
) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
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
