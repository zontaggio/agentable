import { CriterionDefinition } from '../../types';

export const DEBUGGING_OBSERVABILITY_CRITERIA: CriterionDefinition[] = [
  {
    id: 'alerting_configured',
    category: 'debugging_observability',
    source: 'local',
    description: 'Alerting integrations or rules configured.',
  },
  {
    id: 'circuit_breakers',
    category: 'debugging_observability',
    source: 'local',
    description: 'Circuit breaker patterns/libraries configured.',
  },
  {
    id: 'code_quality_metrics',
    category: 'debugging_observability',
    source: 'local',
    description: 'Code quality metrics tools configured.',
  },
  {
    id: 'deployment_observability',
    category: 'debugging_observability',
    source: 'local',
    description: 'Deployment observability dashboard/notification is configured.',
  },
  {
    id: 'distributed_tracing',
    category: 'debugging_observability',
    source: 'local',
    description: 'Distributed tracing instrumentation is configured.',
  },
  {
    id: 'error_tracking_contextualized',
    category: 'debugging_observability',
    source: 'local',
    description: 'Error tracking with contextual metadata is configured.',
  },
  {
    id: 'health_checks',
    category: 'debugging_observability',
    source: 'local',
    description: 'Health checks are implemented for services.',
  },
  {
    id: 'metrics_collection',
    category: 'debugging_observability',
    source: 'local',
    description: 'Metrics collection/telemetry is configured.',
  },
  {
    id: 'profiling_instrumentation',
    category: 'debugging_observability',
    source: 'local',
    description: 'Profiling instrumentation exists.',
  },
  {
    id: 'runbooks_documented',
    category: 'debugging_observability',
    source: 'hybrid',
    aiAssisted: true,
    description: 'Runbooks/playbooks are documented.',
  },
  {
    id: 'structured_logging',
    category: 'debugging_observability',
    source: 'local',
    description: 'Structured logging capabilities are configured.',
  },
];
