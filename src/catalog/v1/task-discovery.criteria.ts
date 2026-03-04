import { CriterionDefinition } from '../../types';

export const TASK_DISCOVERY_CRITERIA: CriterionDefinition[] = [
  {
    id: 'backlog_health',
    category: 'task_discovery',
    source: 'gh',
    description: 'Issue backlog hygiene is healthy.',
  },
  {
    id: 'issue_labeling_system',
    category: 'task_discovery',
    source: 'hybrid',
    description: 'Issue labels are consistently managed.',
  },
  {
    id: 'issue_templates',
    category: 'task_discovery',
    source: 'local',
    description: 'Issue templates exist.',
  },
  {
    id: 'pr_templates',
    category: 'task_discovery',
    source: 'local',
    description: 'PR template exists.',
  },
];
