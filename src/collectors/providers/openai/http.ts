import { AiProviderConfig } from '../../ai-provider';
import { OpenRouterChatRequestBody } from '../openrouter/types';

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const ASSESSMENT_TIMEOUT_MS = 65_000;
export const RECOMMENDATION_TIMEOUT_MS = 32_000;
export const RECOMMENDATION_BATCH_SIZE = 8;
export const RECOMMENDATION_CONCURRENCY = 3;

function normalizeBaseUrl(input?: string): string {
  const candidate = (input ?? '').trim();
  const base = candidate.length > 0 ? candidate : DEFAULT_OPENAI_BASE_URL;
  return base.replace(/\/+$/, '');
}

export async function sendOpenAiChatRequest(
  config: AiProviderConfig,
  body: OpenRouterChatRequestBody,
  timeoutMs: number,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error(
        `OpenAI-compatible request timed out after ${Math.round(timeoutMs / 1000)}s`,
        {
          cause: error,
        },
      );
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content ?? '';
}
