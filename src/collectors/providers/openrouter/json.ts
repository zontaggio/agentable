import { AiAssessment } from '../../../types';
import { OpenRouterRecommendation, OpenRouterRecommendationPromptItem } from './types';

export function extractJsonObject(input: string): string | null {
  const first = input.indexOf('{');
  const last = input.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }
  return input.slice(first, last + 1);
}

export function normalizeStatus(value: string): 'pass' | 'fail' | 'unverified' {
  const low = value.toLowerCase();
  if (low === 'pass' || low === 'fail' || low === 'unverified') {
    return low;
  }
  return 'unverified';
}

export function parseAssessmentResponse(
  content: string,
  criteriaIds: string[],
): Record<string, AiAssessment> {
  const jsonPart = extractJsonObject(content);
  if (!jsonPart) {
    throw new Error('OpenRouter response did not contain valid JSON object.');
  }

  const parsed = JSON.parse(jsonPart) as {
    assessments?: Array<{ id?: string; status?: string; reason?: string; evidence?: unknown }>;
  };

  const out: Record<string, AiAssessment> = {};
  for (const item of parsed.assessments ?? []) {
    const id = item.id?.trim();
    if (!id || !criteriaIds.includes(id)) {
      continue;
    }

    const evidence = Array.isArray(item.evidence)
      ? item.evidence.map((value) => String(value)).slice(0, 3)
      : [];

    out[id] = {
      id,
      status: normalizeStatus(item.status ?? 'unverified'),
      reason: (item.reason ?? 'AI assessment unavailable.').slice(0, 280),
      evidence,
    };
  }

  return out;
}

export function parseRecommendationResponse(
  responseContent: string,
  batch: OpenRouterRecommendationPromptItem[],
): Record<string, OpenRouterRecommendation> {
  const jsonPart = extractJsonObject(responseContent);
  if (!jsonPart) {
    throw new Error('OpenRouter recommendation response did not contain valid JSON object.');
  }

  const parsed = JSON.parse(jsonPart) as {
    recommendations?: Array<{
      criterionId?: string;
      why_it_matters?: string;
      what_good_looks_like?: string;
      next_steps?: unknown;
      expected_outcome?: string;
    }>;
  };

  const validIds = new Set(batch.map((item) => item.criterionId));
  const output: Record<string, OpenRouterRecommendation> = {};
  for (const item of parsed.recommendations ?? []) {
    const criterionId = item.criterionId?.trim();
    if (!criterionId || !validIds.has(criterionId)) {
      continue;
    }

    const nextSteps = Array.isArray(item.next_steps)
      ? item.next_steps.map((value) => String(value)).slice(0, 5)
      : undefined;

    output[criterionId] = {
      criterionId,
      whyItMatters: item.why_it_matters?.slice(0, 420),
      whatGoodLooksLike: item.what_good_looks_like?.slice(0, 420),
      nextSteps,
      expectedOutcome: item.expected_outcome?.slice(0, 300),
    };
  }

  return output;
}
