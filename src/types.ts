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

export type CriterionSource = 'local' | 'gh' | 'ai' | 'hybrid';

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
  reason: string;
  evidence: string[];
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
}

export interface ScoreSummary {
  score: number;
  coverage: number;
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
  aiApiKey?: string;
  aiModel?: string;
}

export interface LocalProjectContext {
  rootPath: string;
  files: string[];
  fileSet: Set<string>;
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
  reason: string;
  evidence: string[];
  improvementTips: string[];
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
  fingerprint: string;
}

export interface WebReportPayload {
  header: WebHeader;
  summary: ScoreSummary;
  categories: WebCategorySummary[];
  criteriaByCategory: Record<CategoryId, WebCriterionCard[]>;
  history: WebHistoryPoint[];
  warnings: string[];
  generatedAt: string;
  meta: EngineMeta;
}
