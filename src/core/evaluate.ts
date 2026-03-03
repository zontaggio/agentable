import path from 'node:path';
import { CRITERIA } from '../catalog/v1';
import { GitData } from '../collectors/git';
import { readReadmeMtimeMs } from '../collectors/local';
import {
  AiAssessment,
  CriterionConfidence,
  CriterionDefinition,
  CriterionEvidenceDetail,
  CriterionResult,
  EvidenceKind,
  EvidenceStrength,
  EvaluationContext,
  LocalProjectContext,
  ProjectProfile,
} from '../types';
import { fileExists, safeReadText } from '../utils/files';
import { runCommand } from '../utils/command';

interface EvalSignals {
  readmeText: string;
  workflowText: string;
  allTextIndex: string;
  testFiles: string[];
  integrationTestFiles: string[];
  unitTestFiles: string[];
}

const CONSERVATIVE_CRITERIA = new Set<string>([
  'alerting_configured',
  'circuit_breakers',
  'code_quality_metrics',
  'deployment_observability',
  'distributed_tracing',
  'error_tracking_contextualized',
  'health_checks',
  'metrics_collection',
  'profiling_instrumentation',
  'structured_logging',
  'log_scrubbing',
  'pii_handling',
  'privacy_compliance',
  'secrets_management',
  'error_to_insight_pipeline',
  'product_analytics_instrumentation',
  'progressive_rollout',
  'rollback_automation',
]);

function hasAnyDependency(local: LocalProjectContext, keywords: string[]): boolean {
  const deps = {
    ...local.dependencies,
    ...local.devDependencies,
  };

  const keys = Object.keys(deps).map((k) => k.toLowerCase());
  return keywords.some((keyword) => keys.some((dep) => dep.includes(keyword.toLowerCase())));
}

function hasAnyFilePattern(local: LocalProjectContext, patterns: RegExp[]): boolean {
  return local.files.some((file) => patterns.some((pattern) => pattern.test(file)));
}

function hasAnyScript(local: LocalProjectContext, patterns: RegExp[]): boolean {
  const values = Object.values(local.scripts).map((v) => v.toLowerCase());
  return values.some((value) => patterns.some((pattern) => pattern.test(value)));
}

function makeResult(
  criterion: CriterionDefinition,
  status: CriterionResult['status'],
  reason: string,
  evidence: string[] = [],
  evidenceDetails: CriterionEvidenceDetail[] = [],
  confidence?: CriterionConfidence,
  applicable = true,
): CriterionResult {
  const normalizedEvidenceDetails =
    evidenceDetails.length > 0
      ? evidenceDetails
      : (evidence.length > 0 ? evidence : [reason]).map((detail) => ({
          kind: 'text' as const,
          strength: 'weak' as const,
          detail,
        }));

  const finalConfidence = confidence ?? inferConfidence(status, normalizedEvidenceDetails);

  return {
    id: criterion.id,
    category: criterion.category,
    status,
    confidence: finalConfidence,
    reason,
    evidence,
    evidenceDetails: normalizedEvidenceDetails,
    source: criterion.source,
    applicable,
  };
}

function evidenceDetail(kind: EvidenceKind, strength: EvidenceStrength, detail: string): CriterionEvidenceDetail {
  return {
    kind,
    strength,
    detail,
  };
}

function inferConfidence(status: CriterionResult['status'], evidenceDetails: CriterionEvidenceDetail[]): CriterionConfidence {
  if (status === 'unverified') {
    return 'low';
  }
  if (status === 'skip') {
    return 'medium';
  }

  const hasStrong = evidenceDetails.some((item) => item.strength === 'strong');
  if (hasStrong) {
    return 'high';
  }
  const hasMedium = evidenceDetails.some((item) => item.strength === 'medium');
  if (hasMedium) {
    return 'medium';
  }
  return 'low';
}

function applyAiIfPresent(
  criterion: CriterionDefinition,
  aiAssessments: Record<string, AiAssessment>,
): CriterionResult | null {
  const ai = aiAssessments[criterion.id];
  if (!ai) {
    return null;
  }

  return {
    id: criterion.id,
    category: criterion.category,
    status: ai.status,
    confidence: ai.status === 'unverified' ? 'low' : 'medium',
    reason: ai.reason,
    evidence: ai.evidence,
    evidenceDetails: ai.evidence.map((item) => evidenceDetail('ai', 'medium', item)),
    source: 'ai',
    applicable: true,
  };
}

function inferTopLevelSourceFolders(local: LocalProjectContext): number {
  const top = new Set<string>();
  for (const file of local.files) {
    if (!file.startsWith('src/')) {
      continue;
    }

    const parts = file.split('/');
    if (parts.length >= 2 && parts[1]) {
      top.add(parts[1]);
    }
  }
  return top.size;
}

function evaluateApplicabilitySkip(
  criterionId: string,
  profile: ProjectProfile,
  local: LocalProjectContext,
): { skip: boolean; reason?: string } {
  switch (criterionId) {
    case 'n_plus_one_detection':
      return !profile.hasDatabase
        ? { skip: true, reason: 'Skipped - no database or ORM usage detected.' }
        : { skip: false };
    case 'strict_typing':
      return !profile.hasTypedLanguage
        ? { skip: true, reason: 'Skipped - project appears untyped.' }
        : { skip: false };
    case 'dead_feature_flag_detection':
      return !profile.hasFeatureFlags
        ? { skip: true, reason: 'Skipped - feature flag infrastructure not detected.' }
        : { skip: false };
    case 'heavy_dependency_detection':
      return !profile.hasFrontendBundle
        ? { skip: true, reason: 'Skipped - no frontend bundle tooling detected.' }
        : { skip: false };
    case 'monorepo_tooling':
      return !profile.isMonorepo
        ? { skip: true, reason: 'Skipped - single-project repository.' }
        : { skip: false };
    case 'progressive_rollout':
    case 'rollback_automation':
    case 'health_checks':
    case 'dast_scanning':
    case 'profiling_instrumentation':
    case 'api_schema_docs':
      return !profile.isService
        ? { skip: true, reason: 'Skipped - repository appears to be a library, not a deployed service.' }
        : { skip: false };
    case 'version_drift_detection':
      return !profile.isMonorepo
        ? { skip: true, reason: 'Skipped - no multi-package version drift surface.' }
        : { skip: false };
    case 'database_schema':
      return !profile.hasDatabase
        ? { skip: true, reason: 'Skipped - no database usage detected.' }
        : { skip: false };
    case 'devcontainer_runnable':
      return !local.fileSet.has('.devcontainer/devcontainer.json')
        ? { skip: true, reason: 'Skipped - devcontainer not configured.' }
        : { skip: false };
    case 'local_services_setup':
    case 'circuit_breakers':
      return !profile.hasExternalServices
        ? { skip: true, reason: 'Skipped - no external service dependencies detected.' }
        : { skip: false };
    case 'pii_handling':
    case 'privacy_compliance':
      return !profile.hasPiiSignals
        ? { skip: true, reason: 'Skipped - no PII signals detected.' }
        : { skip: false };
    case 'service_flow_documented':
      return !profile.isService
        ? { skip: true, reason: 'Skipped - service flow not required for library projects.' }
        : { skip: false };
    case 'runbooks_documented':
      return !profile.isService
        ? { skip: true, reason: 'Skipped - runbooks usually apply to deployed services.' }
        : { skip: false };
    case 'secrets_management': {
      const hasEnvSurface = hasAnyFilePattern(local, [/^\.env($|\.)/i, /^\.env\.(example|template|sample)$/i]);
      return !profile.hasExternalServices && !hasEnvSurface
        ? { skip: true, reason: 'Skipped - no external services or secret surfaces detected.' }
        : { skip: false };
    }
    default:
      return { skip: false };
  }
}

