import { AiAssessment } from '../../../types';
import { AiProvider, AiProviderConfig, AiProviderContext } from '../../ai-provider';
import { callOpenAi } from './assessments';
import { DEFAULT_OPENAI_BASE_URL } from './http';

export const openAiProvider: AiProvider = {
  name: 'openai',
  validateConfig(input: { apiKey?: string; model?: string; baseUrl?: string }): AiProviderConfig {
    const apiKey = (input.apiKey ?? '').trim();
    const model = (input.model ?? '').trim();
    const baseUrl = (input.baseUrl ?? '').trim() || DEFAULT_OPENAI_BASE_URL;

    if (!model) {
      throw new Error('OpenAI model is missing. Run `agentable --setup` to configure it.');
    }

    return {
      apiKey: apiKey.length > 0 ? apiKey : undefined,
      model,
      baseUrl,
    };
  },
  async assessCriteria(
    context: AiProviderContext,
    config: AiProviderConfig,
  ): Promise<Record<string, AiAssessment>> {
    return callOpenAi(config, context);
  },
};
