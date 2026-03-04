import { AiProviderConfig } from '../../ai-provider';
import { OpenRouterChatRequestBody } from './types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const ASSESSMENT_TIMEOUT_MS = 65_000;
export const RECOMMENDATION_TIMEOUT_MS = 32_000;
export const RECOMMENDATION_BATCH_SIZE = 8;
export const RECOMMENDATION_CONCURRENCY = 3;

export async function sendOpenRouterChatRequest(
  config: AiProviderConfig,
  body: OpenRouterChatRequestBody,
  timeoutMs: number,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://github.com/agentable/cli',
        'X-Title': 'agentable',
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error(`OpenRouter request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content ?? '';
}
