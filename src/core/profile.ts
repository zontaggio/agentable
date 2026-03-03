import { LocalProjectContext, ProjectProfile } from '../types';

const DATABASE_HINTS = [
  'prisma',
  'typeorm',
  'sequelize',
  'mongoose',
  'pg',
  'mysql',
  'sqlite',
  'knex',
  'drizzle',
  'mongodb',
  'redis',
] as const;

const SERVICE_HINTS = [
  'express',
  'fastify',
  '@nestjs/core',
  'koa',
  'hono',
  'flask',
  'django',
  'spring',
] as const;

const FEATURE_FLAG_HINTS = ['launchdarkly', 'statsig', 'unleash', 'flagsmith'];
const FRONTEND_HINTS = ['react', 'next', 'vue', 'nuxt', 'angular', 'svelte', 'vite'];
const PII_HINTS = ['pii', 'gdpr', 'privacy', 'consent', 'customer_data', 'personal_data'];

function hasDependency(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>,
  names: readonly string[],
): boolean {
  const all = { ...dependencies, ...devDependencies };
  const keys = Object.keys(all);
  return names.some((hint) => keys.some((dep) => dep.toLowerCase().includes(hint.toLowerCase())));
}

function hasFileHints(fileSet: Set<string>, hints: string[]): boolean {
  for (const file of fileSet) {
    const low = file.toLowerCase();
    if (hints.some((hint) => low.includes(hint))) {
      return true;
    }
  }
  return false;
}

export function buildProjectProfile(local: LocalProjectContext): ProjectProfile {
  const { dependencies, devDependencies, fileSet, files, packageJson } = local;
  const packageObj = packageJson ?? {};

  const isMonorepo =
    Boolean((packageObj as { workspaces?: unknown }).workspaces) ||
    fileSet.has('pnpm-workspace.yaml') ||
    fileSet.has('turbo.json') ||
    fileSet.has('nx.json') ||
    fileSet.has('lerna.json');

  const hasDatabase =
    hasDependency(dependencies, devDependencies, DATABASE_HINTS) ||
    hasFileHints(fileSet, ['schema.prisma', 'migrations/', 'database', 'db/']);

  const isService =
    hasDependency(dependencies, devDependencies, SERVICE_HINTS) ||
    hasFileHints(fileSet, ['docker-compose', 'k8s', 'helm', 'src/server', 'src/api', 'routes/']);

  const isLibrary = !isService;

  const hasFeatureFlags = hasDependency(dependencies, devDependencies, FEATURE_FLAG_HINTS);

  const hasTypedLanguage =
    files.some((f) => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.py')) ||
    fileSet.has('tsconfig.json') ||
    hasDependency(dependencies, devDependencies, ['typescript', 'mypy', 'pyright']);

  const hasExternalServices =
    hasDatabase ||
    hasFileHints(fileSet, ['docker-compose', 'terraform', 'pulumi', 'k8s']) ||
    hasDependency(dependencies, devDependencies, ['kafka', 'rabbitmq', 'nats', 'sqs', 'pubsub']);

  const hasPiiSignals =
    hasFileHints(fileSet, PII_HINTS) ||
    JSON.stringify(packageObj).toLowerCase().includes('privacy') ||
    JSON.stringify(packageObj).toLowerCase().includes('gdpr');

  const hasFrontendBundle = hasDependency(dependencies, devDependencies, FRONTEND_HINTS);

  return {
    isMonorepo,
    isService,
    isLibrary,
    hasDatabase,
    hasFeatureFlags,
    hasTypedLanguage,
    hasExternalServices,
    hasPiiSignals,
    hasFrontendBundle,
  };
}
