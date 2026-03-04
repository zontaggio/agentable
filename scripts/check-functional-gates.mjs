#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const THRESHOLDS = {
  minRepos: 30,
  minPrecisionAt3: 0.8,
  maxCriticalFalsePositiveRate: 0.1,
  minActionabilityAvg: 1.5,
  minReposWithTwoExecutableNow: 0.85,
  maxScoreVariation: 1,
  minAiFailureRecovery: 1,
  minTransparencyCoverage: 1,
  minHighRiskPassEvidenceCoverage: 1,
  maxFirstRunMinutes: 10,
  minUxSuccessRate: 0.8,
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function average(values) {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, item) => acc + item, 0);
  return sum / values.length;
}

function normalizedRubricScore(rubric) {
  if (!rubric || typeof rubric !== 'object') {
    return 0;
  }

  const rec = rubric;
  const values = [
    toNumber(rec.clarity),
    toNumber(rec.executability),
    toNumber(rec.impact),
    toNumber(rec.specificity),
  ];
  return average(values);
}

function isExecutableNow(recommendation) {
  const rubric = recommendation && typeof recommendation === 'object' ? recommendation.actionabilityRubric : null;
  if (!rubric || typeof rubric !== 'object') {
    return false;
  }

  const executability = toNumber(rubric.executability);
  const specificity = toNumber(rubric.specificity);
  return executability >= 2 && specificity >= 1;
}

function stableTop5(repeatRuns) {
  if (repeatRuns.length <= 1) return true;
  const baseline = JSON.stringify(toArray(repeatRuns[0]?.top5));
  return repeatRuns.every((run) => JSON.stringify(toArray(run?.top5)) === baseline);
}

function scoreVariation(repeatRuns) {
  if (repeatRuns.length === 0) return Number.POSITIVE_INFINITY;
  const scores = repeatRuns.map((run) => toNumber(run?.score, 0));
  return Math.max(...scores) - Math.min(...scores);
}

function hasStrongOrMediumEvidence(entry) {
  const strengths = toArray(entry?.evidenceStrengths).map((item) => String(item));
  return strengths.includes('strong') || strengths.includes('medium');
}

async function readDataset(datasetPath) {
  const raw = await fs.readFile(datasetPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Dataset must be a JSON object.');
  }
  return parsed;
}

