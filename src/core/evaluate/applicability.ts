import { LocalProjectContext, ProjectProfile } from '../../types';
import { hasAnyFilePattern } from './helpers';

export function evaluateApplicabilitySkip(
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
        ? {
            skip: true,
            reason: 'Skipped - repository appears to be a library, not a deployed service.',
          }
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
        ? {
            skip: true,
            reason: 'Skipped - no external services or secret surfaces detected.',
          }
        : { skip: false };
    }
    default:
      return { skip: false };
  }
}
