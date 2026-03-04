import { CriterionDefinition } from '../../types';

export const TESTING_CRITERIA: CriterionDefinition[] = [
  {
    id: 'flaky_test_detection',
    category: 'testing',
    source: 'local',
    description: 'Flaky test detection/quarantine configured.',
  },
  {
    id: 'integration_tests_exist',
    category: 'testing',
    source: 'local',
    description: 'Integration tests exist.',
  },
  {
    id: 'test_coverage_thresholds',
    category: 'testing',
    source: 'local',
    description: 'Coverage thresholds configured/enforced.',
  },
  {
    id: 'test_isolation',
    category: 'testing',
    source: 'local',
    description: 'Test isolation/parallelization configured.',
  },
  {
    id: 'test_naming_conventions',
    category: 'testing',
    source: 'local',
    description: 'Test naming conventions are consistent.',
  },
  {
    id: 'test_performance_tracking',
    category: 'testing',
    source: 'local',
    description: 'Test performance/timing tracking configured.',
  },
  {
    id: 'unit_tests_exist',
    category: 'testing',
    source: 'local',
    description: 'Unit tests exist.',
  },
  {
    id: 'unit_tests_runnable',
    category: 'testing',
    source: 'local',
    description: 'Unit tests can be run via package script.',
  },
];
