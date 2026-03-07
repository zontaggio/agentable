import { BUILD_SYSTEM_WHY_IT_MATTERS } from './build-system';
import { DEBUGGING_OBSERVABILITY_WHY_IT_MATTERS } from './debugging-observability';
import { DEV_ENVIRONMENT_WHY_IT_MATTERS } from './dev-environment';
import { DOCUMENTATION_WHY_IT_MATTERS } from './documentation';
import { PRODUCT_ANALYTICS_WHY_IT_MATTERS } from './product-analytics';
import { SECURITY_WHY_IT_MATTERS } from './security';
import { STYLE_VALIDATION_WHY_IT_MATTERS } from './style-validation';
import { TASK_DISCOVERY_WHY_IT_MATTERS } from './task-discovery';
import { TESTING_WHY_IT_MATTERS } from './testing';

export const WHY_IT_MATTERS_BY_CRITERION: Record<string, string> = {
  ...STYLE_VALIDATION_WHY_IT_MATTERS,
  ...BUILD_SYSTEM_WHY_IT_MATTERS,
  ...TESTING_WHY_IT_MATTERS,
  ...DOCUMENTATION_WHY_IT_MATTERS,
  ...DEV_ENVIRONMENT_WHY_IT_MATTERS,
  ...DEBUGGING_OBSERVABILITY_WHY_IT_MATTERS,
  ...SECURITY_WHY_IT_MATTERS,
  ...TASK_DISCOVERY_WHY_IT_MATTERS,
  ...PRODUCT_ANALYTICS_WHY_IT_MATTERS,
};
