import { AiAssessment } from '../../../types';
import { AiProvider, AiProviderConfig, AiProviderContext } from '../../ai-provider';
import { callOpenRouter } from './assessments';

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
