import { CriterionResult, RecommendationItem } from '../../types';
import {
  CATEGORY_OUTCOME,
  CATEGORY_TOOLING_FALLBACK,
  DESCRIPTION_BY_CRITERION,
  STEPS_BY_CRITERION,
  TOOLING_BY_CRITERION,
} from './constants';

export function defaultWhyItMatters(result: CriterionResult, criterionName: string): string {
  const sourceDescription = DESCRIPTION_BY_CRITERION.get(result.id);
  if (sourceDescription) {
    return `${criterionName} is currently weak. ${sourceDescription}`;
  }
  return `${criterionName} is currently weak and increases delivery risk for this repository.`;
}

export function defaultWhatGoodLooksLike(result: CriterionResult, criterionName: string): string {
  if (result.status === 'unverified') {
    return `${criterionName} is backed by explicit, machine-verifiable signals rather than ambiguous text mentions.`;
  }
  return `${criterionName} is enforced by explicit tooling and policy with reliable automation coverage.`;
}

export function defaultNextSteps(result: CriterionResult): string[] {
  const specific = STEPS_BY_CRITERION[result.id] ?? [];
  const base =
    specific.length > 0
      ? specific
      : result.status === 'unverified'
        ? [
            'Convert ambiguous text references into explicit implementation signals.',
            'Attach this criterion to one automated check so status becomes machine-verifiable.',
          ]
        : [
            'Define and document the implementation standard for this criterion.',
            'Introduce automated enforcement so regressions fail early.',
          ];

  const tooling = TOOLING_BY_CRITERION[result.id] ?? CATEGORY_TOOLING_FALLBACK[result.category];
  const steps = [...base];
  if (tooling && tooling.length > 0) {
    steps.push(`Suggested tooling options: ${tooling.slice(0, 4).join(', ')}.`);
  }
  steps.push(
    result.status === 'unverified'
      ? 'Add one concrete evidence source (dependency/config/workflow) that will turn this criterion into PASS/FAIL instead of UNVERIFIED.'
      : 'Define a measurable success signal (for example, CI gate, coverage threshold, or policy compliance trend) and review it regularly.',
  );

  return Array.from(new Set(steps)).slice(0, 5);
}

export function defaultExpectedOutcome(result: CriterionResult): string {
  return CATEGORY_OUTCOME[result.category];
}

function genericTips(result: CriterionResult): string[] {
  if (result.status === 'pass') {
    return [
      'This criterion is already validated. Keep it enforced in automation to avoid regressions.',
    ];
  }

  if (result.status === 'skip') {
    return ['Criterion is currently not applicable. Re-evaluate it if repository scope changes.'];
  }

  if (result.status === 'unverified') {
    return [
      'Increase explicit evidence so this criterion can be verified with high confidence.',
      'Prefer explicit configuration and automation over text-only references.',
    ];
  }

  return [
    'Define and implement an explicit standard for this criterion.',
    'Automate validation to prevent regressions.',
  ];
}

export function getImprovementTips(
  result: CriterionResult,
  guidance?: RecommendationItem,
): string[] {
  if (guidance?.nextSteps && guidance.nextSteps.length > 0) {
    return guidance.nextSteps.slice(0, 5);
  }

  const specific = STEPS_BY_CRITERION[result.id];
  if (specific && specific.length > 0) {
    return specific;
  }

  return genericTips(result);
}
