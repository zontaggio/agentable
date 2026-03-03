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
