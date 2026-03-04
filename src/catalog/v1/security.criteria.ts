import { CriterionDefinition } from '../../types';

export const SECURITY_CRITERIA: CriterionDefinition[] = [
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
];