async function buildSignals(local: LocalProjectContext): Promise<EvalSignals> {
  const readmeText = local.readmePath
    ? await safeReadText(path.join(local.rootPath, local.readmePath))
    : '';

  const workflowTextParts: string[] = [];
  for (const workflow of local.workflowFiles) {
    const text = await safeReadText(path.join(local.rootPath, workflow));
    workflowTextParts.push(text);
  }

  const candidateIndexFiles = local.files.filter((file) =>
    /(readme|docs\/|\.github\/workflows\/|package\.json|tsconfig\.json|pyproject\.toml|docker-compose|dockerfile)/i.test(
      file,
    ),
  );

  const indexParts: string[] = [];
  for (const rel of candidateIndexFiles.slice(0, 250)) {
    const text = await safeReadText(path.join(local.rootPath, rel));
    if (text) {
      indexParts.push(text.slice(0, 5_000));
    }
  }

  const testFiles = local.files.filter((file) => /(test|spec)/i.test(file));
  const integrationTestFiles = local.files.filter((file) =>
    /(integration|acceptance|e2e|it\.|test\/integration|test\/acceptance)/i.test(file),
  );
  const unitTestFiles = local.files.filter((file) => /((^|\/)test\/.+|\.test\.|\.spec\.)/i.test(file));

  return {
    readmeText: readmeText.toLowerCase(),
    workflowText: workflowTextParts.join('\n').toLowerCase(),
    allTextIndex: indexParts.join('\n').toLowerCase(),
    testFiles,
    integrationTestFiles,
    unitTestFiles,
  };
}

function includesAny(text: string, keywords: string[]): boolean {
  const low = text.toLowerCase();
  return keywords.some((keyword) => low.includes(keyword.toLowerCase()));
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const low = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (low.includes(keyword.toLowerCase())) {
      count += 1;
    }
  }
  return count;
}

function parseGitignoreEntries(content: string): Set<string> {
  const entries = new Set<string>();
  for (const raw of content.split('\n')) {
    const line = raw.trim().toLowerCase();
    if (!line || line.startsWith('#') || line.startsWith('!')) {
      continue;
    }

    const normalized = line.startsWith('/') ? line.slice(1) : line;
    entries.add(normalized);
  }
  return entries;
}

