import { AiAssessment } from '../../../types';
import { AiProviderConfig, AiProviderContext } from '../../ai-provider';
import { parseAssessmentResponse } from '../openrouter/json';
import { ASSESSMENT_TIMEOUT_MS, sendOpenAiChatRequest } from './http';

export async function callOpenAi(
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

  const content = await sendOpenAiChatRequest(
    config,
    {
      model: config.model,
      temperature: 0,
      max_tokens: 1_100,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    },
    ASSESSMENT_TIMEOUT_MS,
  );

  return parseAssessmentResponse(content, context.criteriaIds);
}
