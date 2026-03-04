import { CategoryId, CriterionDefinition } from '../types';
import { BUILD_SYSTEM_CRITERIA } from './v1/build-system.criteria';
import { DEBUGGING_OBSERVABILITY_CRITERIA } from './v1/debugging-observability.criteria';
import { DEV_ENVIRONMENT_CRITERIA } from './v1/dev-environment.criteria';
import { DOCUMENTATION_CRITERIA } from './v1/documentation.criteria';
import { PRODUCT_ANALYTICS_CRITERIA } from './v1/product-analytics.criteria';
import { SECURITY_CRITERIA } from './v1/security.criteria';
import { STYLE_VALIDATION_CRITERIA } from './v1/style-validation.criteria';
import { TASK_DISCOVERY_CRITERIA } from './v1/task-discovery.criteria';
import { TESTING_CRITERIA } from './v1/testing.criteria';

export const CATALOG_VERSION = 'v1.0.0';

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  style_validation: 'Style & Validation',
  build_system: 'Build System',
  testing: 'Testing',
  documentation: 'Documentation',
  dev_environment: 'Dev Environment',
  debugging_observability: 'Debugging & Observability',
  security: 'Security',
  task_discovery: 'Task Discovery',
  product_analytics: 'Product & Analytics',
};

export const CRITERIA: CriterionDefinition[] = [
  ...STYLE_VALIDATION_CRITERIA,
  ...BUILD_SYSTEM_CRITERIA,
  ...TESTING_CRITERIA,
  ...DOCUMENTATION_CRITERIA,
  ...DEV_ENVIRONMENT_CRITERIA,
  ...DEBUGGING_OBSERVABILITY_CRITERIA,
  ...SECURITY_CRITERIA,
  ...TASK_DISCOVERY_CRITERIA,
  ...PRODUCT_ANALYTICS_CRITERIA,
];
