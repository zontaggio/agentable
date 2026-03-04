import { CriterionDefinition } from '../../types';

export const DOCUMENTATION_CRITERIA: CriterionDefinition[] = [
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
];