function buildGateResults(data) {
  const repos = toArray(data.repos);
  const repoCount = repos.length;

  const precisionAt3Values = repos.map((repo) => {
    const top3 = toArray(repo.criticalTop3).slice(0, 3).map((item) => String(item));
    const truth = new Set(toArray(repo.groundTruthCritical).map((item) => String(item)));
    if (top3.length === 0) return 0;
    const hits = top3.filter((item) => truth.has(item)).length;
    return hits / top3.length;
  });

  const falsePositiveRates = repos.map((repo) => {
    const top3 = toArray(repo.criticalTop3).slice(0, 3).map((item) => String(item));
    if (top3.length === 0) return 1;

    const explicitFps = toArray(repo.criticalFalsePositives).map((item) => String(item));
    if (explicitFps.length > 0) {
      return explicitFps.length / top3.length;
    }

    const truth = new Set(toArray(repo.groundTruthCritical).map((item) => String(item)));
    const fpCount = top3.filter((item) => !truth.has(item)).length;
    return fpCount / top3.length;
  });

  const recommendationRubricAverages = repos.flatMap((repo) =>
    toArray(repo.recommendations).map((item) => normalizedRubricScore(item.actionabilityRubric)),
  );

  const reposWithTwoExecutableNow = repos.filter((repo) => {
    const executableNowCount = toArray(repo.recommendations).filter((item) => isExecutableNow(item)).length;
    return executableNowCount >= 2;
  }).length;

  const determinismPasses = repos.filter((repo) => {
    const repeatRuns = toArray(repo.repeatRuns);
    return repeatRuns.length >= 5 && stableTop5(repeatRuns) && scoreVariation(repeatRuns) <= THRESHOLDS.maxScoreVariation;
  }).length;

  const aiRecoveryPasses = repos.filter((repo) => Boolean(repo.aiFailureRecovered)).length;

  const transparencyChecks = repos.flatMap((repo) =>
    toArray(repo.recommendations)
      .filter((item) => item?.bucket === 'critical' || item?.bucket === 'highLeverage')
      .map((item) => {
        const why = typeof item?.whyItMatters === 'string' && item.whyItMatters.trim().length > 0;
        const evidence = toArray(item?.evidence).length > 0;
        const outcome = typeof item?.expectedOutcome === 'string' && item.expectedOutcome.trim().length > 0;
        return why && evidence && outcome;
      }),
  );

  const highRiskPassEvidenceChecks = repos.flatMap((repo) =>
    toArray(repo.highRiskPassCriteria).map((item) => hasStrongOrMediumEvidence(item)),
  );

  const firstRunUx = repos.map((repo) => toNumber(repo.firstRunToThreeStepsMinutes, Number.POSITIVE_INFINITY));
  const uxStudy = data.uxStudy && typeof data.uxStudy === 'object' ? data.uxStudy : {};
  const participants = toNumber(uxStudy.participants, 0);
  const successes = toNumber(uxStudy.successes, 0);
  const uxSuccessRate = participants > 0 ? successes / participants : 0;

  const metrics = {
    repoCount,
    precisionAt3: average(precisionAt3Values),
    criticalFalsePositiveRate: average(falsePositiveRates),
    actionabilityAverage: average(recommendationRubricAverages),
    reposWithTwoExecutableNowRate: repoCount > 0 ? reposWithTwoExecutableNow / repoCount : 0,
    determinismRate: repoCount > 0 ? determinismPasses / repoCount : 0,
    aiFailureRecoveryRate: repoCount > 0 ? aiRecoveryPasses / repoCount : 0,
    transparencyCoverage: transparencyChecks.length > 0 ? average(transparencyChecks.map((item) => (item ? 1 : 0))) : 0,
    highRiskPassEvidenceCoverage:
      highRiskPassEvidenceChecks.length > 0
        ? average(highRiskPassEvidenceChecks.map((item) => (item ? 1 : 0)))
        : 0,
    maxFirstRunMinutesObserved: firstRunUx.length > 0 ? Math.max(...firstRunUx) : Number.POSITIVE_INFINITY,
    uxSuccessRate,
  };

  const checks = [
    {
      id: 'repos_min_count',
      ok: metrics.repoCount >= THRESHOLDS.minRepos,
      actual: metrics.repoCount,
      expected: `>= ${THRESHOLDS.minRepos}`,
    },
    {
      id: 'precision_at_3',
      ok: metrics.precisionAt3 >= THRESHOLDS.minPrecisionAt3,
      actual: metrics.precisionAt3,
      expected: `>= ${THRESHOLDS.minPrecisionAt3}`,
    },
    {
      id: 'critical_false_positive_rate',
      ok: metrics.criticalFalsePositiveRate <= THRESHOLDS.maxCriticalFalsePositiveRate,
      actual: metrics.criticalFalsePositiveRate,
      expected: `<= ${THRESHOLDS.maxCriticalFalsePositiveRate}`,
    },
    {
      id: 'actionability_average',
      ok: metrics.actionabilityAverage >= THRESHOLDS.minActionabilityAvg,
      actual: metrics.actionabilityAverage,
      expected: `>= ${THRESHOLDS.minActionabilityAvg}`,
    },
    {
      id: 'repos_with_two_executable_now',
      ok: metrics.reposWithTwoExecutableNowRate >= THRESHOLDS.minReposWithTwoExecutableNow,
      actual: metrics.reposWithTwoExecutableNowRate,
      expected: `>= ${THRESHOLDS.minReposWithTwoExecutableNow}`,
    },
    {
      id: 'determinism_rate',
      ok: metrics.determinismRate >= 1,
      actual: metrics.determinismRate,
      expected: '== 1',
    },
    {
      id: 'ai_failure_recovery_rate',
      ok: metrics.aiFailureRecoveryRate >= THRESHOLDS.minAiFailureRecovery,
      actual: metrics.aiFailureRecoveryRate,
      expected: `>= ${THRESHOLDS.minAiFailureRecovery}`,
    },
    {
      id: 'transparency_coverage',
      ok: metrics.transparencyCoverage >= THRESHOLDS.minTransparencyCoverage,
      actual: metrics.transparencyCoverage,
      expected: `>= ${THRESHOLDS.minTransparencyCoverage}`,
    },
    {
      id: 'high_risk_pass_evidence_coverage',
      ok: metrics.highRiskPassEvidenceCoverage >= THRESHOLDS.minHighRiskPassEvidenceCoverage,
      actual: metrics.highRiskPassEvidenceCoverage,
      expected: `>= ${THRESHOLDS.minHighRiskPassEvidenceCoverage}`,
    },
    {
      id: 'first_run_minutes',
      ok: metrics.maxFirstRunMinutesObserved <= THRESHOLDS.maxFirstRunMinutes,
      actual: metrics.maxFirstRunMinutesObserved,
      expected: `<= ${THRESHOLDS.maxFirstRunMinutes}`,
    },
    {
      id: 'ux_success_rate',
      ok: metrics.uxSuccessRate >= THRESHOLDS.minUxSuccessRate,
      actual: metrics.uxSuccessRate,
      expected: `>= ${THRESHOLDS.minUxSuccessRate}`,
    },
  ];

  return { metrics, checks };
}

function fmt(value) {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number(value).toFixed(3);
}

async function main() {
  const inputArg = process.argv[2] || 'fixtures/quality-gates/functional-benchmark.json';
  const datasetPath = path.resolve(process.cwd(), inputArg);
  const dataset = await readDataset(datasetPath);
  const result = buildGateResults(dataset);

  console.log(`functional quality gates · dataset: ${datasetPath}`);
  console.log('');
  console.log('metrics');
  console.log(`- repos: ${result.metrics.repoCount}`);
  console.log(`- precision@3: ${fmt(result.metrics.precisionAt3)}`);
  console.log(`- critical false-positive rate: ${fmt(result.metrics.criticalFalsePositiveRate)}`);
  console.log(`- actionability avg: ${fmt(result.metrics.actionabilityAverage)}`);
  console.log(`- repos with >=2 executable-now recommendations: ${fmt(result.metrics.reposWithTwoExecutableNowRate)}`);
  console.log(`- determinism rate: ${fmt(result.metrics.determinismRate)}`);
  console.log(`- ai failure recovery rate: ${fmt(result.metrics.aiFailureRecoveryRate)}`);
  console.log(`- transparency coverage: ${fmt(result.metrics.transparencyCoverage)}`);
  console.log(`- high-risk pass evidence coverage: ${fmt(result.metrics.highRiskPassEvidenceCoverage)}`);
  console.log(`- max first-run minutes: ${fmt(result.metrics.maxFirstRunMinutesObserved)}`);
  console.log(`- ux success rate: ${fmt(result.metrics.uxSuccessRate)}`);
  console.log('');

  console.log('checks');
  for (const check of result.checks) {
    console.log(`- [${check.ok ? 'PASS' : 'FAIL'}] ${check.id}: actual=${fmt(check.actual)} expected ${check.expected}`);
  }

  const failed = result.checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`quality gate check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
