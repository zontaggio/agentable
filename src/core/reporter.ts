import { CATEGORY_LABELS, CRITERIA } from '../catalog/v1';
import { CategoryId, CriterionResult, ScoreSummary } from '../types';

const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
} as const;

function shouldUseColor(): boolean {
  if (process.env.NO_COLOR) {
    return false;
  }
  if (process.env.FORCE_COLOR === '0') {
    return false;
  }
  if (process.env.FORCE_COLOR === '1' || process.env.FORCE_COLOR === '2' || process.env.FORCE_COLOR === '3') {
    return true;
  }
  return Boolean(process.stdout.isTTY);
}

function colorize(text: string, color: keyof typeof ANSI, enabled: boolean, bold = false): string {
  if (!enabled) {
    return text;
  }
  const prefix = `${bold ? ANSI.bold : ''}${ANSI[color]}`;
  return `${prefix}${text}${ANSI.reset}`;
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : `${value}${' '.repeat(width - value.length)}`;
}

function padLeft(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : `${' '.repeat(width - value.length)}${value}`;
}

function percent(value: number): string {
  return `${Math.round(value)}%`;
}

function hr(width: number, char = '-'): string {
  return char.repeat(Math.max(8, width));
}

function statusLabel(status: CriterionResult['status']): string {
  if (status === 'pass') {
    return 'PASS';
  }
  if (status === 'fail') {
    return 'FAIL';
  }
  if (status === 'skip') {
    return 'SKIP';
  }
  return 'UNVERIFIED';
}

function statusColor(status: CriterionResult['status']): keyof typeof ANSI {
  if (status === 'pass') {
    return 'green';
  }
  if (status === 'fail') {
    return 'red';
  }
  if (status === 'skip') {
    return 'yellow';
  }
  return 'magenta';
}

function scoreColor(score: number): keyof typeof ANSI {
  if (score >= 75) {
    return 'green';
  }
  if (score >= 50) {
    return 'yellow';
  }
  return 'red';
}

function wrapText(text: string, width: number, indent = ''): string[] {
  if (text.length <= width) {
    return [`${indent}${text}`];
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [`${indent}${text}`];
  }

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(`${indent}${current}`);
    }
    current = word;
  }

  if (current) {
    lines.push(`${indent}${current}`);
  }

  return lines;
}

function getCategoryOrder(): CategoryId[] {
  const order: CategoryId[] = [];
  const seen = new Set<CategoryId>();
  for (const criterion of CRITERIA) {
    if (!seen.has(criterion.category)) {
      seen.add(criterion.category);
      order.push(criterion.category);
    }
  }
  return order;
}

function buildCategorySummaryTable(summary: ScoreSummary, colorEnabled: boolean): string[] {
  const rows: string[] = [];
  const categoryMap = new Map(summary.categoryScores.map((item) => [item.category, item]));

  const categoryWidth = 28;
  const passWidth = 4;
  const failWidth = 4;
  const skipWidth = 4;
  const unvWidth = 4;
  const scoreWidth = 7;

  rows.push(
    `${padRight('Category', categoryWidth)} ${padLeft('PASS', passWidth)} ${padLeft('FAIL', failWidth)} ${padLeft('SKIP', skipWidth)} ${padLeft('UNV', unvWidth)} ${padLeft('Score', scoreWidth)}`,
  );
  rows.push(hr(categoryWidth + passWidth + failWidth + skipWidth + unvWidth + scoreWidth + 5));

  for (const category of getCategoryOrder()) {
    const item = categoryMap.get(category);
    const label = CATEGORY_LABELS[category];
    const pass = String(item?.pass ?? 0);
    const fail = String(item?.fail ?? 0);
    const skip = String(item?.skip ?? 0);
    const unv = String(item?.unverified ?? 0);
    const scoreText = `${(item?.score ?? 0).toFixed(0)}%`;

    const scoreDisplay = colorize(padLeft(scoreText, scoreWidth), scoreColor(item?.score ?? 0), colorEnabled, true);

    rows.push(
      `${padRight(label, categoryWidth)} ${padLeft(pass, passWidth)} ${padLeft(fail, failWidth)} ${padLeft(skip, skipWidth)} ${padLeft(unv, unvWidth)} ${scoreDisplay}`,
    );
  }

  return rows;
}

