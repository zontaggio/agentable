export const DEBUGGING_OBSERVABILITY_WHY_IT_MATTERS: Record<string, string> = {
  alerting_configured:
    'Alerts make failures visible quickly, which is critical when agent-generated changes increase change volume.',
  circuit_breakers:
    'Circuit breakers bound failure propagation, giving agents safer operational guardrails around external dependency issues.',
  code_quality_metrics:
    'Quality metrics help agents and humans see whether change velocity is silently degrading maintainability.',
  deployment_observability:
    'Release observability connects changes to runtime outcomes, which helps confirm or reject agent-generated deployments quickly.',
  distributed_tracing:
    'Tracing lets agents and humans follow behavior across service boundaries instead of guessing where a regression originates.',
  error_tracking_contextualized:
    'Context-rich error tracking turns stack traces into actionable failures that agents can triage and fix faster.',
  health_checks:
    'Health checks create explicit service liveness signals, which agents can use to verify deployment and runtime assumptions.',
  metrics_collection:
    'Metrics turn system behavior into measurable signals that agents can optimize against instead of intuition.',
  profiling_instrumentation:
    'Profiling reveals performance hotspots that agents are otherwise likely to miss while making functional changes.',
  runbooks_documented:
    'Runbooks encode operational response patterns, giving agents safer recovery and diagnostic workflows under pressure.',
  structured_logging:
    'Structured logs preserve machine-readable context, making agent debugging far more reliable than free-form log text.',
};
