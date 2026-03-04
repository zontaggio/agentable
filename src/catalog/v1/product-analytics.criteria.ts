import { CriterionDefinition } from '../../types';

export const PRODUCT_ANALYTICS_CRITERIA: CriterionDefinition[] = [
  {
    id: 'error_to_insight_pipeline',
    category: 'product_analytics',
    source: 'local',
    description: 'Error-to-issue insight pipeline configured.',
  },
  {
    id: 'product_analytics_instrumentation',
    category: 'product_analytics',
    source: 'local',
    description: 'Product analytics instrumentation is configured.',
  },
];
