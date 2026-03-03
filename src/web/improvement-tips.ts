import { CriterionResult } from '../types';

const TIPS_BY_CRITERION: Record<string, string[]> = {
  formatter: [
    'Add Prettier (or equivalent) configuration in repo root.',
    'Run formatting in CI and fail when files are not formatted.',
  ],
  lint_config: [
    'Enable ESLint/Ruff with a shared baseline config.',
    'Run lint in CI for pull requests and main branch.',
  ],
  pre_commit_hooks: [
    'Set up Husky or pre-commit to run lint and tests before commit.',
    'Keep hook tasks fast (lint staged files first).',
  ],
  dead_code_detection: [
    'Add knip/depcheck/ts-prune to detect dead or unused exports.',
    'Run dead-code scan weekly in CI and report findings.',
  ],
  duplicate_code_detection: [
    'Add jscpd (or similar) to detect copy/paste duplication.',
    'Set thresholds and fail CI when duplicate ratio is exceeded.',
  ],
  cyclomatic_complexity: [
    'Enable complexity rules in lint config (e.g. ESLint complexity).',
    'Refactor high-complexity files into smaller functions/modules.',
  ],
  naming_consistency: [
    'Add naming-convention rules in linter config.',
    'Document naming standards in CONTRIBUTING or README.',
  ],
  tech_debt_tracking: [
    'Track TODO/FIXME with scanner automation in CI.',
    'Create backlog tickets for debt items above threshold.',
  ],
  build_cmd_doc: [
    'Document the exact build command in README.',
    'Include expected output/artifacts for the build step.',
  ],
  deps_pinned: [
    'Commit lockfile to repository and keep it updated in PRs.',
    'Use deterministic install command in CI.',
  ],
  release_automation: [
    'Add release workflow (semantic-release or release-please).',
    'Automate publish/tag on approved branch merges.',
  ],
  release_notes_automation: [
    'Generate changelog automatically from commits or changesets.',
    'Publish notes as part of release pipeline.',
  ],
  unused_dependencies_detection: [
    'Add depcheck/knip to CI and review reports each sprint.',
    'Remove stale packages and lock transitive updates.',
  ],
  feature_flag_infrastructure: [
    'Adopt a feature flag platform (Unleash/LaunchDarkly/Statsig).',
    'Wrap risky rollouts behind flags and define cleanup policy.',
  ],
  automated_pr_review: [
    'Integrate automated code review tooling in PR workflows.',
    'Start with advisory comments before enforcing blocking checks.',
  ],
  branch_protection: [
    'Enable branch protection on default branch with required checks.',
    'Require reviews and disallow force push on protected branches.',
  ],
  secret_scanning: [
    'Enable secret scanning and push protection on GitHub.',
    'Rotate and revoke any leaked tokens found in history.',
  ],
  codeowners: [
    'Add CODEOWNERS in root or .github directory.',
    'Map critical paths to explicit owner teams.',
  ],
  dependency_update_automation: [
    'Enable Dependabot/Renovate for dependencies and actions.',
    'Auto-merge patch-level updates after CI passes.',
  ],
  issue_templates: [
    'Create issue templates for bug, feature and question flows.',
    'Make labels and reproduction steps mandatory fields.',
  ],
  pr_templates: [
    'Add PR template with checklist and risk/rollback notes.',
    'Require test evidence and linked issue in PR body.',
  ],
  structured_logging: [
    'Use structured logger (pino/winston) with stable schema.',
    'Include correlation IDs in request and error logs.',
  ],
  distributed_tracing: [
    'Add OpenTelemetry and propagate trace/request IDs.',
    'Export traces to a backend and define sampling policy.',
  ],
  error_tracking_contextualized: [
    'Integrate Sentry/Bugsnag/Rollbar with release metadata.',
    'Attach context (tenant, route, commit SHA) to errors.',
  ],
  metrics_collection: [
    'Instrument key app metrics (latency/error/throughput).',
    'Export to Prometheus/Datadog and define alert thresholds.',
  ],
  runbooks_documented: [
    'Create runbooks for common incidents and deploy failures.',
    'Link runbooks from alerts and on-call playbooks.',
  ],
  service_flow_documented: [
    'Document architecture/service flow with dependency diagram.',
    'Keep docs versioned and updated on major changes.',
  ],
  devcontainer: [
    'Add .devcontainer/devcontainer.json for reproducible setup.',
    'Preinstall key tools and extensions in devcontainer.',
  ],
  env_template: [
    'Add .env.example/.env.template with required variables.',
    'Describe each variable purpose and example values.',
  ],
  unit_tests_exist: [
    'Add unit tests for core domain logic and edge cases.',
    'Start with critical paths before broadening coverage.',
  ],
  integration_tests_exist: [
    'Add integration tests for external boundaries and contracts.',
    'Run integration suite in CI at least on default branch.',
  ],
  type_check: [
    'Add explicit typecheck script (tsc --noEmit / mypy).',
    'Run typecheck in CI and fail on new violations.',
  ],
};

function genericTips(result: CriterionResult): string[] {
  if (result.status === 'pass') {
    return [
      'This criterion is already validated. Keep it enforced in CI to avoid regressions.',
    ];
  }

  if (result.status === 'skip') {
    return [
      'Criterion is currently not applicable. Re-evaluate this if project architecture changes.',
    ];
  }

  if (result.status === 'unverified') {
    if (result.source === 'gh') {
      return [
        'Authenticate gh CLI (`gh auth login`) and ensure repository access permissions.',
        'Re-run the check after authentication to validate this criterion.',
      ];
    }

    if (result.source === 'ai' || result.source === 'hybrid') {
      return [
        'Configure OpenRouter in local setup (`agentable --setup`).',
        'Re-run the scan to let AI-assisted criteria be fully assessed.',
      ];
    }

    return [
      'Provide missing context/tooling so this criterion can be verified automatically.',
    ];
  }

  return [
    'Add explicit automation for this criterion in code and CI workflows.',
    'Document expected standard and assign an owner for continuous compliance.',
  ];
}

export function getImprovementTips(result: CriterionResult): string[] {
  const specific = TIPS_BY_CRITERION[result.id];
  if (specific && specific.length > 0) {
    return specific;
  }

  return genericTips(result);
}
