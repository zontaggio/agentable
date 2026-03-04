import { CriterionDefinition } from '../../types';

export const DEV_ENVIRONMENT_CRITERIA: CriterionDefinition[] = [
  {
    id: 'database_schema',
    category: 'dev_environment',
    source: 'local',
    description: 'Database schema/migrations are present when database is used.',
  },
  {
    id: 'devcontainer',
    category: 'dev_environment',
    source: 'local',
    description: 'Devcontainer configuration exists.',
  },
  {
    id: 'devcontainer_runnable',
    category: 'dev_environment',
    source: 'local',
    description: 'Devcontainer has required fields to run.',
  },
  {
    id: 'env_template',
    category: 'dev_environment',
    source: 'local',
    description: '.env template exists.',
  },
  {
    id: 'local_services_setup',
    category: 'dev_environment',
    source: 'local',
    description: 'Local services setup instructions exist.',
  },
];
