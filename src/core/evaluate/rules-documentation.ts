import { readReadmeMtimeMs } from '../../collectors/local';
import { hasAnyDependency, hasAnyFilePattern, hasAnyScript, includesAny } from './helpers';
import { makeResult } from './result';
import { CriterionEvaluatorInput } from './types';

export async function evaluateDocumentation(input: CriterionEvaluatorInput) {
  const { criterion, ctx, signals } = input;
  const { local } = ctx;

  switch (criterion.id) {
    case 'agents_md':
      return local.fileSet.has('AGENTS.md')
        ? makeResult(criterion, 'pass', 'AGENTS.md exists at repository root.')
        : makeResult(criterion, 'fail', 'AGENTS.md not found at repository root.');

    case 'agents_md_validation':
      return local.fileSet.has('AGENTS.md') &&
        includesAny(signals.workflowText, ['agents.md', 'agent readiness'])
        ? makeResult(criterion, 'pass', 'AGENTS.md validation appears in CI workflows.')
        : makeResult(
            criterion,
            local.fileSet.has('AGENTS.md') ? 'fail' : 'skip',
            local.fileSet.has('AGENTS.md')
              ? 'AGENTS.md exists but no validation automation detected.'
              : 'Skipped - AGENTS.md is not present.',
            [],
            [],
            undefined,
            local.fileSet.has('AGENTS.md'),
          );

    case 'api_schema_docs':
      return hasAnyFilePattern(local, [
        /openapi\.(ya?ml|json)$/i,
        /swagger\.(ya?ml|json)$/i,
        /docs\/api\//i,
      ])
        ? makeResult(criterion, 'pass', 'API schema documentation files detected.')
        : makeResult(criterion, 'fail', 'No API schema documentation detected.');

    case 'automated_doc_generation':
      return hasAnyDependency(local, ['typedoc', 'docusaurus', 'mkdocs', 'sphinx']) ||
        hasAnyScript(local, [/typedoc|docs:build|mkdocs|sphinx/i]) ||
        includesAny(signals.workflowText, ['typedoc', 'docs'])
        ? makeResult(criterion, 'pass', 'Automated doc generation tooling detected.')
        : makeResult(criterion, 'fail', 'No automated documentation generation detected.');

    case 'documentation_freshness': {
      const mtimeMs = await readReadmeMtimeMs(local);
      if (!mtimeMs) {
        return makeResult(criterion, 'fail', 'README not found to assess freshness.');
      }
      const ageDays = Math.floor((Date.now() - mtimeMs) / (1000 * 60 * 60 * 24));
      return ageDays <= 180
        ? makeResult(criterion, 'pass', `README updated within ${ageDays} days.`)
        : makeResult(criterion, 'fail', `README appears stale (${ageDays} days since update).`);
    }

    case 'readme':
      return local.readmePath
        ? makeResult(criterion, 'pass', `README detected at ${local.readmePath}.`)
        : makeResult(criterion, 'fail', 'README not found.');

    case 'service_flow_documented': {
      if (hasAnyFilePattern(local, [/architecture/i, /adr\//i, /diagram/i, /service-flow/i])) {
        return makeResult(
          criterion,
          'pass',
          'Architecture/service flow documentation files detected.',
        );
      }

      if (criterion.aiAssisted) {
        return makeResult(
          criterion,
          'unverified',
          'Service flow documentation quality requires AI semantic assessment (no baseline found).',
        );
      }

      return makeResult(criterion, 'fail', 'No service flow documentation signals found.');
    }

    case 'skills':
      return hasAnyFilePattern(local, [
        /^\.factory\/skills\//,
        /^\.skills\//,
        /^\.claude\/skills\//,
      ])
        ? makeResult(criterion, 'pass', 'Skills directory detected.')
        : makeResult(criterion, 'fail', 'No recognized skills directory found.');

    default:
      return null;
  }
}
