export { runAgentReadiness } from './core/engine';
export { CATALOG_VERSION, CRITERIA, CATEGORY_LABELS } from './catalog/v1';
export { startWebServer } from './web/server';
export { buildWebPayload, scoreToLevel } from './web/transform';
export { computeRepoKey, loadHistory, appendHistory } from './web/history';
export type {
  CriterionResult,
  ScoreSummary,
  RunOptions,
  CriterionDefinition,
  CriterionStatus,
  CategoryId,
  WebReportPayload,
  WebHistoryPoint,
  WebCategorySummary,
  WebCriterionCard,
  EngineMeta,
} from './types';
