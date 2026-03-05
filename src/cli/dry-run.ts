import path from 'node:path';
import { CATEGORY_LABELS, CRITERIA } from '../catalog/v1';
import { collectLocalProjectContext } from '../collectors/local';
import { buildProjectProfile } from '../core/profile';
import { evaluateApplicabilitySkip } from '../core/evaluate/applicability';
import { CriterionDefinition } from '../types';
import { paint } from './ansi';

interface CatalogDryRunRow {
  criterion: CriterionDefinition;
  skipReason: string | null;
}

function skipReasonFromProjectConfig(
  criterionId: string,
  local: Awaited<ReturnType<typeof collectLocalProjectContext>>,
): string | null {
  const override = local.projectConfig.overrides[criterionId];
  if (override?.applicable === false) {
    return override.reason || 'Skipped via .agentable.json override.';
  }

  if (local.projectConfig.skip.includes(criterionId)) {
    return 'Skipped via .agentable.json skip list.';
  }

  return null;
}

function tableRow(values: string[]): string {
  return `| ${values.map((value) => value.replaceAll('\n', ' ').replaceAll('|', '\\|')).join(' | ')} |`;
}

function truncate(input: string, limit: number): string {
  if (input.length <= limit) {
    return input;
  }
  return `${input.slice(0, limit - 1)}...`;
}

function printCatalogTable(rows: CatalogDryRunRow[]): void {
  console.log('');
  console.log(paint('Criteria Catalog', 'magenta', true));
  console.log(tableRow(['id', 'category', 'source', 'aiAssisted', 'description']));
  console.log(tableRow(['---', '---', '---', '---', '---']));

  for (const row of rows) {
    console.log(
      tableRow([
        row.criterion.id,
        CATEGORY_LABELS[row.criterion.category],
        row.criterion.source,
        row.criterion.aiAssisted ? 'yes' : 'no',
        truncate(row.criterion.description, 120),
      ]),
    );
  }
}

function printApplicabilitySummary(rows: CatalogDryRunRow[]): void {
  const skipped = rows
    .filter((row) => row.skipReason)
    .sort((a, b) => a.criterion.id.localeCompare(b.criterion.id));

  console.log('');
  console.log(paint('Applicability Preview', 'magenta', true));
  if (skipped.length === 0) {
    console.log('No criteria are expected to be skipped for this repository profile.');
    return;
  }

  console.log(tableRow(['criterion', 'wouldSkip', 'reason']));
  console.log(tableRow(['---', '---', '---']));
  for (const row of skipped) {
    console.log(tableRow([row.criterion.id, 'yes', row.skipReason ?? 'Skipped by profile']));
  }
}

export async function runDryRun(repoPath: string): Promise<void> {
  const resolvedPath = path.resolve(repoPath);
  const local = await collectLocalProjectContext(resolvedPath);
  const profile = buildProjectProfile(local);

  const rows: CatalogDryRunRow[] = CRITERIA.map((criterion) => {
    const configuredSkip = skipReasonFromProjectConfig(criterion.id, local);
    const applicability = evaluateApplicabilitySkip(criterion.id, profile, local);
    return {
      criterion,
      skipReason:
        configuredSkip ||
        (applicability.skip ? (applicability.reason ?? 'Skipped by profile') : null),
    };
  });

  console.log('');
  console.log(paint(`Dry-run repository: ${resolvedPath}`, 'cyan', true));
  console.log(`Detected files: ${local.files.length}`);
  console.log(`Estimated LOC sample: ${local.locEstimate}`);
  console.log('');
  console.log(`Criteria total: ${rows.length}`);
  console.log(`AI-assisted criteria: ${rows.filter((row) => row.criterion.aiAssisted).length}`);
  console.log(`Criteria expected to skip: ${rows.filter((row) => row.skipReason).length}`);

  printCatalogTable(rows);
  printApplicabilitySummary(rows);

  console.log('');
  console.log(
    paint(
      'Dry-run complete. No engine run, server startup, or AI calls were performed.',
      'green',
      true,
    ),
  );
  console.log('');
}
