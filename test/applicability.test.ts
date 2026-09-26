const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateApplicabilitySkip } = require('../dist/core/evaluate/applicability');

const baseProfile = {
  isMonorepo: false,
  isService: false,
  isLibrary: true,
  hasDatabase: false,
  hasFeatureFlags: false,
  hasTypedLanguage: true,
  hasExternalServices: false,
  hasPiiSignals: false,
  hasFrontendBundle: false,
};

const local = { fileSet: new Set<string>(), files: [] as string[] };

const SERVICE_OPERATIONS = [
  'distributed_tracing',
  'alerting_configured',
  'metrics_collection',
  'deployment_observability',
  'structured_logging',
  'log_scrubbing',
  'error_tracking_contextualized',
  'error_to_insight_pipeline',
  'feature_flag_infrastructure',
  'health_checks',
];

test('service operations criteria are skipped for libraries and CLIs', () => {
  for (const id of SERVICE_OPERATIONS) {
    const result = evaluateApplicabilitySkip(id, baseProfile, local);
    assert.equal(result.skip, true, `${id} should be skipped for a library`);
    assert.match(result.reason, /not a deployed service/);
  }
});

test('service operations criteria still apply to deployed services', () => {
  const serviceProfile = { ...baseProfile, isService: true, isLibrary: false };
  for (const id of SERVICE_OPERATIONS) {
    assert.equal(
      evaluateApplicabilitySkip(id, serviceProfile, local).skip,
      false,
      `${id} should apply to a service`,
    );
  }
});

test('criteria that matter for every project are not skipped for libraries', () => {
  for (const id of ['unit_tests_exist', 'lint_config', 'readme', 'codeowners']) {
    assert.equal(
      evaluateApplicabilitySkip(id, baseProfile, local).skip,
      false,
      `${id} should apply to a library`,
    );
  }
});

test('env_template applies only when there is configuration to document', () => {
  assert.equal(evaluateApplicabilitySkip('env_template', baseProfile, local).skip, true);
  const withEnvFile = { fileSet: new Set(['.env']), files: ['.env'] };
  assert.equal(evaluateApplicabilitySkip('env_template', baseProfile, withEnvFile).skip, false);
  const service = { ...baseProfile, isService: true, isLibrary: false };
  assert.equal(evaluateApplicabilitySkip('env_template', service, local).skip, false);
});

export {};
