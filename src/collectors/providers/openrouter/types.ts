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

export interface OpenRouterChatRequestBody {
  model: string;
  temperature: number;
  max_tokens: number;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
}
