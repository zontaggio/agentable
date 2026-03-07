export const TESTING_WHY_IT_MATTERS: Record<string, string> = {
  flaky_test_detection:
    'Flaky tests poison the feedback loop agents rely on, making good changes look bad and bad changes look acceptable.',
  integration_tests_exist:
    'Integration tests verify real boundaries that agents frequently affect, such as APIs, data flow, and service contracts.',
  test_coverage_thresholds:
    'Coverage thresholds keep validation from silently eroding as agents make many small changes over time.',
  test_isolation:
    'Isolated tests produce trustworthy signals, which agents need to distinguish real regressions from environmental noise.',
  test_naming_conventions:
    'Consistent test naming helps agents find the right validation targets and understand what behavior each test protects.',
  test_performance_tracking:
    'Test timing visibility helps preserve fast feedback loops instead of letting validation become too slow for iterative agent use.',
  unit_tests_exist:
    'Unit tests give agents local behavioral checks for the code they edit most often.',
  unit_tests_runnable:
    'Runnable test commands matter because agents cannot validate changes against tests they do not know how to execute.',
};
