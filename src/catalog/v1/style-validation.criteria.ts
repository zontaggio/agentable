import { CriterionDefinition } from '../../types';

export const STYLE_VALIDATION_CRITERIA: CriterionDefinition[] = [
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
];
