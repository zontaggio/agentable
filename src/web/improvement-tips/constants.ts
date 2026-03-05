import { CRITERIA } from '../../catalog/v1';
import { CategoryId, CriterionConfidence, CriterionResult } from '../../types';

export const DESCRIPTION_BY_CRITERION = new Map(
  CRITERIA.map((criterion) => [criterion.id, criterion.description]),
);

export const CATEGORY_PRIORITY: Record<CategoryId, number> = {
  security: 1.35,
  debugging_observability: 1.2,
  build_system: 1.15,
  testing: 1.05,
  style_validation: 1,
  dev_environment: 0.95,
  documentation: 0.9,
  product_analytics: 0.9,
  task_discovery: 0.85,
};

export const STATUS_PRIORITY: Record<
  Exclude<CriterionResult['status'], 'pass' | 'skip'>,
  number
> = {
  fail: 1,
  unverified: 0.72,
};

export const CONFIDENCE_PRIORITY: Record<CriterionConfidence, number> = {
  high: 1,
  medium: 0.84,
  low: 0.66,
};

export const DEPENDENCY_GRAPH: Record<string, string[]> = {
  distributed_tracing: ['metrics_collection', 'structured_logging'],
  error_tracking_contextualized: ['structured_logging'],
  rollback_automation: ['release_automation', 'progressive_rollout'],
  privacy_compliance: ['pii_handling'],
  error_to_insight_pipeline: ['error_tracking_contextualized', 'issue_labeling_system'],
};

export const CATEGORY_OUTCOME: Record<CategoryId, string> = {
  style_validation: 'More consistent code quality checks with fewer avoidable regressions.',
  build_system: 'A safer and faster delivery pipeline with predictable release behavior.',
  testing: 'Higher confidence in changes through reliable and repeatable validation.',
  documentation: 'Faster onboarding and less operational ambiguity for contributors.',
  dev_environment: 'Lower setup friction and more reproducible local development.',
  debugging_observability: 'Shorter incident detection and diagnosis cycles.',
  security: 'Reduced exposure to preventable security and compliance risks.',
  task_discovery: 'Better backlog signal quality and easier work triage.',
  product_analytics: 'Clearer product feedback loops and evidence-based prioritization.',
};

export const TOOLING_BY_CRITERION: Record<string, string[]> = {
  formatter: ['Prettier', 'Ruff format', 'Black'],
  lint_config: ['ESLint (+typescript-eslint)', 'Ruff', 'Pylint'],
  dead_code_detection: ['Knip', 'depcheck', 'ts-prune'],
  duplicate_code_detection: ['jscpd'],
  cyclomatic_complexity: ['ESLint complexity', 'sonarjs/cognitive-complexity', 'SonarQube'],
  automated_pr_review: ['reviewdog', 'Danger', 'CodeRabbit'],
  branch_protection: ['GitHub branch protection rulesets'],
  secret_scanning: ['GitHub Secret Scanning', 'GitHub Push Protection', 'Gitleaks'],
  dependency_update_automation: ['Dependabot', 'Renovate'],
  structured_logging: ['Pino', 'Winston', 'Bunyan'],
  distributed_tracing: ['OpenTelemetry', 'Jaeger', 'Tempo', 'Zipkin'],
  error_tracking_contextualized: ['Sentry', 'Bugsnag', 'Rollbar'],
  metrics_collection: ['Prometheus', 'OpenTelemetry metrics', 'Datadog'],
  log_scrubbing: ['Pino redaction', 'Sentry data scrubbing rules', 'custom middleware filters'],
  release_automation: ['semantic-release', 'release-please', 'changesets'],
  release_notes_automation: ['release-please', 'changesets', 'conventional-changelog'],
  feature_flag_infrastructure: ['LaunchDarkly', 'Unleash', 'Statsig', 'Flagsmith'],
  product_analytics_instrumentation: ['PostHog', 'Amplitude', 'Mixpanel', 'Segment'],
  code_quality_metrics: ['CodeQL', 'Codecov', 'Coveralls', 'SonarQube'],
  tech_debt_tracking: ['SonarQube', 'TODO scanners', 'linearized backlog tags'],
  type_check: ['TypeScript tsc --noEmit', 'mypy', 'pyright'],
  test_coverage_thresholds: [
    'Codecov',
    'Istanbul/nyc coverage thresholds',
    'Jest/Vitest coverage gates',
  ],
  flaky_test_detection: [
    'pytest-rerunfailures',
    'Playwright retries/quarantine labels',
    'Jest retry strategy',
  ],
  test_performance_tracking: [
    'pytest --durations',
    'Jest timing reports',
    'custom slow-test budget dashboard',
  ],
  runbooks_documented: [
    'Backstage',
    'Notion/Confluence with ownership metadata',
    'PagerDuty runbook links',
  ],
  service_flow_documented: ['C4 model diagrams', 'ADR docs', 'OpenAPI + architecture docs'],
  devcontainer: ['.devcontainer', 'Docker Compose dev stack'],
};

