import { CRITERIA } from '../catalog/v1';
import {
  ActionPlan,
  ActionPlanBucket,
  CategoryId,
  CriterionConfidence,
  CriterionResult,
  RecommendationItem,
} from '../types';
import { getCardMeta } from './card-meta';

const DESCRIPTION_BY_CRITERION = new Map(CRITERIA.map((criterion) => [criterion.id, criterion.description]));

const CATEGORY_PRIORITY: Record<CategoryId, number> = {
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

const STATUS_PRIORITY: Record<Exclude<CriterionResult['status'], 'pass' | 'skip'>, number> = {
  fail: 1,
  unverified: 0.72,
};

const CONFIDENCE_PRIORITY: Record<CriterionConfidence, number> = {
  high: 1,
  medium: 0.84,
  low: 0.66,
};

const DEPENDENCY_GRAPH: Record<string, string[]> = {
  distributed_tracing: ['metrics_collection', 'structured_logging'],
  error_tracking_contextualized: ['structured_logging'],
  rollback_automation: ['release_automation', 'progressive_rollout'],
  privacy_compliance: ['pii_handling'],
  error_to_insight_pipeline: ['error_tracking_contextualized', 'issue_labeling_system'],
};

const CATEGORY_OUTCOME: Record<CategoryId, string> = {
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

const TOOLING_BY_CRITERION: Record<string, string[]> = {
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
  test_coverage_thresholds: ['Codecov', 'Istanbul/nyc coverage thresholds', 'Jest/Vitest coverage gates'],
  flaky_test_detection: ['pytest-rerunfailures', 'Playwright retries/quarantine labels', 'Jest retry strategy'],
  test_performance_tracking: ['pytest --durations', 'Jest timing reports', 'custom slow-test budget dashboard'],
  runbooks_documented: ['Backstage', 'Notion/Confluence with ownership metadata', 'PagerDuty runbook links'],
  service_flow_documented: ['C4 model diagrams', 'ADR docs', 'OpenAPI + architecture docs'],
  devcontainer: ['.devcontainer', 'Docker Compose dev stack'],
};

const CATEGORY_TOOLING_FALLBACK: Record<CategoryId, string[]> = {
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

const STEPS_BY_CRITERION: Record<string, string[]> = {
  formatter: ['Adopt and enforce a shared formatter policy.', 'Keep formatting checks mandatory in pull requests.'],
  lint_config: ['Adopt a baseline lint policy across the repository.', 'Fail pull requests when lint violations exceed policy.'],
  pre_commit_hooks: ['Run lightweight quality checks before commit.', 'Keep hooks focused on fast feedback and consistency.'],
  dead_code_detection: ['Schedule recurring dead-code scans.', 'Triage and remove stale exports and unused modules regularly.'],
  duplicate_code_detection: ['Track duplication ratios in CI.', 'Refactor repeated logic into shared modules.'],
  cyclomatic_complexity: ['Set complexity thresholds for critical code paths.', 'Refactor high-complexity functions into smaller units.'],
  naming_consistency: ['Define naming conventions in contribution standards.', 'Automate naming policy checks in linting.'],
  tech_debt_tracking: ['Convert recurring TODO/FIXME findings into tracked backlog items.', 'Review debt trends in regular engineering rituals.'],
  build_cmd_doc: ['Document the canonical build flow in repository docs.', 'Keep build instructions aligned with CI behavior.'],
  deps_pinned: ['Use deterministic dependency resolution for all environments.', 'Review lockfile changes as part of pull request policy.'],
  release_automation: ['Automate release orchestration around approved branches.', 'Gate release actions on quality and verification signals.'],
  release_notes_automation: ['Generate release notes from structured change data.', 'Publish notes as part of the release lifecycle.'],
  unused_dependencies_detection: ['Run periodic dependency hygiene checks.', 'Remove stale packages and revalidate impacted modules.'],
  feature_flag_infrastructure: ['Use a managed feature flag strategy for risky changes.', 'Establish ownership and cleanup policies for stale flags.'],
  automated_pr_review: ['Add automated review checks to pull request workflows.', 'Use advisory mode first, then tighten enforcement.'],
  branch_protection: ['Protect default branches with review and status requirements.', 'Disallow bypass patterns that weaken merge quality gates.'],
  secret_scanning: ['Enable and monitor secret scanning continuously.', 'Define immediate rotation and incident flow for detected leaks.'],
  codeowners: ['Assign ownership for critical folders and systems.', 'Use ownership rules to enforce accountable reviews.'],
  dependency_update_automation: ['Automate dependency update intake.', 'Prioritize safe cadence with clear merge and rollback policies.'],
  issue_templates: ['Standardize issue intake fields and expected evidence.', 'Use templates to improve triage quality from day one.'],
  pr_templates: ['Require pull request context, risk notes, and validation summary.', 'Use consistent templates to reduce review ambiguity.'],
  structured_logging: ['Standardize structured log schema and key context fields.', 'Ensure identifiers support cross-system debugging.'],
  distributed_tracing: ['Instrument request flow end-to-end across service boundaries.', 'Define trace retention and sampling strategy.'],
  error_tracking_contextualized: ['Capture error events with actionable service context.', 'Link errors to release versions and ownership context.'],
  metrics_collection: ['Instrument service-level indicators for reliability.', 'Track metrics that map to user impact and system health.'],
  runbooks_documented: ['Document incident playbooks for top operational risks.', 'Keep playbooks current as architecture evolves.'],
  service_flow_documented: ['Document service boundaries and key dependencies.', 'Keep architecture artifacts updated with major changes.'],
  devcontainer: ['Provide a reproducible development container baseline.', 'Align container tooling with CI/runtime expectations.'],
  env_template: ['Maintain a complete environment variable template.', 'Document variable purpose and safe defaults.'],
  unit_tests_exist: ['Increase coverage for critical business logic.', 'Prioritize edge cases with high regression impact.'],
  integration_tests_exist: ['Validate external boundaries and contracts end-to-end.', 'Run integration checks on high-risk change paths.'],
  type_check: ['Enforce static typing checks in default validation flow.', 'Treat new type regressions as blocking quality failures.'],
};

function statusWeight(status: Exclude<CriterionResult['status'], 'pass' | 'skip'>): number {
  return STATUS_PRIORITY[status];
}

function confidenceWeight(confidence: CriterionConfidence): number {
  return CONFIDENCE_PRIORITY[confidence];
}

function findDependencyBoost(criterionId: string, weakCriteria: Set<string>): number {
  const dependencies = DEPENDENCY_GRAPH[criterionId] ?? [];
  if (dependencies.length === 0) {
    return 0;
  }

  const unresolved = dependencies.filter((id) => weakCriteria.has(id)).length;
  return unresolved / dependencies.length;
}

function computePriorityScore(result: CriterionResult, weakCriteria: Set<string>): number {
  const meta = getCardMeta(result.id);
  const categoryWeight = CATEGORY_PRIORITY[result.category];
  const severity = meta.maxPoints === 2 ? 1.2 : 1;
  const dependencyBoost = findDependencyBoost(result.id, weakCriteria);

  const score =
    categoryWeight * 18 +
    severity * 14 +
    statusWeight(result.status as Exclude<CriterionResult['status'], 'pass' | 'skip'>) * 26 +
    confidenceWeight(result.confidence) * 9 +
    dependencyBoost * 10;

  return Math.round(score * 10) / 10;
}

function computeBucketTargets(total: number): {
  critical: number;
  highLeverage: number;
  quickWins: number;
} {
  if (total <= 0) {
    return { critical: 0, highLeverage: 0, quickWins: 0 };
  }
  if (total === 1) {
    return { critical: 1, highLeverage: 0, quickWins: 0 };
  }
  if (total === 2) {
    return { critical: 1, highLeverage: 1, quickWins: 0 };
  }
  if (total === 3) {
    return { critical: 1, highLeverage: 1, quickWins: 1 };
  }

  let critical = Math.max(1, Math.min(6, Math.round(total * 0.22)));
  let highLeverage = Math.max(1, Math.round(total * 0.43));

  let quickWins = total - critical - highLeverage;

  if (quickWins < 1) {
    const deficit = 1 - quickWins;
    if (highLeverage - deficit >= 1) {
      highLeverage -= deficit;
    } else if (critical - deficit >= 1) {
      critical -= deficit;
    }
    quickWins = 1;
  }

  const allocated = critical + highLeverage + quickWins;
  if (allocated !== total) {
    quickWins += total - allocated;
  }

  return {
    critical,
    highLeverage,
    quickWins,
  };
}

function assignBucketsByRank(items: RecommendationItem[]): RecommendationItem[] {
  const targets = computeBucketTargets(items.length);

  return items.map((item, index) => {
    let bucket: ActionPlanBucket;
    if (index < targets.critical) {
      bucket = 'critical';
    } else if (index < targets.critical + targets.highLeverage) {
      bucket = 'highLeverage';
    } else {
      bucket = 'quickWins';
    }

    return {
      ...item,
      bucket,
    };
  });
}

function defaultWhyItMatters(result: CriterionResult, criterionName: string): string {
  const sourceDescription = DESCRIPTION_BY_CRITERION.get(result.id);
  if (sourceDescription) {
    return `${criterionName} is currently weak. ${sourceDescription}`;
  }
  return `${criterionName} is currently weak and increases delivery risk for this repository.`;
}

function defaultWhatGoodLooksLike(result: CriterionResult, criterionName: string): string {
  if (result.status === 'unverified') {
    return `${criterionName} is backed by explicit, machine-verifiable signals rather than ambiguous text mentions.`;
  }
  return `${criterionName} is enforced by explicit tooling and policy with reliable automation coverage.`;
}

function defaultNextSteps(result: CriterionResult): string[] {
  const specific = STEPS_BY_CRITERION[result.id] ?? [];
  const base =
    specific.length > 0
      ? specific
      : result.status === 'unverified'
        ? [
            'Convert ambiguous text references into explicit implementation signals.',
            'Attach this criterion to one automated check so status becomes machine-verifiable.',
          ]
        : [
            'Define and document the implementation standard for this criterion.',
            'Introduce automated enforcement so regressions fail early.',
          ];

  const tooling = TOOLING_BY_CRITERION[result.id] ?? CATEGORY_TOOLING_FALLBACK[result.category];
  const steps = [...base];
  if (tooling && tooling.length > 0) {
    steps.push(`Suggested tooling options: ${tooling.slice(0, 4).join(', ')}.`);
  }
  steps.push(
    result.status === 'unverified'
      ? 'Add one concrete evidence source (dependency/config/workflow) that will turn this criterion into PASS/FAIL instead of UNVERIFIED.'
      : 'Define a measurable success signal (for example, CI gate, coverage threshold, or policy compliance trend) and review it regularly.',
  );

  return Array.from(new Set(steps)).slice(0, 5);
}

function defaultExpectedOutcome(result: CriterionResult): string {
  return CATEGORY_OUTCOME[result.category];
}

export interface RecommendationSeed {
  criterionId: string;
  criterionName: string;
  category: CategoryId;
  status: Exclude<CriterionResult['status'], 'pass' | 'skip'>;
  confidence: CriterionConfidence;
  priorityScore: number;
  rank: number;
  reason: string;
  evidence: string[];
  evidenceDetails: string[];
  deterministic: {
    whyItMatters: string;
    whatGoodLooksLike: string;
    nextSteps: string[];
    expectedOutcome: string;
  };
}

export interface DeterministicActionPlanResult {
  actionPlan: ActionPlan;
  seeds: RecommendationSeed[];
}

export interface RecommendationEnrichment {
  whyItMatters?: string;
  whatGoodLooksLike?: string;
  nextSteps?: string[];
  expectedOutcome?: string;
}

export function buildDeterministicActionPlan(results: CriterionResult[]): DeterministicActionPlanResult {
  const weakResults = results.filter(
    (result) => result.applicable && (result.status === 'fail' || result.status === 'unverified'),
  );
  const weakCriteria = new Set(weakResults.map((result) => result.id));

  const ranked = weakResults
    .map((result) => {
      const cardMeta = getCardMeta(result.id);
      const criterionName = cardMeta.name;
      const priorityScore = computePriorityScore(result, weakCriteria);
      const whyItMatters = defaultWhyItMatters(result, criterionName);
      const whatGoodLooksLike = defaultWhatGoodLooksLike(result, criterionName);
      const nextSteps = defaultNextSteps(result);
      const expectedOutcome = defaultExpectedOutcome(result);
      const status = result.status as Exclude<CriterionResult['status'], 'pass' | 'skip'>;

      const recommendation: RecommendationItem = {
        id: `rec-${result.id}`,
        criterionId: result.id,
        criterionName,
        category: result.category,
        status,
        confidence: result.confidence,
        bucket: 'quickWins',
        priorityScore,
        rank: 0,
        whyItMatters,
        whatGoodLooksLike,
        nextSteps,
        expectedOutcome,
      };

      return {
        result,
        recommendation,
      };
    })
    .sort((a, b) => {
      if (b.recommendation.priorityScore !== a.recommendation.priorityScore) {
        return b.recommendation.priorityScore - a.recommendation.priorityScore;
      }
      return a.recommendation.criterionId.localeCompare(b.recommendation.criterionId);
    })
    .map((entry, index) => ({
      ...entry,
      recommendation: {
        ...entry.recommendation,
        rank: index + 1,
      },
    }));

  const rankedRecommendations = assignBucketsByRank(ranked.map((entry) => entry.recommendation));
  const recommendationByCriterionId = new Map(
    rankedRecommendations.map((recommendation) => [recommendation.criterionId, recommendation]),
  );

  const rankedWithBuckets = ranked.map((entry) => ({
    ...entry,
    recommendation: recommendationByCriterionId.get(entry.recommendation.criterionId) ?? entry.recommendation,
  }));

  const all = rankedWithBuckets.map((entry) => entry.recommendation);
  const critical = all.filter((item) => item.bucket === 'critical');
  const highLeverage = all.filter((item) => item.bucket === 'highLeverage');
  const quickWins = all.filter((item) => item.bucket === 'quickWins');

  const seeds: RecommendationSeed[] = rankedWithBuckets.map(({ result, recommendation }) => ({
    criterionId: recommendation.criterionId,
    criterionName: recommendation.criterionName,
    category: recommendation.category,
    status: recommendation.status,
    confidence: recommendation.confidence,
    priorityScore: recommendation.priorityScore,
    rank: recommendation.rank,
    reason: result.reason,
    evidence: result.evidence.slice(0, 4),
    evidenceDetails: result.evidenceDetails.map((item) => `${item.kind}:${item.strength}:${item.detail}`).slice(0, 5),
    deterministic: {
      whyItMatters: recommendation.whyItMatters,
      whatGoodLooksLike: recommendation.whatGoodLooksLike,
      nextSteps: recommendation.nextSteps,
      expectedOutcome: recommendation.expectedOutcome,
    },
  }));

  return {
    actionPlan: {
      critical,
      highLeverage,
      quickWins,
      all,
      generatedWithAi: false,
    },
    seeds,
  };
}

export function applyActionPlanEnrichment(
  actionPlan: ActionPlan,
  enrichmentByCriterion: Record<string, RecommendationEnrichment>,
): ActionPlan {
  if (Object.keys(enrichmentByCriterion).length === 0) {
    return actionPlan;
  }

  let enrichedCount = 0;
  const updatedAll = actionPlan.all.map((item) => {
    const enriched = enrichmentByCriterion[item.criterionId];
    if (!enriched) {
      return item;
    }

    const nextSteps =
      Array.isArray(enriched.nextSteps) && enriched.nextSteps.length > 0
        ? enriched.nextSteps.filter((step) => step.trim().length > 0).slice(0, 5)
        : item.nextSteps;

    const updated: RecommendationItem = {
      ...item,
      whyItMatters: enriched.whyItMatters?.trim() ? enriched.whyItMatters.trim() : item.whyItMatters,
      whatGoodLooksLike: enriched.whatGoodLooksLike?.trim() ? enriched.whatGoodLooksLike.trim() : item.whatGoodLooksLike,
      nextSteps,
      expectedOutcome: enriched.expectedOutcome?.trim() ? enriched.expectedOutcome.trim() : item.expectedOutcome,
    };
    enrichedCount += 1;
    return updated;
  });

  const regroup = {
    critical: updatedAll.filter((item) => item.bucket === 'critical'),
    highLeverage: updatedAll.filter((item) => item.bucket === 'highLeverage'),
    quickWins: updatedAll.filter((item) => item.bucket === 'quickWins'),
  };

  return {
    ...actionPlan,
    ...regroup,
    all: updatedAll,
    generatedWithAi: enrichedCount > 0 || actionPlan.generatedWithAi,
  };
}

function genericTips(result: CriterionResult): string[] {
  if (result.status === 'pass') {
    return ['This criterion is already validated. Keep it enforced in automation to avoid regressions.'];
  }

  if (result.status === 'skip') {
    return ['Criterion is currently not applicable. Re-evaluate it if repository scope changes.'];
  }

  if (result.status === 'unverified') {
    return [
      'Increase explicit evidence so this criterion can be verified with high confidence.',
      'Prefer explicit configuration and automation over text-only references.',
    ];
  }

  return ['Define and implement an explicit standard for this criterion.', 'Automate validation to prevent regressions.'];
}

export function getImprovementTips(result: CriterionResult, guidance?: RecommendationItem): string[] {
  if (guidance?.nextSteps && guidance.nextSteps.length > 0) {
    return guidance.nextSteps.slice(0, 5);
  }

  const specific = STEPS_BY_CRITERION[result.id];
  if (specific && specific.length > 0) {
    return specific;
  }

  return genericTips(result);
}