function renderCriterionDetail(
  result: CriterionResult,
  colorEnabled: boolean,
  width: number,
  verbose: boolean,
): string[] {
  const lines: string[] = [];
  const label = statusLabel(result.status);
  const coloredLabel = colorize(label, statusColor(result.status), colorEnabled, true);
  const header = `  [${coloredLabel}] ${result.id}`;
  lines.push(header);

  for (const wrapped of wrapText(result.reason, width - 6, '      ')) {
    lines.push(wrapped);
  }

  if (verbose && result.evidence.length > 0) {
    for (const evidence of result.evidence) {
      for (const wrapped of wrapText(`- ${evidence}`, width - 8, '        ')) {
        lines.push(wrapped);
      }
    }
  }

  return lines;
}

export function renderReport(
  summary: ScoreSummary,
  results: CriterionResult[],
  options?: { verbose?: boolean; warnings?: string[] },
): string {
  const colorEnabled = shouldUseColor();
  const width = Math.max(90, Math.min(process.stdout.columns ?? 110, 140));
  const lines: string[] = [];

  lines.push(colorize('AGENTABLE REPORT', 'cyan', colorEnabled, true));
  lines.push(hr(width, '='));
  lines.push(
    `Agentable Score: ${colorize(summary.score.toFixed(2), scoreColor(summary.score), colorEnabled, true)} / 100`,
  );
  lines.push(
    `Coverage: ${colorize(summary.coverage.toFixed(2), scoreColor(summary.coverage), colorEnabled, true)}% (${summary.counts.evaluated}/${summary.counts.total} evaluated)`,
  );
  lines.push(
    `Counts: ${colorize(`PASS ${summary.counts.pass}`, 'green', colorEnabled, true)} | ${colorize(`FAIL ${summary.counts.fail}`, 'red', colorEnabled, true)} | ${colorize(`SKIP ${summary.counts.skip}`, 'yellow', colorEnabled, true)} | ${colorize(`UNVERIFIED ${summary.counts.unverified}`, 'magenta', colorEnabled, true)}`,
  );
  lines.push('');
  lines.push(colorize('Category Summary', 'blue', colorEnabled, true));
  lines.push(...buildCategorySummaryTable(summary, colorEnabled));
  lines.push('');
  lines.push(colorize('Detailed Criteria', 'blue', colorEnabled, true));

  const categoryOrder = getCategoryOrder();
  const grouped = new Map<CategoryId, CriterionResult[]>();
  for (const result of results) {
    if (!grouped.has(result.category)) {
      grouped.set(result.category, []);
    }
    grouped.get(result.category)?.push(result);
  }

  for (const category of categoryOrder) {
    const categoryResults = grouped.get(category) ?? [];
    const catSummary = summary.categoryScores.find((entry) => entry.category === category);
    const evaluated = (catSummary?.pass ?? 0) + (catSummary?.fail ?? 0);
    const title = `${CATEGORY_LABELS[category]} (${catSummary?.pass ?? 0}/${evaluated || 0} | ${percent(catSummary?.score ?? 0)})`;
    lines.push('');
    lines.push(colorize(title, 'cyan', colorEnabled, true));
    lines.push(hr(Math.min(width, 70)));

    for (const result of categoryResults) {
      lines.push(...renderCriterionDetail(result, colorEnabled, width, Boolean(options?.verbose)));
    }
  }

  if (options?.warnings && options.warnings.length > 0) {
    lines.push('');
    lines.push(colorize('Warnings', 'yellow', colorEnabled, true));
    lines.push(hr(Math.min(width, 70)));
    for (const warning of options.warnings) {
      for (const wrapped of wrapText(warning, width - 4, '  - ')) {
        lines.push(colorize(wrapped, 'yellow', colorEnabled));
      }
    }
  }

  return lines.join('\n');
}
