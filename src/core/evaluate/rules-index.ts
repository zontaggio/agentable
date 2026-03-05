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

const RULES: Record<string, CriterionEvaluator> = {
  code_modularization: evaluateStyleValidation,
  cyclomatic_complexity: evaluateStyleValidation,
  dead_code_detection: evaluateStyleValidation,
  duplicate_code_detection: evaluateStyleValidation,
  formatter: evaluateStyleValidation,
  large_file_detection: evaluateStyleValidation,
  lint_config: evaluateStyleValidation,
  n_plus_one_detection: evaluateStyleValidation,
  naming_consistency: evaluateStyleValidation,
  pre_commit_hooks: evaluateStyleValidation,
  strict_typing: evaluateStyleValidation,
  tech_debt_tracking: evaluateStyleValidation,
  type_check: evaluateStyleValidation,

  agentic_development: evaluateBuildSystem,
  automated_pr_review: evaluateBuildSystem,
  build_cmd_doc: evaluateBuildSystem,
  build_performance_tracking: evaluateBuildSystem,
  dead_feature_flag_detection: evaluateBuildSystem,
  deployment_frequency: evaluateBuildSystem,
  deps_pinned: evaluateBuildSystem,
  fast_ci_feedback: evaluateBuildSystem,
  feature_flag_infrastructure: evaluateBuildSystem,
  heavy_dependency_detection: evaluateBuildSystem,
  monorepo_tooling: evaluateBuildSystem,
  progressive_rollout: evaluateBuildSystem,
  release_automation: evaluateBuildSystem,
  release_notes_automation: evaluateBuildSystem,
  rollback_automation: evaluateBuildSystem,
  single_command_setup: evaluateBuildSystem,
  unused_dependencies_detection: evaluateBuildSystem,
  vcs_cli_tools: evaluateBuildSystem,
  version_drift_detection: evaluateBuildSystem,

  flaky_test_detection: evaluateTesting,
  integration_tests_exist: evaluateTesting,
  test_coverage_thresholds: evaluateTesting,
  test_isolation: evaluateTesting,
  test_naming_conventions: evaluateTesting,
  test_performance_tracking: evaluateTesting,
  unit_tests_exist: evaluateTesting,
  unit_tests_runnable: evaluateTesting,

  agents_md: evaluateDocumentation,
  agents_md_validation: evaluateDocumentation,
  api_schema_docs: evaluateDocumentation,
  automated_doc_generation: evaluateDocumentation,
  documentation_freshness: evaluateDocumentation,
  readme: evaluateDocumentation,
  service_flow_documented: evaluateDocumentation,
  skills: evaluateDocumentation,

  database_schema: evaluateDevEnvironment,
  devcontainer: evaluateDevEnvironment,
  devcontainer_runnable: evaluateDevEnvironment,
  env_template: evaluateDevEnvironment,
  local_services_setup: evaluateDevEnvironment,

  alerting_configured: evaluateDebuggingObservability,
  circuit_breakers: evaluateDebuggingObservability,
  code_quality_metrics: evaluateDebuggingObservability,
  deployment_observability: evaluateDebuggingObservability,
  distributed_tracing: evaluateDebuggingObservability,
  error_tracking_contextualized: evaluateDebuggingObservability,
  health_checks: evaluateDebuggingObservability,
  metrics_collection: evaluateDebuggingObservability,
  profiling_instrumentation: evaluateDebuggingObservability,
  runbooks_documented: evaluateDebuggingObservability,
  structured_logging: evaluateDebuggingObservability,

  automated_security_review: evaluateSecurity,
  branch_protection: evaluateSecurity,
  codeowners: evaluateSecurity,
  dast_scanning: evaluateSecurity,
  dependency_update_automation: evaluateSecurity,
  gitignore_comprehensive: evaluateSecurity,
  log_scrubbing: evaluateSecurity,
  pii_handling: evaluateSecurity,
  privacy_compliance: evaluateSecurity,
  secret_scanning: evaluateSecurity,
  secrets_management: evaluateSecurity,

  backlog_health: evaluateTaskDiscovery,
  issue_labeling_system: evaluateTaskDiscovery,
  issue_templates: evaluateTaskDiscovery,
  pr_templates: evaluateTaskDiscovery,

  error_to_insight_pipeline: evaluateProductAnalytics,
  product_analytics_instrumentation: evaluateProductAnalytics,
};

export function getCriterionEvaluator(criterionId: string): CriterionEvaluator | undefined {
  return RULES[criterionId];
}
