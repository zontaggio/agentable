import path from 'node:path';
import { safeReadText } from '../../utils/files';
import { hasAnyFilePattern, includesAny } from './helpers';
import { makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateDevEnvironment(
  input: CriterionEvaluatorInput,
) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
    case 'database_schema':
      return hasAnyFilePattern(local, [/schema\.prisma$/i, /migrations\//i, /db\/schema/i])
        ? makeResult(criterion, 'pass', 'Database schema/migrations detected.')
        : makeResult(criterion, 'fail', 'No database schema or migrations detected.');

    case 'devcontainer':
      return local.fileSet.has('.devcontainer/devcontainer.json')
        ? makeResult(criterion, 'pass', 'Devcontainer configuration file detected.')
        : makeResult(criterion, 'fail', 'Devcontainer configuration not found.');

    case 'devcontainer_runnable': {
      const configPath = path.join(local.rootPath, '.devcontainer/devcontainer.json');
      const content = await safeReadText(configPath);
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        const hasRuntime =
          typeof parsed.image === 'string' ||
          typeof parsed.dockerFile === 'string' ||
          typeof parsed.build === 'object';
        return hasRuntime
          ? makeResult(criterion, 'pass', 'Devcontainer has runtime definition and appears runnable.')
          : makeResult(criterion, 'fail', 'Devcontainer exists but missing image/dockerFile/build settings.');
      } catch {
        return makeResult(criterion, 'fail', 'Unable to parse devcontainer.json.');
      }
    }

    case 'env_template':
      return hasAnyFilePattern(local, [/^\.env\.example$/, /^\.env\.template$/, /^\.env\.sample$/])
        ? makeResult(criterion, 'pass', 'Environment template file detected.')
        : makeResult(criterion, 'fail', 'No environment template file found.');

    case 'local_services_setup':
      return includesAny(signals.readmeText, ['docker compose up', 'local services', 'start dependencies'])
        ? makeResult(criterion, 'pass', 'Local services setup instructions found.')
        : makeResult(criterion, 'fail', 'No local services setup instructions detected.');

    default:
      return null;
  }
}
