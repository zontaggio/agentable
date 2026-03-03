import { CategoryId, CriterionDefinition } from '../types';

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
  // Style & Validation
  {
    id: 'code_modularization',
    category: 'style_validation',
    source: 'hybrid',
    aiAssisted: true,
    description: 'Code organization has meaningful module boundaries.',
  },
  {
    id: 'cyclomatic_complexity',
    category: 'style_validation',
    source: 'local',
    description: 'Complexity analysis configured (ESLint complexity or equivalent).',
  },
  {
    id: 'dead_code_detection',
    category: 'style_validation',
    source: 'local',
    description: 'Dead code detection tooling configured.',
  },
  {
    id: 'duplicate_code_detection',
    category: 'style_validation',
    source: 'local',
    description: 'Duplicate code detection tooling configured.',
  },
  {
    id: 'formatter',
    category: 'style_validation',
    source: 'local',
    description: 'Formatter configured (Prettier/Black/Ruff Format/etc).',
  },
  {
    id: 'large_file_detection',
    category: 'style_validation',
    source: 'local',
    description: 'Large file checks configured in lint/hooks/CI.',
  },
  {
    id: 'lint_config',
    category: 'style_validation',
    source: 'local',
    description: 'Linting configured for code quality.',
  },
  {
    id: 'n_plus_one_detection',
    category: 'style_validation',
    source: 'local',
    description: 'N+1 query detection configured for ORM/database use cases.',
  },
  {
    id: 'naming_consistency',
    category: 'style_validation',
    source: 'local',
    description: 'Naming convention rules are configured.',
  },
  {
    id: 'pre_commit_hooks',
    category: 'style_validation',
    source: 'local',
    description: 'Pre-commit hooks configured.',
  },
  {
    id: 'strict_typing',
    category: 'style_validation',
    source: 'local',
    description: 'Strict type checking mode is enabled for typed projects.',
  },
  {
    id: 'tech_debt_tracking',
    category: 'style_validation',
    source: 'local',
    description: 'Tech debt tracking automation exists (TODO scanners/Sonar/etc).',
  },
  {
    id: 'type_check',
    category: 'style_validation',
    source: 'local',
    description: 'A type-check command or equivalent static typing verification exists.',
  },

  // Build System
  {
    id: 'agentic_development',
    category: 'build_system',
    source: 'local',
    description: 'Evidence of agent-assisted development in repository workflows.',
  },
  {
    id: 'automated_pr_review',
    category: 'build_system',
    source: 'gh',
    description: 'Automated PR review comments/checks are configured.',
  },
  {
    id: 'build_cmd_doc',
    category: 'build_system',
    source: 'local',
    description: 'README documents build command.',
  },
  {
    id: 'build_performance_tracking',
    category: 'build_system',
    source: 'local',
    description: 'Build timing or performance monitoring configured.',
  },
  {
    id: 'dead_feature_flag_detection',
    category: 'build_system',
    source: 'local',
    description: 'Dead feature flag detection configured.',
  },
  {
    id: 'deployment_frequency',
    category: 'build_system',
    source: 'hybrid',
    description: 'Frequent deployments/releases are visible.',
  },
  {
    id: 'deps_pinned',
    category: 'build_system',
    source: 'local',
    description: 'Dependencies pinned via lockfiles.',
  },
  {
    id: 'fast_ci_feedback',
    category: 'build_system',
    source: 'local',
    description: 'CI feedback loop is configured to be fast.',
  },
  {
    id: 'feature_flag_infrastructure',
    category: 'build_system',
    source: 'local',
    description: 'Feature flag platform/infrastructure exists.',
  },
  {
    id: 'heavy_dependency_detection',
    category: 'build_system',
    source: 'local',
    description: 'Heavy bundle dependency detection configured for frontend bundles.',
  },
  {
    id: 'monorepo_tooling',
    category: 'build_system',
    source: 'local',
    description: 'Monorepo tooling configured when monorepo is used.',
  },
  {
    id: 'progressive_rollout',
    category: 'build_system',
    source: 'local',
    description: 'Progressive rollout strategy configured.',
  },
  {
    id: 'release_automation',
    category: 'build_system',
    source: 'local',
    description: 'Release automation pipeline exists.',
  },
  {
    id: 'release_notes_automation',
    category: 'build_system',
    source: 'local',
    description: 'Release notes/changelog automation exists.',
  },
  {
    id: 'rollback_automation',
    category: 'build_system',
    source: 'local',
    description: 'Rollback automation exists for deployments.',
  },
  {
    id: 'single_command_setup',
    category: 'build_system',
    source: 'local',
    description: 'Single command setup documented.',
  },
  {
    id: 'unused_dependencies_detection',
    category: 'build_system',
    source: 'local',
    description: 'Unused dependency detection configured.',
  },
  {
    id: 'vcs_cli_tools',
    category: 'build_system',
    source: 'local',
    description: 'Version control CLI tools available in environment.',
  },
  {
    id: 'version_drift_detection',
    category: 'build_system',
    source: 'local',
    description: 'Version drift checks configured for monorepo/workspaces.',
  },

  // Testing
  {
    id: 'flaky_test_detection',
    category: 'testing',
    source: 'local',
    description: 'Flaky test detection/quarantine configured.',
  },
  {
    id: 'integration_tests_exist',
    category: 'testing',
    source: 'local',
    description: 'Integration tests exist.',
  },
  {
    id: 'test_coverage_thresholds',
    category: 'testing',
    source: 'local',
    description: 'Coverage thresholds configured/enforced.',
  },
  {
    id: 'test_isolation',
    category: 'testing',
    source: 'local',
    description: 'Test isolation/parallelization configured.',
  },
  {
    id: 'test_naming_conventions',
    category: 'testing',
    source: 'local',
    description: 'Test naming conventions are consistent.',
  },
  {
    id: 'test_performance_tracking',
    category: 'testing',
    source: 'local',
    description: 'Test performance/timing tracking configured.',
  },
  {
    id: 'unit_tests_exist',
    category: 'testing',
    source: 'local',
    description: 'Unit tests exist.',
  },
  {
    id: 'unit_tests_runnable',
    category: 'testing',
    source: 'local',
    description: 'Unit tests can be run via package script.',
  },

  // Documentation
  {
    id: 'agents_md',
    category: 'documentation',
    source: 'local',
    description: 'AGENTS.md exists at repository root.',
  },
  {
    id: 'agents_md_validation',
    category: 'documentation',
    source: 'local',
    description: 'AGENTS.md has validation/checking automation.',
  },
  {
    id: 'api_schema_docs',
    category: 'documentation',
    source: 'local',
    description: 'API schema docs exist for service projects.',
  },
  {
    id: 'automated_doc_generation',
    category: 'documentation',
    source: 'local',
    description: 'Automated doc generation configured.',
  },
  {
    id: 'documentation_freshness',
    category: 'documentation',
    source: 'local',
    description: 'Documentation updated recently.',
  },
  {
    id: 'readme',
    category: 'documentation',
    source: 'local',
    description: 'README file exists.',
  },
  {
    id: 'service_flow_documented',
    category: 'documentation',
    source: 'hybrid',
    aiAssisted: true,
    description: 'Service or architecture flow is documented.',
  },
  {
    id: 'skills',
    category: 'documentation',
    source: 'local',
    description: 'Skills directory exists in recognized locations.',
  },

  // Dev Environment
  {
    id: 'database_schema',
    category: 'dev_environment',
    source: 'local',
    description: 'Database schema/migrations are present when database is used.',
  },
  {
    id: 'devcontainer',
    category: 'dev_environment',
    source: 'local',
    description: 'Devcontainer configuration exists.',
  },
  {
    id: 'devcontainer_runnable',
    category: 'dev_environment',
    source: 'local',
    description: 'Devcontainer has required fields to run.',
  },
  {
    id: 'env_template',
    category: 'dev_environment',
    source: 'local',
    description: '.env template exists.',
  },
  {
    id: 'local_services_setup',
    category: 'dev_environment',
    source: 'local',
    description: 'Local services setup instructions exist.',
  },

  // Debugging & Observability
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

  // Security
  {
    id: 'automated_security_review',
    category: 'security',
    source: 'local',
    description: 'Automated security scan (SAST) configured in CI.',
  },
  {
    id: 'branch_protection',
    category: 'security',
    source: 'gh',
    description: 'Branch protection is enabled.',
  },
  {
    id: 'codeowners',
    category: 'security',
    source: 'local',
    description: 'CODEOWNERS file exists.',
  },
  {
    id: 'dast_scanning',
    category: 'security',
    source: 'local',
    description: 'DAST scanning is configured for service apps.',
  },
  {
    id: 'dependency_update_automation',
    category: 'security',
    source: 'local',
    description: 'Dependency update automation configured (Dependabot/Renovate).',
  },
  {
    id: 'gitignore_comprehensive',
    category: 'security',
    source: 'local',
    description: '.gitignore includes common sensitive/local artifacts.',
  },
  {
    id: 'log_scrubbing',
    category: 'security',
    source: 'local',
    description: 'Log scrubbing/redaction mechanisms are configured.',
  },
  {
    id: 'pii_handling',
    category: 'security',
    source: 'local',
    description: 'PII handling controls are present when PII is processed.',
  },
  {
    id: 'privacy_compliance',
    category: 'security',
    source: 'local',
    description: 'Privacy compliance references are documented when applicable.',
  },
  {
    id: 'secret_scanning',
    category: 'security',
    source: 'gh',
    description: 'Secret scanning is enabled.',
  },
  {
    id: 'secrets_management',
    category: 'security',
    source: 'local',
    description: 'Secrets management patterns/integrations exist.',
  },

  // Task Discovery
  {
    id: 'backlog_health',
    category: 'task_discovery',
    source: 'gh',
    description: 'Issue backlog hygiene is healthy.',
  },
  {
    id: 'issue_labeling_system',
    category: 'task_discovery',
    source: 'hybrid',
    description: 'Issue labels are consistently managed.',
  },
  {
    id: 'issue_templates',
    category: 'task_discovery',
    source: 'local',
    description: 'Issue templates exist.',
  },
  {
    id: 'pr_templates',
    category: 'task_discovery',
    source: 'local',
    description: 'PR template exists.',
  },

  // Product & Analytics
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
