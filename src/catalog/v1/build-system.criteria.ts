import { CriterionDefinition } from '../../types';

export const BUILD_SYSTEM_CRITERIA: CriterionDefinition[] = [
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
];
