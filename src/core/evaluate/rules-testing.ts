import { hasAnyScript, includesAny } from './helpers';
import { makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateTesting(input: CriterionEvaluatorInput) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
    case 'flaky_test_detection':
      return includesAny(signals.allTextIndex, ['flaky', 'retry', 'quarantine']) ||
        hasAnyScript(local, [/retry|flaky/i])
        ? makeResult(criterion, 'pass', 'Flaky test detection/retry mechanisms found.')
        : makeResult(criterion, 'fail', 'No flaky test detection strategy detected.');

    case 'integration_tests_exist':
      return signals.integrationTestFiles.length > 0
        ? makeResult(
            criterion,
            'pass',
            `Integration tests detected (${signals.integrationTestFiles.length} files).`,
          )
        : makeResult(criterion, 'fail', 'No integration test files detected.');

    case 'test_coverage_thresholds':
      return includesAny(signals.allTextIndex, [
        'coveragethreshold',
        'coverage-threshold',
        'coveralls',
        'codecov',
      ]) || hasAnyScript(local, [/coverage/i])
        ? makeResult(criterion, 'pass', 'Coverage threshold/tracking signals detected.')
        : makeResult(criterion, 'fail', 'No coverage threshold configuration found.');

    case 'test_isolation':
      return hasAnyScript(local, [/--parallel|--shard|maxworkers|--runinband=false|pytest -n/i]) ||
        includesAny(signals.allTextIndex, ['test.concurrent', 'parallel'])
        ? makeResult(criterion, 'pass', 'Test isolation/parallelization configuration found.')
        : makeResult(criterion, 'fail', 'No test isolation or parallelization signals found.');

    case 'test_naming_conventions':
      return signals.testFiles.some((f) => /\.test\.|\.spec\.|^test\//i.test(f))
        ? makeResult(criterion, 'pass', 'Test naming conventions appear consistent.')
        : makeResult(criterion, 'fail', 'No standard test naming convention detected.');

    case 'test_performance_tracking':
      return includesAny(signals.allTextIndex, ['test timing', 'slow test', 'benchmark']) ||
        hasAnyScript(local, [/--reporter|--durations/i])
        ? makeResult(criterion, 'pass', 'Test performance tracking hints found.')
        : makeResult(criterion, 'fail', 'No test performance tracking configuration detected.');

    case 'unit_tests_exist':
      return signals.unitTestFiles.length > 0
        ? makeResult(
            criterion,
            'pass',
            `Unit test files detected (${signals.unitTestFiles.length}).`,
          )
        : makeResult(criterion, 'fail', 'No unit test files detected.');

    case 'unit_tests_runnable':
      return typeof local.scripts.test === 'string' && local.scripts.test.trim().length > 0
        ? makeResult(criterion, 'pass', 'Test script available in package scripts.')
        : makeResult(criterion, 'fail', 'No runnable test script found in package scripts.');

    default:
      return null;
  }
}
