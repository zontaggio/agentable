import { stdout as output } from 'node:process';

const ANSI_ESCAPE_REGEX = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

export const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  cyan: '\u001b[36m',
  magenta: '\u001b[35m',
  green: '\u001b[32m',
} as const;

export function paint(text: string, color: keyof typeof ANSI, bold = false): string {
  if (!output.isTTY) {
    return text;
  }
  const prefix = `${bold ? ANSI.bold : ''}${ANSI[color]}`;
  return `${prefix}${text}${ANSI.reset}`;
}

export function visibleLength(text: string): number {
  return text.replace(ANSI_ESCAPE_REGEX, '').length;
}

export function padRightAnsi(text: string, width: number): string {
  const len = visibleLength(text);
  if (len >= width) {
    return text;
  }
  return `${text}${' '.repeat(width - len)}`;
}