export const CATEGORY_TOOLING_FALLBACK: Record<CategoryId, string[]> = {
  style_validation: ['ESLint', 'Ruff', 'SonarQube'],
  build_system: ['GitHub Actions', 'release-please', 'changesets'],
  testing: ['Jest/Vitest', 'Playwright', 'pytest'],
  documentation: ['MkDocs', 'Docusaurus', 'ADR templates'],
  dev_environment: ['Devcontainer', 'Docker Compose', '.env templates'],
  debugging_observability: ['OpenTelemetry', 'Prometheus', 'Sentry'],
  security: ['CodeQL', 'Dependabot', 'Gitleaks'],
  task_discovery: ['GitHub Issue Forms', 'PR templates', 'label automation'],
  product_analytics: ['PostHog', 'Amplitude', 'Segment'],
};

export const STEPS_BY_CRITERION: Record<string, string[]> = {
  formatter: [
    'Adopt and enforce a shared formatter policy.',
    'Keep formatting checks mandatory in pull requests.',
  ],
  lint_config: [
    'Adopt a baseline lint policy across the repository.',
    'Fail pull requests when lint violations exceed policy.',
  ],
  pre_commit_hooks: [
    'Run lightweight quality checks before commit.',
    'Keep hooks focused on fast feedback and consistency.',
  ],
  dead_code_detection: [
    'Schedule recurring dead-code scans.',
    'Triage and remove stale exports and unused modules regularly.',
  ],
  duplicate_code_detection: [
    'Track duplication ratios in CI.',
    'Refactor repeated logic into shared modules.',
  ],
  cyclomatic_complexity: [
    'Set complexity thresholds for critical code paths.',
    'Refactor high-complexity functions into smaller units.',
  ],
  naming_consistency: [
    'Define naming conventions in contribution standards.',
    'Automate naming policy checks in linting.',
  ],
  tech_debt_tracking: [
    'Convert recurring TODO/FIXME findings into tracked backlog items.',
    'Review debt trends in regular engineering rituals.',
  ],
  build_cmd_doc: [
    'Document the canonical build flow in repository docs.',
    'Keep build instructions aligned with CI behavior.',
  ],
  deps_pinned: [
    'Use deterministic dependency resolution for all environments.',
    'Review lockfile changes as part of pull request policy.',
  ],
  release_automation: [
    'Automate release orchestration around approved branches.',
    'Gate release actions on quality and verification signals.',
  ],
  release_notes_automation: [
    'Generate release notes from structured change data.',
    'Publish notes as part of the release lifecycle.',
  ],
  unused_dependencies_detection: [
    'Run periodic dependency hygiene checks.',
    'Remove stale packages and revalidate impacted modules.',
  ],
  feature_flag_infrastructure: [
    'Use a managed feature flag strategy for risky changes.',
    'Establish ownership and cleanup policies for stale flags.',
  ],
  automated_pr_review: [
    'Add automated review checks to pull request workflows.',
    'Use advisory mode first, then tighten enforcement.',
  ],
  branch_protection: [
    'Protect default branches with review and status requirements.',
    'Disallow bypass patterns that weaken merge quality gates.',
  ],
  secret_scanning: [
    'Enable and monitor secret scanning continuously.',
    'Define immediate rotation and incident flow for detected leaks.',
  ],
  codeowners: [
    'Assign ownership for critical folders and systems.',
    'Use ownership rules to enforce accountable reviews.',
  ],
  dependency_update_automation: [
    'Automate dependency update intake.',
    'Prioritize safe cadence with clear merge and rollback policies.',
  ],
  issue_templates: [
    'Standardize issue intake fields and expected evidence.',
    'Use templates to improve triage quality from day one.',
  ],
  pr_templates: [
    'Require pull request context, risk notes, and validation summary.',
    'Use consistent templates to reduce review ambiguity.',
  ],
  structured_logging: [
    'Standardize structured log schema and key context fields.',
    'Ensure identifiers support cross-system debugging.',
  ],
  distributed_tracing: [
    'Instrument request flow end-to-end across service boundaries.',
    'Define trace retention and sampling strategy.',
  ],
  error_tracking_contextualized: [
    'Capture error events with actionable service context.',
    'Link errors to release versions and ownership context.',
  ],
  metrics_collection: [
    'Instrument service-level indicators for reliability.',
    'Track metrics that map to user impact and system health.',
  ],
  runbooks_documented: [
    'Document incident playbooks for top operational risks.',
    'Keep playbooks current as architecture evolves.',
  ],
  service_flow_documented: [
    'Document service boundaries and key dependencies.',
    'Keep architecture artifacts updated with major changes.',
  ],
  devcontainer: [
    'Provide a reproducible development container baseline.',
    'Align container tooling with CI/runtime expectations.',
  ],
  env_template: [
    'Maintain a complete environment variable template.',
    'Document variable purpose and safe defaults.',
  ],
  unit_tests_exist: [
    'Increase coverage for critical business logic.',
    'Prioritize edge cases with high regression impact.',
  ],
  integration_tests_exist: [
    'Validate external boundaries and contracts end-to-end.',
    'Run integration checks on high-risk change paths.',
  ],
  type_check: [
    'Enforce static typing checks in default validation flow.',
    'Treat new type regressions as blocking quality failures.',
  ],
};
