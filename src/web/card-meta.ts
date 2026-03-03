import { CardBadge } from '../types';

interface CardMeta {
  badge: CardBadge;
  maxPoints: number;
  name: string;
}

const ADVANCED_IDS = new Set([
  'code_modularization',
  'cyclomatic_complexity',
  'n_plus_one_detection',
  'distributed_tracing',
  'circuit_breakers',
  'pii_handling',
  'privacy_compliance',
  'branch_protection',
  'secret_scanning',
  'progressive_rollout',
  'rollback_automation',
  'runbooks_documented',
  'service_flow_documented',
]);

const BASIC_IDS = new Set([
  'readme',
  'agents_md',
  'lint_config',
  'formatter',
  'unit_tests_exist',
  'unit_tests_runnable',
  'integration_tests_exist',
  'deps_pinned',
  'single_command_setup',
  'vcs_cli_tools',
  'codeowners',
  'issue_templates',
  'pr_templates',
  'devcontainer',
  'env_template',
]);

const OVERRIDE_NAMES: Record<string, string> = {
  n_plus_one_detection: 'N+1 Query Detection',
  vcs_cli_tools: 'VCS CLI Tools',
  api_schema_docs: 'API Schema Docs',
  automated_pr_review: 'Automated PR Review',
  agents_md: 'AGENTS.md',
  agents_md_validation: 'AGENTS.md Validation',
  devcontainer: 'Devcontainer',
  devcontainer_runnable: 'Devcontainer Runnable',
  pii_handling: 'PII Handling',
};

function toTitleCase(id: string): string {
  if (OVERRIDE_NAMES[id]) {
    return OVERRIDE_NAMES[id];
  }

  return id
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

export function getCardMeta(criterionId: string): CardMeta {
  if (ADVANCED_IDS.has(criterionId)) {
    return {
      badge: 'ADVANCED',
      maxPoints: 2,
      name: toTitleCase(criterionId),
    };
  }

  if (BASIC_IDS.has(criterionId)) {
    return {
      badge: 'BASIC',
      maxPoints: 1,
      name: toTitleCase(criterionId),
    };
  }

  return {
    badge: 'INTERMEDIATE',
    maxPoints: 1,
    name: toTitleCase(criterionId),
  };
}
