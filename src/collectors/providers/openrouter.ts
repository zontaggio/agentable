import { AiAssessment } from '../../types';
import { AiProvider, AiProviderConfig, AiProviderContext } from '../ai-provider';

function extractJsonObject(input: string): string | null {
  const first = input.indexOf('{');
  const last = input.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }
  return input.slice(first, last + 1);
}

function normalizeStatus(value: string): 'pass' | 'fail' | 'unverified' {
  const low = value.toLowerCase();
  if (low === 'pass' || low === 'fail' || low === 'unverified') {
    return low;
  }
  return 'unverified';
}

async function callOpenRouter(
  config: AiProviderConfig,
  context: AiProviderContext,
): Promise<Record<string, AiAssessment>> {
  const systemPrompt =
    'You evaluate repository readiness criteria. Respond only valid JSON with key "assessments" as an array. No markdown.';

  const userPrompt = [
    'Evaluate ONLY the criteria listed below.',
    `criteria: ${context.criteriaIds.join(', ')}`,
    'Output JSON schema:',
    '{"assessments":[{"id":"string","status":"pass|fail|unverified","reason":"string","evidence":["string"]}]}',
    'Use concise reasons and 1-3 evidence items.',
    'Repository context:',
    context.contextJson,
  ].join('\n\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://github.com/agentable/cli',
      'X-Title': 'agentable',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = body.choices?.[0]?.message?.content ?? '';
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
    if (!id || !context.criteriaIds.includes(id)) {
      continue;
    }

    const evidence = Array.isArray(item.evidence)
      ? item.evidence.map((v) => String(v)).slice(0, 3)
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

export interface OpenRouterRecommendationPromptItem {
  criterionId: string;
  criterionName: string;
  category: string;
  status: 'fail' | 'unverified';
  confidence: 'high' | 'medium' | 'low';
  priorityScore: number;
  rank: number;
  reason: string;
  evidence: string[];
  evidenceDetails: string[];
  deterministic: {
    whyItMatters: string;
    whatGoodLooksLike: string;
    nextSteps: string[];
    expectedOutcome: string;
  };
}

export interface OpenRouterRecommendation {
  criterionId: string;
  whyItMatters?: string;
  whatGoodLooksLike?: string;
  nextSteps?: string[];
  expectedOutcome?: string;
}

export async function enrichRecommendationsWithOpenRouter(
  config: AiProviderConfig,
  input: {
    repositoryContextJson: string;
    recommendations: OpenRouterRecommendationPromptItem[];
  },
): Promise<Record<string, OpenRouterRecommendation>> {
  if (input.recommendations.length === 0) {
    return {};
  }

  const systemPrompt = [
    'You generate guided engineering recommendations for repository readiness.',
    'Return ONLY valid JSON with top-level key "recommendations".',
    'No markdown, no prose outside JSON.',
    'Be concrete and implementation-oriented.',
    'Mention specific tools/libraries/frameworks when relevant.',
    'Do not include shell commands, code snippets, or file patch instructions.',
  ].join(' ');

  const userPrompt = [
    'Refine these deterministic recommendations for clarity and repo context.',
    'Use English.',
    'For each item return:',
    '{"criterionId":"string","why_it_matters":"string","what_good_looks_like":"string","next_steps":["string"],"expected_outcome":"string"}',
    'Keep next_steps to 3-5 concise and practical implementation actions.',
    'When useful, suggest concrete tooling options by name (for example OpenTelemetry, Sentry, Renovate, CodeQL).',
    'Repository context JSON:',
    input.repositoryContextJson,
    'Recommendations JSON:',
    JSON.stringify(input.recommendations),
  ].join('\n\n');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://github.com/agentable/cli',
      'X-Title': 'agentable',
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content ?? '';
  const jsonPart = extractJsonObject(content);
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

  const validIds = new Set(input.recommendations.map((item) => item.criterionId));
  const output: Record<string, OpenRouterRecommendation> = {};
  for (const item of parsed.recommendations ?? []) {
    const criterionId = item.criterionId?.trim();
    if (!criterionId || !validIds.has(criterionId)) {
      continue;
    }

    const nextSteps = Array.isArray(item.next_steps) ? item.next_steps.map((value) => String(value)).slice(0, 5) : undefined;
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

export const openRouterProvider: AiProvider = {
  name: 'openrouter',
  validateConfig(input: { apiKey?: string; model?: string }): AiProviderConfig {
    const apiKey = (input.apiKey ?? '').trim();
    const model = (input.model ?? '').trim();

    if (!apiKey) {
      throw new Error('OpenRouter API key is missing. Run `agentable --setup` to configure it.');
    }

    if (!model) {
      throw new Error('OpenRouter model is missing. Run `agentable --setup` to configure it.');
    }

    return {
      apiKey,
      model,
    };
  },
  async assessCriteria(
    context: AiProviderContext,
    config: AiProviderConfig,
  ): Promise<Record<string, AiAssessment>> {
    return callOpenRouter(config, context);
  },
};
