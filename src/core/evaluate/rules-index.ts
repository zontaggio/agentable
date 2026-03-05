import { CRITERIA } from '../../catalog/v1';
import { CategoryId } from '../../types';
import { CriterionEvaluator } from './types';
import { evaluateBuildSystem } from './rules-build-system';
import { evaluateDebuggingObservability } from './rules-debugging-observability';
import { evaluateDevEnvironment } from './rules-dev-environment';
import { evaluateDocumentation } from './rules-documentation';
import { evaluateProductAnalytics } from './rules-product-analytics';
import { evaluateSecurity } from './rules-security';
import { evaluateStyleValidation } from './rules-style-validation';
import { evaluateTaskDiscovery } from './rules-task-discovery';
import { evaluateTesting } from './rules-testing';

const EVALUATOR_BY_CATEGORY: Record<CategoryId, CriterionEvaluator> = {
  style_validation: evaluateStyleValidation,
  build_system: evaluateBuildSystem,
  testing: evaluateTesting,
  documentation: evaluateDocumentation,
  dev_environment: evaluateDevEnvironment,
  debugging_observability: evaluateDebuggingObservability,
  security: evaluateSecurity,
  task_discovery: evaluateTaskDiscovery,
  product_analytics: evaluateProductAnalytics,
};

const RULES: Record<string, CriterionEvaluator> = Object.fromEntries(
  CRITERIA.map((criterion) => [criterion.id, EVALUATOR_BY_CATEGORY[criterion.category]]),
);

export function getCriterionEvaluator(criterionId: string): CriterionEvaluator | undefined {
  return RULES[criterionId];
}
