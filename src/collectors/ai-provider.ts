import { AiAssessment } from '../types';

export interface AiProviderConfig {
  apiKey: string;
  model: string;
}

export interface AiProviderContext {
  criteriaIds: string[];
  contextJson: string;
}

export interface AiProvider {
  name: string;
  validateConfig(input: { apiKey?: string; model?: string }): AiProviderConfig;
  assessCriteria(
    context: AiProviderContext,
    config: AiProviderConfig,
  ): Promise<Record<string, AiAssessment>>;
}
