import { CriterionEvidenceDetail } from '../types';

export interface RemediationPromptInput {
  repoName: string;
  signalName: string;
  scoreLabel: string;
  description: string;
  reason: string;
  evidence: string[];
  evidenceDetails: CriterionEvidenceDetail[];
}

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function toSafeText(value: string, fallback: string): string {
  const normalized = normalizeLine(value);
  return normalized.length > 0 ? normalized : fallback;
}

function buildEvidenceLines(input: RemediationPromptInput): string[] {
  const detailLines = Array.isArray(input.evidenceDetails)
    ? input.evidenceDetails
        .map((detail) => {
          const kind = toSafeText(String(detail.kind ?? ''), 'text');
          const strength = toSafeText(String(detail.strength ?? ''), 'weak');
          const body = toSafeText(String(detail.detail ?? ''), 'No detail provided.');
          return `${kind} (${strength}): ${body}`;
        })
        .filter((line) => line.length > 0)
    : [];

  const plainLines = Array.isArray(input.evidence)
    ? input.evidence
        .map((line) => `text note: ${toSafeText(String(line), 'No detail provided.')}`)
        .filter((line) => line.length > 0)
    : [];

  const merged = Array.from(new Set([...detailLines, ...plainLines]));
  if (merged.length > 0) {
    return merged.slice(0, 12);
  }

  return [
    'No explicit evidence lines were captured in this run; inspect repository dependencies, configuration files, and CI workflows directly.',
  ];
}

function renderEvidenceList(lines: string[]): string {
  return lines.map((line) => `  - ${line}`).join('\n');
}

export function buildRemediationPrompt(input: RemediationPromptInput): string {
  const repoName = toSafeText(input.repoName, 'repository');
  const signalName = toSafeText(input.signalName, 'Unknown Signal');
  const scoreLabel = toSafeText(input.scoreLabel, 'N/A');
  const description = toSafeText(input.description, 'No description available.');
  const reason = toSafeText(input.reason, 'No failure reason was recorded.');
  const evidenceLines = buildEvidenceLines(input);

  return [
    `[Readiness Fix] ${repoName} ${signalName}`,
    '',
    `Fix the failing signal: ${signalName} ([${scoreLabel}])`,
    '',
    '<system-reminder>',
    'You are fixing an Agent Readiness signal. Agent Readiness evaluates how well a repository supports autonomous AI agents working on the codebase.',
    '',
    '## Failing Signal',
    '',
    `**Signal**: ${signalName}`,
    `**Score**: [${scoreLabel}]`,
    `**Description**: ${description}`,
    `**Why it failed**: ${reason}`,
    '',
    '## Original Signal Evaluation Criteria',
    '',
    'The agent readiness report evaluated this signal conservatively using:',
    `- Expected capability: ${description}`,
    '- Evidence types considered: dependency, file, workflow, gh, ai, text',
    '- PASS when explicit, strong evidence is present',
    '- UNVERIFIED when only weak or indirect evidence exists, or external data is unavailable',
    '- FAIL when no qualifying evidence is detected',
    '- Evidence captured in this run:',
    renderEvidenceList(evidenceLines),
    '',
    '## Your Task',
    '',
    '1. Explore the repository to understand the current state related to this signal',
    '2. Make substantive improvements to the codebase that genuinely address the signal',
    '3. Verify your fix addresses the issue with appropriate checks (tests, lint, or relevant validation)',
    '4. Keep changes focused on this signal and avoid unrelated refactors',
    '5. Open a pull request with the changes and return the PR URL',
    '',
    '## CRITICAL: Quality Standards',
    '',
    'Your fix must genuinely improve the codebase. Do not use workarounds or shortcuts:',
    '- NO empty placeholder files or stub configurations',
    '- NO disabling checks or adding skip markers to force a pass',
    '- NO minimal changes that game the metric without meaningful value',
    '- Prefer concrete implementations, meaningful tests, and enforceable automation',
    '',
    '## Completion',
    '',
    '- IMPORTANT: when code changes are made, open a pull request and return the PR URL',
    '- Provide a succinct summary of what changed and why it genuinely improves the codebase',
    '</system-reminder>',
  ].join('\n');
}
