import { GitData } from '../../collectors/git';
import { CriterionDefinition, CriterionResult, EvaluationContext } from '../../types';

export interface EvalSignals {
  readmeText: string;
  workflowText: string;
  allTextIndex: string;
  testFiles: string[];
  integrationTestFiles: string[];
  unitTestFiles: string[];
}

export interface CriterionEvaluatorInput {
  criterion: CriterionDefinition;
  ctx: EvaluationContext;
  gitData: GitData;
  signals: EvalSignals;
}

export type CriterionEvaluator = (
  input: CriterionEvaluatorInput,
) => Promise<CriterionResult | null>;
