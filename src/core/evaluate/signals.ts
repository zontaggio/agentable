import path from 'node:path';
import { LocalProjectContext } from '../../types';
import { safeReadText } from '../../utils/files';
import { EvalSignals } from './types';

export async function buildSignals(local: LocalProjectContext): Promise<EvalSignals> {
  const readmeText = local.readmePath
    ? await safeReadText(path.join(local.rootPath, local.readmePath))
    : '';

  const workflowTextParts: string[] = [];
  for (const workflow of local.workflowFiles) {
    const text = await safeReadText(path.join(local.rootPath, workflow));
    workflowTextParts.push(text);
  }

  const candidateIndexFiles = local.files.filter((file) =>
    /(readme|docs\/|\.github\/workflows\/|package\.json|tsconfig\.json|pyproject\.toml|docker-compose|dockerfile)/i.test(
      file,
    ),
  );

  const indexParts: string[] = [];
  for (const rel of candidateIndexFiles.slice(0, 250)) {
    const text = await safeReadText(path.join(local.rootPath, rel));
    if (text) {
      indexParts.push(text.slice(0, 5_000));
    }
  }

  const testFiles = local.files.filter((file) => /(test|spec)/i.test(file));
  const integrationTestFiles = local.files.filter((file) =>
    /(integration|acceptance|e2e|it\.|test\/integration|test\/acceptance)/i.test(file),
  );
  const unitTestFiles = local.files.filter((file) => /((^|\/)test\/.+|\.test\.|\.spec\.)/i.test(file));

  return {
    readmeText: readmeText.toLowerCase(),
    workflowText: workflowTextParts.join('\n').toLowerCase(),
    allTextIndex: indexParts.join('\n').toLowerCase(),
    testFiles,
    integrationTestFiles,
    unitTestFiles,
  };
}
