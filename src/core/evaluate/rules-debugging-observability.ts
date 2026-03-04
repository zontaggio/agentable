import { evaluateDebuggingObservabilityCore } from './rules-debugging-observability-core';
import { evaluateDebuggingObservabilityRuntime } from './rules-debugging-observability-runtime';
import { CriterionEvaluatorInput } from './types';

export async function evaluateDebuggingObservability(
  input: CriterionEvaluatorInput,
) {
  const primary = await evaluateDebuggingObservabilityCore(input);
  if (primary) {
    return primary;
  }

  return evaluateDebuggingObservabilityRuntime(input);
}