function gitignoreEntryMatches(entries: Set<string>, candidate: string): boolean {
  const normalizedCandidate = candidate.toLowerCase().replace(/^\//, '');
  if (entries.has(normalizedCandidate)) {
    return true;
  }

  for (const entry of entries) {
    if (entry === `${normalizedCandidate}/**` || entry === `**/${normalizedCandidate}`) {
      return true;
    }
    if (entry.endsWith('/') && entry.slice(0, -1) === normalizedCandidate) {
      return true;
    }
    if (
      normalizedCandidate.startsWith('.env') &&
      (entry === '.env*' || entry === '.env.*' || entry === '**/.env*' || entry === '**/.env.*')
    ) {
      return true;
    }
  }

  return false;
}

function enforceConservativeDecision(result: CriterionResult): CriterionResult {
  if (!CONSERVATIVE_CRITERIA.has(result.id) || result.status !== 'pass') {
    return result;
  }

  const strongEvidence = result.evidenceDetails.filter((item) => item.strength === 'strong').length;
  const mediumEvidence = result.evidenceDetails.filter((item) => item.strength === 'medium').length;
  if (strongEvidence > 0 || mediumEvidence >= 2) {
    return result;
  }

  return {
    ...result,
    status: 'unverified',
    confidence: 'low',
    reason: `${result.reason} Evidence is not strong enough for a conservative pass decision.`,
    evidenceDetails: [
      ...result.evidenceDetails,
      evidenceDetail(
        'text',
        'weak',
        'Conservative mode requires strong evidence (or multiple corroborating medium signals) for pass.',
      ),
    ],
  };
}

async function evaluateCriterion(
  criterion: CriterionDefinition,
  ctx: EvaluationContext,
  gitData: GitData,
  signals: EvalSignals,
): Promise<CriterionResult> {
  const applicability = evaluateApplicabilitySkip(criterion.id, ctx.profile, ctx.local);
  if (applicability.skip) {
    return makeResult(criterion, 'skip', applicability.reason ?? 'Skipped - not applicable.', [], [], undefined, false);
  }

  if (criterion.aiAssisted) {
    const ai = applyAiIfPresent(criterion, ctx.aiAssessments);
    if (ai) {
      return ai;
    }
  }

  const { local, ghData, profile } = ctx;

  switch (criterion.id) {
    case 'code_modularization': {
      if (local.locEstimate < 3000) {
        return makeResult(
          criterion,
          'skip',
          `Skipped - small repository (~${local.locEstimate} lines), module boundaries less meaningful.`,
          [],
          [],
          undefined,
          false,
        );
      }

      const topFolders = inferTopLevelSourceFolders(local);
      if (topFolders >= 3) {
        return makeResult(criterion, 'pass', `Source tree has ${topFolders} top-level modules under src/.`, [
          `src/* top-level folders: ${topFolders}`,
        ]);
      }

      if (criterion.aiAssisted && Object.keys(ctx.aiAssessments).length === 0) {
        return makeResult(
          criterion,
          'unverified',
          'Needs semantic review; configure OpenRouter in local setup to baseline this criterion.',
          [],
        );
      }

      return makeResult(criterion, 'fail', 'Source tree has limited module separation.', [
        `src/* top-level folders: ${topFolders}`,
      ]);
    }

    case 'cyclomatic_complexity':
      return hasAnyFilePattern(local, [/\.eslintrc/i, /^eslint\.config\./]) &&
        includesAny(signals.allTextIndex, ['complexity', 'sonarjs/cognitive-complexity'])
        ? makeResult(criterion, 'pass', 'Complexity rule detected in lint configuration.')
        : makeResult(criterion, 'fail', 'No complexity analysis rule detected.');

    case 'dead_code_detection':
      return hasAnyDependency(local, ['knip', 'ts-prune', 'unimported', 'depcheck']) ||
        hasAnyScript(local, [/knip|ts-prune|unimported|depcheck/i])
        ? makeResult(criterion, 'pass', 'Dead code detection tooling configured.')
        : makeResult(criterion, 'fail', 'No dead code detection tooling found.');

    case 'duplicate_code_detection':
      return hasAnyDependency(local, ['jscpd', 'duplication']) ||
        hasAnyScript(local, [/jscpd|duplication/i])
        ? makeResult(criterion, 'pass', 'Duplicate code detection tooling configured.')
        : makeResult(criterion, 'fail', 'No duplicate code detection tooling found.');

    case 'formatter':
      return hasAnyFilePattern(local, [/\.prettierrc/, /prettier\.config\./, /^pyproject\.toml$/]) ||
        hasAnyDependency(local, ['prettier', 'black', 'ruff'])
        ? makeResult(criterion, 'pass', 'Formatter configuration detected.')
        : makeResult(criterion, 'fail', 'No formatter configuration files found.');

    case 'large_file_detection':
      return includesAny(signals.workflowText, ['maxkb', 'max-size', 'git lfs', 'size-limit']) ||
        includesAny(signals.allTextIndex, ['filesize', 'size-limit'])
        ? makeResult(criterion, 'pass', 'Large file/bundle size detection found in CI or tooling.')
        : makeResult(criterion, 'fail', 'No large file detection checks found.');

    case 'lint_config':
      return hasAnyFilePattern(local, [/\.eslintrc/, /^eslint\.config\./, /\.ruff\.toml$/, /^pyproject\.toml$/]) ||
        hasAnyDependency(local, ['eslint', 'ruff', 'pylint'])
        ? makeResult(criterion, 'pass', 'Lint configuration detected.')
        : makeResult(criterion, 'fail', 'No lint configuration found.');

    case 'n_plus_one_detection':
      return hasAnyDependency(local, ['django-debug-toolbar', 'bullet', 'nplusone']) ||
        includesAny(signals.allTextIndex, ['n+1', 'n plus one'])
        ? hasAnyDependency(local, ['django-debug-toolbar', 'bullet', 'nplusone'])
          ? makeResult(
              criterion,
              'pass',
              'N+1 detection dependency found.',
              [],
              [evidenceDetail('dependency', 'strong', 'Found dependency commonly used for N+1 query detection.')],
            )
          : makeResult(
              criterion,
              'unverified',
              'Only weak textual references to N+1 query detection were found.',
              [],
              [evidenceDetail('text', 'weak', 'N+1 keywords found in repository text index.')],
            )
        : makeResult(criterion, 'fail', 'No N+1 detection tooling found.');

    case 'naming_consistency':
      return includesAny(signals.allTextIndex, ['naming-convention', 'naming convention'])
        ? makeResult(criterion, 'pass', 'Naming convention rules documented/configured.')
        : makeResult(criterion, 'fail', 'No naming convention rule detected.');

    case 'pre_commit_hooks':
      return local.fileSet.has('.husky/pre-commit') ||
        local.fileSet.has('.pre-commit-config.yaml') ||
        hasAnyDependency(local, ['husky', 'lint-staged', 'pre-commit'])
        ? makeResult(criterion, 'pass', 'Pre-commit hooks configuration detected.')
        : makeResult(criterion, 'fail', 'No pre-commit hook configuration detected.');

    case 'strict_typing': {
      const tsconfig = await safeReadText(path.join(local.rootPath, 'tsconfig.json'));
      const pyproject = await safeReadText(path.join(local.rootPath, 'pyproject.toml'));

      if (includesAny(tsconfig, ['"strict": true', '"strict":true']) || includesAny(pyproject, ['strict = true'])) {
        return makeResult(criterion, 'pass', 'Strict typing mode configured.');
      }

      return makeResult(criterion, 'fail', 'No strict typing mode detected in typed project.');
    }

    case 'tech_debt_tracking':
      return hasAnyDependency(local, ['sonarqube', 'sonar-scanner']) ||
        hasAnyScript(local, [/todo|fixme|sonar/i]) ||
        includesAny(signals.workflowText, ['todo', 'fixme', 'sonar'])
        ? makeResult(criterion, 'pass', 'Tech debt tracking signals detected.')
        : makeResult(criterion, 'fail', 'No tech debt tracking automation found.');

    case 'type_check':
      return hasAnyScript(local, [/tsc\s+--noemit|npm\s+run\s+typecheck|mypy|pyright|typecheck/i]) ||
        hasAnyDependency(local, ['typescript', 'mypy', 'pyright'])
        ? makeResult(criterion, 'pass', 'Type checking command/tooling detected.')
        : makeResult(criterion, 'fail', 'No type-checking setup found.');

    case 'agentic_development': {
      const agentsSignals =
        local.fileSet.has('AGENTS.md') ||
        hasAnyFilePattern(local, [/\.claude\/skills\//, /\.skills\//, /\.factory\//]);

      if (agentsSignals) {
        return makeResult(criterion, 'pass', 'Repository contains agent-development artifacts.');
      }

      if (gitData.isGitRepo) {
        const logCheck = await runCommand('git', ['log', '--format=%B', '-n', '25'], local.rootPath);
        if (logCheck.ok && includesAny(logCheck.stdout, ['co-authored-by', 'copilot', 'claude', 'chatgpt', 'ai'])) {
          return makeResult(criterion, 'pass', 'Recent git history indicates agent-assisted contributions.');
        }
      }

      return makeResult(criterion, 'fail', 'No strong evidence of agentic development workflow.');
    }

    case 'automated_pr_review':
      if (includesAny(signals.workflowText, ['reviewdog', 'danger', 'coderabbit', 'pull_request_review'])) {
        return makeResult(criterion, 'pass', 'Automated PR review tooling found in workflows.');
      }
      return ghData.available && ghData.authenticated
        ? makeResult(criterion, 'fail', 'No automated PR review tooling detected.')
        : makeResult(
            criterion,
            'unverified',
            'Unable to verify automated PR review without authenticated gh CLI.',
          );

    case 'build_cmd_doc':
      return includesAny(signals.readmeText, ['npm run build', 'pnpm build', 'yarn build', 'make build'])
        ? makeResult(criterion, 'pass', 'Build command documented in README.')
        : makeResult(criterion, 'fail', 'README does not document a build command.');

    case 'build_performance_tracking':
      return includesAny(signals.workflowText, ['turbo', 'cache', 'build time', 'timing']) ||
        includesAny(signals.allTextIndex, ['size-limit', 'bundle-analyzer', 'speed measure'])
        ? makeResult(criterion, 'pass', 'Build performance monitoring/caching signals detected.')
        : makeResult(criterion, 'fail', 'No build performance tracking found.');

    case 'dead_feature_flag_detection':
      return hasAnyScript(local, [/stale.*flag|dead.*flag|cleanup.*flag/i])
        ? makeResult(criterion, 'pass', 'Dead flag detection/cleanup script detected.')
        : makeResult(criterion, 'fail', 'No dead feature flag detection configured.');

    case 'deployment_frequency':
      if (!gitData.isGitRepo) {
        return makeResult(criterion, 'unverified', 'Cannot infer deployment frequency outside a git repository.');
      }
      return gitData.releaseTagsInLast90Days >= 2 || gitData.commitCountLast30Days >= 20
        ? makeResult(
            criterion,
            'pass',
            `Recent activity detected (${gitData.releaseTagsInLast90Days} tags in 90d, ${gitData.commitCountLast30Days} commits in 30d).`,
          )
        : makeResult(
            criterion,
            'fail',
            `Low recent release activity (${gitData.releaseTagsInLast90Days} tags in 90d, ${gitData.commitCountLast30Days} commits in 30d).`,
          );

    case 'deps_pinned':
      return hasAnyFilePattern(local, [/package-lock\.json$/, /yarn\.lock$/, /pnpm-lock\.yaml$/, /poetry\.lock$/])
        ? makeResult(criterion, 'pass', 'Lockfile detected for pinned dependencies.')
        : makeResult(criterion, 'fail', 'No dependency lockfile found.');

    case 'fast_ci_feedback': {
      if (local.workflowFiles.length === 0) {
        return makeResult(criterion, 'fail', 'No CI workflow detected.');
      }
      const hasTimeoutSignal = includesAny(signals.workflowText, ['timeout-minutes: 10', 'timeout-minutes: 5']);
      const hasFastSignal = includesAny(signals.workflowText, ['actions/cache', 'pnpm/action-setup', 'turbo']);
      return hasTimeoutSignal || hasFastSignal
        ? makeResult(criterion, 'pass', 'CI appears optimized for quick feedback.')
        : makeResult(criterion, 'fail', 'No clear fast-feedback CI optimization detected.');
    }

    case 'feature_flag_infrastructure':
      return hasAnyDependency(local, ['launchdarkly', 'statsig', 'unleash', 'flagsmith'])
        ? makeResult(criterion, 'pass', 'Feature flag infrastructure dependency detected.')
        : makeResult(criterion, 'fail', 'No feature flag infrastructure detected.');

    case 'heavy_dependency_detection':
      return hasAnyDependency(local, ['size-limit', 'bundlesize', 'webpack-bundle-analyzer']) ||
        includesAny(signals.allTextIndex, ['bundlesize', 'size-limit'])
        ? makeResult(criterion, 'pass', 'Heavy dependency detection configured.')
        : makeResult(criterion, 'fail', 'No heavy dependency detection tooling found.');

    case 'monorepo_tooling':
      return hasAnyDependency(local, ['turbo', 'nx', 'lerna', 'lage']) ||
        hasAnyFilePattern(local, [/^turbo\.json$/, /^nx\.json$/, /^lerna\.json$/])
        ? makeResult(criterion, 'pass', 'Monorepo tooling detected.')
        : makeResult(criterion, 'fail', 'Monorepo detected but tooling not found.');

    case 'progressive_rollout':
      return includesAny(signals.allTextIndex, ['canary', 'progressive rollout', 'blue-green', 'feature flag rollout'])
        ? makeResult(
            criterion,
            'unverified',
            'Text-only rollout references were found; explicit rollout automation evidence is missing.',
            [],
            [evidenceDetail('text', 'weak', 'Canary/progressive rollout keywords found in repository text index.')],
          )
        : makeResult(criterion, 'fail', 'No progressive rollout strategy detected.');

    case 'release_automation':
      return includesAny(signals.workflowText, ['semantic-release', 'changesets', 'release please', 'npm publish'])
        ? makeResult(criterion, 'pass', 'Release automation signals found in CI workflows.')
        : makeResult(criterion, 'fail', 'No release automation workflow detected.');

    case 'release_notes_automation':
      return hasAnyDependency(local, ['changesets', 'semantic-release', 'standard-version']) ||
        includesAny(signals.workflowText, ['changelog', 'release notes', 'release-please'])
        ? makeResult(criterion, 'pass', 'Release notes automation detected.')
        : makeResult(criterion, 'fail', 'No release notes automation detected.');

    case 'rollback_automation':
      return includesAny(signals.allTextIndex, ['rollback', 'helm rollback', 'revert deployment'])
        ? makeResult(
            criterion,
            'unverified',
            'Text-only rollback references were found; explicit rollback automation evidence is missing.',
            [],
            [evidenceDetail('text', 'weak', 'Rollback keywords found in repository text index.')],
          )
        : makeResult(criterion, 'fail', 'No rollback automation detected.');

    case 'single_command_setup':
      return includesAny(signals.readmeText, ['npm install', 'pnpm install', 'yarn install', 'make setup'])
        ? makeResult(criterion, 'pass', 'Single-command setup instructions found.')
        : makeResult(criterion, 'fail', 'No single-command setup documentation found.');

    case 'unused_dependencies_detection':
      return hasAnyDependency(local, ['depcheck', 'knip', 'npm-check']) ||
        hasAnyScript(local, [/depcheck|knip|npm-check/i])
        ? makeResult(criterion, 'pass', 'Unused dependency detection tooling found.')
        : makeResult(criterion, 'fail', 'No unused dependency detection tooling found.');

    case 'vcs_cli_tools': {
      const ghVersion = await runCommand('gh', ['--version'], local.rootPath);
      return ghVersion.ok
        ? makeResult(criterion, 'pass', 'gh CLI available in execution environment.')
        : makeResult(criterion, 'fail', 'gh CLI not available in environment.');
    }

    case 'version_drift_detection':
      return includesAny(signals.allTextIndex, ['syncpack', 'version drift', 'manypkg']) ||
        hasAnyDependency(local, ['syncpack', '@manypkg'])
        ? makeResult(criterion, 'pass', 'Version drift detection tooling found.')
        : makeResult(criterion, 'fail', 'No version drift detection tooling found.');

    case 'flaky_test_detection':
      return includesAny(signals.allTextIndex, ['flaky', 'retry', 'quarantine']) ||
        hasAnyScript(local, [/retry|flaky/i])
        ? makeResult(criterion, 'pass', 'Flaky test detection/retry mechanisms found.')
        : makeResult(criterion, 'fail', 'No flaky test detection strategy detected.');

    case 'integration_tests_exist':
      return signals.integrationTestFiles.length > 0
        ? makeResult(criterion, 'pass', `Integration tests detected (${signals.integrationTestFiles.length} files).`)
        : makeResult(criterion, 'fail', 'No integration test files detected.');

    case 'test_coverage_thresholds':
      return includesAny(signals.allTextIndex, ['coveragethreshold', 'coverage-threshold', 'coveralls', 'codecov']) ||
        hasAnyScript(local, [/coverage/i])
        ? makeResult(criterion, 'pass', 'Coverage threshold/tracking signals detected.')
        : makeResult(criterion, 'fail', 'No coverage threshold configuration found.');

    case 'test_isolation':
      return hasAnyScript(local, [/--parallel|--shard|maxworkers|--runinband=false|pytest -n/i]) ||
        includesAny(signals.allTextIndex, ['test.concurrent', 'parallel'])
        ? makeResult(criterion, 'pass', 'Test isolation/parallelization configuration found.')
        : makeResult(criterion, 'fail', 'No test isolation or parallelization signals found.');

    case 'test_naming_conventions':
      return signals.testFiles.some((f) => /\.test\.|\.spec\.|^test\//i.test(f))
        ? makeResult(criterion, 'pass', 'Test naming conventions appear consistent.')
        : makeResult(criterion, 'fail', 'No standard test naming convention detected.');

    case 'test_performance_tracking':
      return includesAny(signals.allTextIndex, ['test timing', 'slow test', 'benchmark']) ||
        hasAnyScript(local, [/--reporter|--durations/i])
        ? makeResult(criterion, 'pass', 'Test performance tracking hints found.')
        : makeResult(criterion, 'fail', 'No test performance tracking configuration detected.');

    case 'unit_tests_exist':
      return signals.unitTestFiles.length > 0
        ? makeResult(criterion, 'pass', `Unit test files detected (${signals.unitTestFiles.length}).`)
        : makeResult(criterion, 'fail', 'No unit test files detected.');

    case 'unit_tests_runnable':
      return typeof local.scripts.test === 'string' && local.scripts.test.trim().length > 0
        ? makeResult(criterion, 'pass', 'Test script available in package scripts.')
        : makeResult(criterion, 'fail', 'No runnable test script found in package scripts.');

    case 'agents_md':
      return local.fileSet.has('AGENTS.md')
        ? makeResult(criterion, 'pass', 'AGENTS.md exists at repository root.')
        : makeResult(criterion, 'fail', 'AGENTS.md not found at repository root.');

    case 'agents_md_validation':
      return local.fileSet.has('AGENTS.md') && includesAny(signals.workflowText, ['agents.md', 'agent readiness'])
        ? makeResult(criterion, 'pass', 'AGENTS.md validation appears in CI workflows.')
        : makeResult(
            criterion,
            local.fileSet.has('AGENTS.md') ? 'fail' : 'skip',
            local.fileSet.has('AGENTS.md')
              ? 'AGENTS.md exists but no validation automation detected.'
              : 'Skipped - AGENTS.md is not present.',
            [],
            [],
            undefined,
            local.fileSet.has('AGENTS.md'),
          );

    case 'api_schema_docs':
      return hasAnyFilePattern(local, [/openapi\.(ya?ml|json)$/i, /swagger\.(ya?ml|json)$/i, /docs\/api\//i])
        ? makeResult(criterion, 'pass', 'API schema documentation files detected.')
        : makeResult(criterion, 'fail', 'No API schema documentation detected.');

    case 'automated_doc_generation':
      return hasAnyDependency(local, ['typedoc', 'docusaurus', 'mkdocs', 'sphinx']) ||
        hasAnyScript(local, [/typedoc|docs:build|mkdocs|sphinx/i]) ||
        includesAny(signals.workflowText, ['typedoc', 'docs'])
        ? makeResult(criterion, 'pass', 'Automated doc generation tooling detected.')
        : makeResult(criterion, 'fail', 'No automated documentation generation detected.');

    case 'documentation_freshness': {
      const mtimeMs = await readReadmeMtimeMs(local);
      if (!mtimeMs) {
        return makeResult(criterion, 'fail', 'README not found to assess freshness.');
      }
      const ageDays = Math.floor((Date.now() - mtimeMs) / (1000 * 60 * 60 * 24));
      return ageDays <= 180
        ? makeResult(criterion, 'pass', `README updated within ${ageDays} days.`)
        : makeResult(criterion, 'fail', `README appears stale (${ageDays} days since update).`);
    }

    case 'readme':
      return local.readmePath
        ? makeResult(criterion, 'pass', `README detected at ${local.readmePath}.`)
        : makeResult(criterion, 'fail', 'README not found.');

    case 'service_flow_documented': {
      if (hasAnyFilePattern(local, [/architecture/i, /adr\//i, /diagram/i, /service-flow/i])) {
        return makeResult(criterion, 'pass', 'Architecture/service flow documentation files detected.');
      }

      if (criterion.aiAssisted) {
        return makeResult(
          criterion,
          'unverified',
          'Service flow documentation quality requires AI semantic assessment (no baseline found).',
        );
      }

      return makeResult(criterion, 'fail', 'No service flow documentation signals found.');
    }

    case 'skills':
      return hasAnyFilePattern(local, [/^\.factory\/skills\//, /^\.skills\//, /^\.claude\/skills\//])
        ? makeResult(criterion, 'pass', 'Skills directory detected.')
        : makeResult(criterion, 'fail', 'No recognized skills directory found.');

    case 'database_schema':
      return hasAnyFilePattern(local, [/schema\.prisma$/i, /migrations\//i, /db\/schema/i])
        ? makeResult(criterion, 'pass', 'Database schema/migrations detected.')
        : makeResult(criterion, 'fail', 'No database schema or migrations detected.');

    case 'devcontainer':
      return local.fileSet.has('.devcontainer/devcontainer.json')
        ? makeResult(criterion, 'pass', 'Devcontainer configuration file detected.')
        : makeResult(criterion, 'fail', 'Devcontainer configuration not found.');

    case 'devcontainer_runnable': {
      const configPath = path.join(local.rootPath, '.devcontainer/devcontainer.json');
      const content = await safeReadText(configPath);
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        const hasRuntime =
          typeof parsed.image === 'string' ||
          typeof parsed.dockerFile === 'string' ||
          typeof parsed.build === 'object';
        return hasRuntime
          ? makeResult(criterion, 'pass', 'Devcontainer has runtime definition and appears runnable.')
          : makeResult(criterion, 'fail', 'Devcontainer exists but missing image/dockerFile/build settings.');
      } catch {
        return makeResult(criterion, 'fail', 'Unable to parse devcontainer.json.');
      }
    }

    case 'env_template':
      return hasAnyFilePattern(local, [/^\.env\.example$/, /^\.env\.template$/, /^\.env\.sample$/])
        ? makeResult(criterion, 'pass', 'Environment template file detected.')
        : makeResult(criterion, 'fail', 'No environment template file found.');

    case 'local_services_setup':
      return includesAny(signals.readmeText, ['docker compose up', 'local services', 'start dependencies'])
        ? makeResult(criterion, 'pass', 'Local services setup instructions found.')
        : makeResult(criterion, 'fail', 'No local services setup instructions detected.');

    case 'alerting_configured':
      if (hasAnyDependency(local, ['pagerduty', 'opsgenie', 'alertmanager'])) {
        return makeResult(
          criterion,
          'pass',
          'Alerting integration dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found alerting dependency (PagerDuty/Opsgenie/Alertmanager).')],
        );
      }
      if (countKeywordMatches(signals.workflowText, ['pagerduty', 'opsgenie', 'alertmanager', 'alerts']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Alerting integration signals found in CI/workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow mentions alerting integration/alerts path.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['pagerduty', 'opsgenie', 'alerts']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak text mentions for alerting were found; explicit integration evidence is missing.',
          [],
          [evidenceDetail('text', 'weak', 'Generic alerting keywords found in repository text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No alerting configuration detected.');

    case 'circuit_breakers':
      if (hasAnyDependency(local, ['opossum', 'resilience4j', 'hystrix'])) {
        return makeResult(
          criterion,
          'pass',
          'Circuit breaker dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found circuit breaker library dependency.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['circuit breaker']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual references to circuit breaker patterns were found.',
          [],
          [evidenceDetail('text', 'weak', 'Repository text includes "circuit breaker" mention.')],
        );
      }
      return makeResult(criterion, 'fail', 'No circuit breaker configuration detected.');

    case 'code_quality_metrics':
      if (hasAnyDependency(local, ['coveralls', 'codecov', 'sonar'])) {
        return makeResult(
          criterion,
          'pass',
          'Code quality metrics dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found code quality metrics dependency (Codecov/Coveralls/Sonar).')],
        );
      }
      if (countKeywordMatches(signals.workflowText, ['codeql', 'coveralls', 'codecov', 'sonar']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Code quality metrics signals detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow contains CodeQL/Codecov/Coveralls/Sonar references.')],
        );
      }
      return makeResult(criterion, 'fail', 'No code quality metrics tooling detected.');

    case 'deployment_observability':
      if (countKeywordMatches(signals.workflowText, ['deploy notify', 'release monitor']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Deployment observability signals detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow references deploy notification/release monitoring.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['deployment dashboard', 'deploy notify', 'release monitor']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to deployment observability were found.',
          [],
          [evidenceDetail('text', 'weak', 'Repository text includes deploy dashboard/notify keywords.')],
        );
      }
      return makeResult(criterion, 'fail', 'No deployment observability signals detected.');

    case 'distributed_tracing':
      if (hasAnyDependency(local, ['opentelemetry', 'jaeger', 'zipkin'])) {
        return makeResult(
          criterion,
          'pass',
          'Distributed tracing dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found OpenTelemetry/Jaeger/Zipkin dependency.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['traceid', 'request-id propagation']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to trace propagation were found.',
          [],
          [evidenceDetail('text', 'weak', 'Trace propagation keywords detected in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No distributed tracing instrumentation detected.');

    case 'error_tracking_contextualized':
      if (hasAnyDependency(local, ['sentry', 'bugsnag', 'rollbar'])) {
        return makeResult(
          criterion,
          'pass',
          'Error tracking dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found Sentry/Bugsnag/Rollbar dependency.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['sentry', 'bugsnag', 'rollbar']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to error tracking were found.',
          [],
          [evidenceDetail('text', 'weak', 'Sentry/Bugsnag/Rollbar mentioned in repository text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No contextualized error tracking tooling detected.');

    case 'health_checks':
      if (hasAnyFilePattern(local, [/health/i, /ready/i, /live/i])) {
        return makeResult(
          criterion,
          'pass',
          'Health check files/routes detected.',
          [],
          [evidenceDetail('file', 'strong', 'Found files/routes matching health/ready/live patterns.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['/health', 'healthcheck']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual mentions of health checks were found.',
          [],
          [evidenceDetail('text', 'weak', 'Healthcheck keywords found in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No health checks detected.');

    case 'metrics_collection':
      if (hasAnyDependency(local, ['prom-client', 'prometheus', 'datadog', 'statsd', 'opentelemetry'])) {
        return makeResult(
          criterion,
          'pass',
          'Metrics/telemetry dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found metrics/telemetry dependency.')],
        );
      }
      if (countKeywordMatches(signals.workflowText, ['prometheus', 'datadog', 'statsd', 'telemetry']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Metrics/telemetry signals detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow references metrics/telemetry systems.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['metrics', 'telemetry']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only generic metrics/telemetry mentions were found; instrumentation evidence is missing.',
          [],
          [evidenceDetail('text', 'weak', 'Generic metrics/telemetry keywords present in repository text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No metrics collection instrumentation detected.');

    case 'profiling_instrumentation':
      if (hasAnyDependency(local, ['pyroscope', '0x'])) {
        return makeResult(
          criterion,
          'pass',
          'Profiling dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found profiling dependency (pyroscope/0x).')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['profiling', 'pyroscope', '0x']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to profiling were found.',
          [],
          [evidenceDetail('text', 'weak', 'Profiling-related keywords present in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No profiling instrumentation detected.');

    case 'runbooks_documented': {
      if (hasAnyFilePattern(local, [/runbook/i, /playbook/i, /oncall/i])) {
        return makeResult(criterion, 'pass', 'Runbook/playbook documents detected.');
      }

      if (criterion.aiAssisted) {
        return makeResult(
          criterion,
          'unverified',
          'Runbook quality requires AI semantic assessment (no baseline found).',
        );
      }

      return makeResult(criterion, 'fail', 'No runbook documentation detected.');
    }

    case 'structured_logging':
      return hasAnyDependency(local, ['pino', 'winston', 'bunyan', 'debug'])
        ? makeResult(
            criterion,
            'pass',
            'Structured logging dependency detected.',
            [],
            [evidenceDetail('dependency', 'strong', 'Found structured logging dependency (pino/winston/bunyan/debug).')],
          )
        : makeResult(criterion, 'fail', 'No structured logging tooling detected.');

    case 'automated_security_review':
      return includesAny(signals.workflowText, ['codeql', 'snyk', 'semgrep'])
        ? makeResult(
            criterion,
            'pass',
            'Automated security review workflow detected.',
            [],
            [evidenceDetail('workflow', 'medium', 'Workflow includes CodeQL/Snyk/Semgrep references.')],
          )
        : makeResult(criterion, 'fail', 'No automated security review workflow detected.');

    case 'branch_protection':
      if (!ghData.available || !ghData.authenticated) {
        return makeResult(criterion, 'unverified', 'Requires authenticated gh CLI to verify branch protection.');
      }
      if (ghData.branchProtectionEnabled === undefined) {
        return makeResult(criterion, 'unverified', 'Branch protection status unavailable (permissions may be limited).');
      }
      return ghData.branchProtectionEnabled
        ? makeResult(criterion, 'pass', 'Branch protection is enabled.')
        : makeResult(criterion, 'fail', 'Branch protection not detected on default branch.');

    case 'codeowners':
      return local.fileSet.has('CODEOWNERS') || local.fileSet.has('.github/CODEOWNERS')
        ? makeResult(criterion, 'pass', 'CODEOWNERS file detected.')
        : makeResult(criterion, 'fail', 'CODEOWNERS file not found.');

    case 'dast_scanning':
      return includesAny(signals.workflowText, ['zap', 'dast', 'dynamic application security'])
        ? makeResult(criterion, 'pass', 'DAST workflow detected.')
        : makeResult(criterion, 'fail', 'No DAST scanning workflow detected.');

    case 'dependency_update_automation':
      return local.fileSet.has('.github/dependabot.yml') ||
        local.fileSet.has('.github/dependabot.yaml') ||
        local.fileSet.has('.github/renovate.json') ||
        local.fileSet.has('renovate.json')
        ? makeResult(
            criterion,
            'pass',
            'Dependency update automation configuration detected.',
            [],
            [evidenceDetail('file', 'strong', 'Dependabot/Renovate configuration file detected.')],
          )
        : makeResult(criterion, 'fail', 'No Dependabot/Renovate configuration found.');

    case 'gitignore_comprehensive': {
      if (!local.fileSet.has('.gitignore')) {
        return makeResult(criterion, 'fail', '.gitignore file is missing.');
      }

      const entries = parseGitignoreEntries(local.gitignoreContent);
      const hasEnvIgnore =
        gitignoreEntryMatches(entries, '.env') ||
        gitignoreEntryMatches(entries, '.env.local') ||
        gitignoreEntryMatches(entries, '.env.production') ||
        gitignoreEntryMatches(entries, '.env.development');

      if (!hasEnvIgnore) {
        return makeResult(
          criterion,
          'fail',
          '.gitignore exists but does not ignore common environment secret files (for example `.env` or `.env*`).',
          [],
          [evidenceDetail('file', 'strong', '.gitignore found without explicit environment secret ignore entries.')],
        );
      }

      const recommendedLocal = ['.vscode', '.idea', '.ds_store'];
      const missingRecommended = recommendedLocal.filter((entry) => !gitignoreEntryMatches(entries, entry));
      if (missingRecommended.length === 0) {
        return makeResult(
          criterion,
          'pass',
          '.gitignore includes environment-secret and common local artifact ignores.',
          [],
          [evidenceDetail('file', 'strong', '.gitignore includes `.env` and common local artifact ignore entries.')],
        );
      }

      return makeResult(
        criterion,
        'pass',
        `.gitignore covers environment secrets. Optional local entries missing: ${missingRecommended.join(', ')}.`,
        [],
        [evidenceDetail('file', 'medium', '.gitignore includes secret-file ignores but not all optional local artifacts.')],
      );
    }

    case 'log_scrubbing':
      if (countKeywordMatches(signals.workflowText, ['redact', 'scrub', 'mask', 'sanitize']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Log scrubbing/redaction checks detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow references log scrubbing/redaction checks.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['redact', 'scrub', 'mask', 'sanitize']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to log scrubbing were found.',
          [],
          [evidenceDetail('text', 'weak', 'Redaction/scrubbing keywords present in repository text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No log scrubbing mechanism detected.');

    case 'pii_handling':
      if (countKeywordMatches(signals.workflowText, ['pii', 'data classification', 'personal data']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'PII handling controls referenced in workflow/policy automation.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow references PII handling checks/policies.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['pii', 'data classification', 'personal data']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual references to PII handling were found.',
          [],
          [evidenceDetail('text', 'weak', 'PII-related keywords present in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No explicit PII handling controls detected.');

    case 'privacy_compliance':
      if (countKeywordMatches(signals.workflowText, ['gdpr', 'ccpa', 'privacy policy']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Privacy compliance checks/policies detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow references GDPR/CCPA/privacy policy checks.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['gdpr', 'ccpa', 'privacy policy']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only textual privacy-compliance references were found.',
          [],
          [evidenceDetail('text', 'weak', 'GDPR/CCPA/privacy policy keywords present in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No privacy compliance references detected.');

    case 'secret_scanning':
      if (!ghData.available || !ghData.authenticated) {
        return makeResult(criterion, 'unverified', 'Requires authenticated gh CLI to verify secret scanning.');
      }
      if (ghData.secretScanningEnabled === undefined) {
        return makeResult(criterion, 'unverified', 'Secret scanning status unavailable (permissions may be limited).');
      }
      return ghData.secretScanningEnabled
        ? makeResult(criterion, 'pass', 'GitHub secret scanning is enabled.')
        : makeResult(criterion, 'fail', 'Secret scanning not detected as enabled.');

    case 'secrets_management':
      return hasAnyDependency(local, ['aws-secrets-manager', 'vault', 'doppler', 'sops']) ||
        includesAny(signals.allTextIndex, ['secret manager', 'vault', 'kms'])
        ? hasAnyDependency(local, ['aws-secrets-manager', 'vault', 'doppler', 'sops'])
          ? makeResult(
              criterion,
              'pass',
              'Secrets management dependency detected.',
              [],
              [evidenceDetail('dependency', 'strong', 'Found dependency for secrets management integration.')],
            )
          : makeResult(
              criterion,
              'unverified',
              'Only weak textual references to secrets management were found.',
              [],
              [evidenceDetail('text', 'weak', 'Secret manager/vault/KMS keywords found in text index.')],
            )
        : makeResult(criterion, 'fail', 'No secrets management integration detected.');

    case 'backlog_health': {
      if (!ghData.available || !ghData.authenticated || !ghData.issueStats) {
        return makeResult(criterion, 'unverified', 'Requires authenticated gh CLI and issue access to evaluate backlog health.');
      }

      const stats = ghData.issueStats;
      if (stats.total === 0) {
        return makeResult(criterion, 'unverified', 'No issues available to evaluate backlog health.');
      }

      const goodRatio = stats.goodTitleAndLabels / stats.total;
      const oldIssueRatio = stats.oldOpenOver365Days / stats.total;
      const pass = goodRatio >= 0.7 && oldIssueRatio <= 0.2;

      return pass
        ? makeResult(
            criterion,
            'pass',
            `Backlog healthy (${Math.round(goodRatio * 100)}% good title+label, ${stats.oldOpenOver365Days} old open issues).`,
          )
        : makeResult(
            criterion,
            'fail',
            `Backlog needs cleanup (${Math.round(goodRatio * 100)}% good title+label, ${stats.oldOpenOver365Days} old open issues).`,
          );
    }

    case 'issue_labeling_system':
      if (ghData.labelsCount && ghData.labelsCount >= 5) {
        return makeResult(criterion, 'pass', `Repository has ${ghData.labelsCount} labels configured.`);
      }
      if (ghData.available && ghData.authenticated && ghData.labelsCount === undefined) {
        return makeResult(
          criterion,
          'unverified',
          'Issue label metadata is unavailable (likely permission-limited).',
        );
      }
      return hasAnyFilePattern(local, [/\.github\/labels\.ya?ml$/, /\.github\/labeler\.ya?ml$/])
        ? makeResult(criterion, 'pass', 'Labeling automation/configuration detected in repository.')
        : ghData.available && ghData.authenticated
          ? makeResult(criterion, 'fail', 'No strong issue labeling system signals detected.')
          : makeResult(criterion, 'unverified', 'Unable to verify issue labels without authenticated gh CLI.');

    case 'issue_templates':
      return hasAnyFilePattern(local, [/^\.github\/ISSUE_TEMPLATE\//, /^\.github\/issue_template\.md$/i])
        ? makeResult(criterion, 'pass', 'Issue template(s) detected.')
        : makeResult(criterion, 'fail', 'No issue templates found.');

    case 'pr_templates':
      return hasAnyFilePattern(local, [/^\.github\/pull_request_template\.md$/i, /^pull_request_template\.md$/i])
        ? makeResult(criterion, 'pass', 'Pull request template detected.')
        : makeResult(criterion, 'fail', 'No pull request template found.');

    case 'error_to_insight_pipeline':
      if (countKeywordMatches(signals.workflowText, ['sentry', 'github issue', 'error automation', 'incident']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Error-to-insight automation signals detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow links errors/incidents to issue automation.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['sentry', 'github issue', 'error automation', 'incident to issue']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only weak textual references to error-to-insight flows were found.',
          [],
          [evidenceDetail('text', 'weak', 'Error-to-insight keywords present in text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No error-to-insight pipeline detected.');

    case 'product_analytics_instrumentation':
      if (hasAnyDependency(local, ['mixpanel', 'amplitude', 'posthog', 'segment', 'plausible'])) {
        return makeResult(
          criterion,
          'pass',
          'Product analytics dependency detected.',
          [],
          [evidenceDetail('dependency', 'strong', 'Found product analytics dependency (Mixpanel/Amplitude/PostHog/Segment/Plausible).')],
        );
      }
      if (countKeywordMatches(signals.workflowText, ['mixpanel', 'amplitude', 'posthog', 'segment', 'plausible']) > 0) {
        return makeResult(
          criterion,
          'pass',
          'Product analytics signals detected in workflows.',
          [],
          [evidenceDetail('workflow', 'medium', 'Workflow references product analytics tooling.')],
        );
      }
      if (countKeywordMatches(signals.allTextIndex, ['mixpanel', 'amplitude', 'posthog', 'analytics']) > 0) {
        return makeResult(
          criterion,
          'unverified',
          'Only generic analytics text mentions were found; instrumentation evidence is missing.',
          [],
          [evidenceDetail('text', 'weak', 'Generic analytics keywords present in repository text index.')],
        );
      }
      return makeResult(criterion, 'fail', 'No product analytics instrumentation detected.');

    default:
      return makeResult(criterion, 'unverified', 'Criterion evaluator not implemented yet.');
  }
}

export async function evaluateAllCriteria(
  ctx: EvaluationContext,
  gitData: GitData,
): Promise<CriterionResult[]> {
  const signals = await buildSignals(ctx.local);

  const results: CriterionResult[] = [];

  for (const criterion of CRITERIA) {
    const result = enforceConservativeDecision(await evaluateCriterion(criterion, ctx, gitData, signals));
    results.push(result);
  }

  // Attach special warning when gh had errors and criteria are unverified.
  if (ctx.ghData.errors.length > 0) {
    for (const result of results) {
      if (
        (result.id === 'branch_protection' ||
          result.id === 'secret_scanning' ||
          result.id === 'backlog_health' ||
          result.id === 'issue_labeling_system') &&
        result.status === 'unverified'
      ) {
        result.evidence.push(...ctx.ghData.errors.slice(0, 2));
      }
    }
  }

  if (await fileExists(path.join(ctx.local.rootPath, '.git'))) {
    return results;
  }

  // If not a git repo, keep GH-only checks explicitly unverified.
  return results.map((result) => {
    if (
      ['branch_protection', 'secret_scanning', 'backlog_health', 'issue_labeling_system', 'automated_pr_review'].includes(
        result.id,
      ) &&
      result.status === 'fail'
    ) {
      return {
        ...result,
        status: 'unverified' as const,
        reason: 'GitHub metadata unavailable outside a git/github context.',
      };
    }

    return result;
  });
}
