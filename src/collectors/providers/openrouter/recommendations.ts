import { AiProviderConfig } from '../../ai-provider';
import {
  RECOMMENDATION_BATCH_SIZE,
  RECOMMENDATION_CONCURRENCY,
  RECOMMENDATION_TIMEOUT_MS,
  sendOpenRouterChatRequest,
} from './http';
import { parseRecommendationResponse } from './json';
import { OpenRouterRecommendation, OpenRouterRecommendationPromptItem } from './types';

function chunkRecommendations(
  recommendations: OpenRouterRecommendationPromptItem[],
  size: number,
): OpenRouterRecommendationPromptItem[][] {
  const chunks: OpenRouterRecommendationPromptItem[][] = [];
  for (let index = 0; index < recommendations.length; index += size) {
    chunks.push(recommendations.slice(index, index + size));
  }
  return chunks;
}

async function enrichRecommendationBatch(
  config: AiProviderConfig,
  input: {
    repositoryContextJson: string;
    recommendations: OpenRouterRecommendationPromptItem[];
    batchIndex: number;
    totalBatches: number;
  },
): Promise<Record<string, OpenRouterRecommendation>> {
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
    `This is batch ${input.batchIndex}/${input.totalBatches}.`,
    'Return recommendations only for criterionIds included in this batch.',
    'For each item return:',
    '{"criterionId":"string","why_it_matters":"string","what_good_looks_like":"string","next_steps":["string"],"expected_outcome":"string"}',
    'Keep next_steps to 3-5 concise and practical implementation actions.',
    'When useful, suggest concrete tooling options by name (for example OpenTelemetry, Sentry, Renovate, CodeQL).',
    'Repository context JSON:',
    input.repositoryContextJson,
    'Recommendations JSON:',
    JSON.stringify(input.recommendations),
  ].join('\n\n');

  const responseContent = await sendOpenRouterChatRequest(
    config,
    {
      model: config.model,
      temperature: 0,
      max_tokens: 1_700,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    },
    RECOMMENDATION_TIMEOUT_MS,
  );

  return parseRecommendationResponse(responseContent, input.recommendations);
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

  const output: Record<string, OpenRouterRecommendation> = {};
  const batches = chunkRecommendations(input.recommendations, RECOMMENDATION_BATCH_SIZE);
  const workerCount = Math.min(RECOMMENDATION_CONCURRENCY, batches.length);
  let nextBatchIndex = 0;

  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const currentIndex = nextBatchIndex;
      nextBatchIndex += 1;
      if (currentIndex >= batches.length) {
        return;
      }

      const batch = batches[currentIndex];
      if (!batch) {
        return;
      }

      const partial = await enrichRecommendationBatch(config, {
        repositoryContextJson: input.repositoryContextJson,
        recommendations: batch,
        batchIndex: currentIndex + 1,
        totalBatches: batches.length,
      });
      Object.assign(output, partial);
    }
  });

  await Promise.all(workers);

  for (const recommendation of input.recommendations) {
    if (!output[recommendation.criterionId]) {
      output[recommendation.criterionId] = {
        criterionId: recommendation.criterionId,
      };
    }
  }

  return output;
}
