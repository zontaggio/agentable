export type CategoryId =
  | 'style_validation'
  | 'build_system'
  | 'testing'
  | 'documentation'
  | 'dev_environment'
  | 'debugging_observability'
  | 'security'
  | 'task_discovery'
  | 'product_analytics';

export type CriterionStatus = 'pass' | 'fail' | 'skip' | 'unverified';
export type AiProviderName = 'openrouter' | 'openai';

export interface AgentableCriterionOverride {
  applicable?: boolean;
  reason?: string;
}

export interface AgentableProjectConfig {
  skip: string[];
  overrides: Record<string, AgentableCriterionOverride>;
}

export type CriterionSource = 'local' | 'gh' | 'ai' | 'hybrid';
export type CriterionConfidence = 'high' | 'medium' | 'low';
export type EvidenceKind = 'dependency' | 'file' | 'workflow' | 'gh' | 'ai' | 'text';
export type EvidenceStrength = 'strong' | 'medium' | 'weak';

export interface CriterionEvidenceDetail {
  kind: EvidenceKind;
  strength: EvidenceStrength;
  detail: string;
}

export interface CriterionDefinition {
  id: string;
  category: CategoryId;
  source: CriterionSource;
  description: string;
  aiAssisted?: boolean;
}

export interface CriterionResult {
  id: string;
  category: CategoryId;
  status: CriterionStatus;
  confidence: CriterionConfidence;
  reason: string;
  evidence: string[];
  evidenceDetails: CriterionEvidenceDetail[];
  source: CriterionSource;
  applicable: boolean;
}

export interface CategoryScore {
  category: CategoryId;
  pass: number;
  fail: number;
  skip: number;
  unverified: number;
  applicable: number;
  score: number;
  confidenceScore: number;
  highConfidenceCoverage: number;
}

export interface ScoreSummary {
  score: number;
  coverage: number;
  confidenceScore: number;
  highConfidenceCoverage: number;
  counts: {
    pass: number;
    fail: number;
    skip: number;
    unverified: number;
    total: number;
    applicable: number;
    evaluated: number;
  };
  categoryScores: CategoryScore[];
}

export interface RunOptions {
  repoPath: string;
  verbose: boolean;
  noGh: boolean;
  aiFailureMode?: 'fallback' | 'strict';
  aiProvider?: AiProviderName;
  aiApiKey?: string;
  aiModel?: string;
  aiBaseUrl?: string;
}

export interface LocalProjectContext {
  rootPath: string;
  files: string[];
  fileSet: Set<string>;
  projectConfig: AgentableProjectConfig;
  packageJson: Record<string, unknown> | null;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  readmePath: string | null;
  gitignoreContent: string;
  workflowFiles: string[];
  locEstimate: number;
  now: Date;
}

export interface ProjectProfile {
  isMonorepo: boolean;
  isService: boolean;
  isLibrary: boolean;
  hasDatabase: boolean;
  hasFeatureFlags: boolean;
  hasTypedLanguage: boolean;
  hasExternalServices: boolean;
  hasPiiSignals: boolean;
  hasFrontendBundle: boolean;
}

export interface GhData {
  available: boolean;
  authenticated: boolean;
  repo?: string;
  defaultBranch?: string;
  branchProtectionEnabled?: boolean;
  secretScanningEnabled?: boolean;
  labelsCount?: number;
  issueStats?: {
    total: number;
    labeled: number;
    oldOpenOver365Days: number;
    goodTitleAndLabels: number;
  };
  errors: string[];
}

export interface AiAssessment {
  id: string;
  status: Exclude<CriterionStatus, 'skip'>;
  reason: string;
  evidence: string[];
}

export interface AiBaseline {
  key: string;
  fingerprint: string;
  model: string;
  createdAt: string;
  assessments: Record<string, AiAssessment>;
}

export interface AiRecommendationGuidance {
  whyItMatters?: string;
  whatGoodLooksLike?: string;
  nextSteps?: string[];
  expectedOutcome?: string;
}

export interface AiRecommendationBaseline {
  key: string;
  fingerprint: string;
  model: string;
  provider: string;
  createdAt: string;
  guidanceByCriterion: Record<string, AiRecommendationGuidance>;
}

export interface EvaluationContext {
  options: RunOptions;
  local: LocalProjectContext;
  profile: ProjectProfile;
  fingerprint: string;
  ghData: GhData;
  aiAssessments: Record<string, AiAssessment>;
}

export interface EngineMeta {
  fingerprint: string;
  generatedAt: string;
  repoPath: string;
  model: string;
  aiCache: 'hit' | 'miss';
  aiProvider: string;
  catalogVersion: string;
  repoIdentifier: string;
}

export type CardBadge = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export type ActionPlanBucket = 'critical' | 'highLeverage' | 'quickWins';

export interface RecommendationItem {
  id: string;
  criterionId: string;
  criterionName: string;
  category: CategoryId;
  status: Exclude<CriterionStatus, 'skip' | 'pass'>;
  confidence: CriterionConfidence;
  bucket: ActionPlanBucket;
  priorityScore: number;
  actionabilityScore: number;
  rank: number;
  whyItMatters: string;
  whatGoodLooksLike: string;
  nextSteps: string[];
  expectedOutcome: string;
}

export interface ActionPlan {
  critical: RecommendationItem[];
  highLeverage: RecommendationItem[];
  quickWins: RecommendationItem[];
  all: RecommendationItem[];
  generatedWithAi: boolean;
}

export interface WebHistoryPoint {
  timestamp: string;
  score: number;
  coverage: number;
  level: number;
  fingerprint: string;
}

export interface WebCategorySummary {
  id: CategoryId;
  label: string;
  score: number;
  confidenceScore: number;
  highConfidenceCoverage: number;
  pass: number;
  fail: number;
  skip: number;
  unverified: number;
}

export interface WebCriterionCard {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  badge: CardBadge;
  maxPoints: number;
  scoreLabel: string;
  status: CriterionStatus;
  confidence: CriterionConfidence;
  reason: string;
  evidence: string[];
  evidenceDetails: CriterionEvidenceDetail[];
  improvementTips: string[];
  guidance?: RecommendationItem;
  priorityRank?: number;
  source: CriterionSource;
  applicable: boolean;
}

export interface WebHeader {
  repoName: string;
  repoPath: string;
  lastUpdated: string;
  level: number;
  score: number;
  coverage: number;
  confidenceScore: number;
  highConfidenceCoverage: number;
  fingerprint: string;
}

export interface WebReportPayload {
  header: WebHeader;
  summary: ScoreSummary;
  actionPlan: ActionPlan;
  categories: WebCategorySummary[];
  criteriaByCategory: Record<CategoryId, WebCriterionCard[]>;
  history: WebHistoryPoint[];
  warnings: string[];
  knownLimitations: string[];
  qualityGateVersion: string;
  generatedAt: string;
  meta: EngineMeta;
}
