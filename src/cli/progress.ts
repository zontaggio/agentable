import { stdout as output } from 'node:process';
import { paint, visibleLength } from './ansi';

export type ProgressReporter = (step: string) => void;

export interface ProgressHandle {
  reporter: ProgressReporter;
  done: () => void;
  fail: () => void;
}

const STEPS = [
  'Scanning repository',
  'Collecting git data',
  'Checking GitHub',
  'Running AI assessments',
  'Evaluating criteria',
  'Building action plan',
  'Enriching recommendations',
];

function drawProgress(label: string, stepLabel: string, percent: number): string {
  const width = 24;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const spinnerFrames = ['◐', '◓', '◑', '◒'];
  const frame = spinnerFrames[Math.floor(Date.now() / 110) % spinnerFrames.length] ?? '◐';
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  const percentText = `${String(Math.round(clamped)).padStart(3)}%`;
  const stepPart = stepLabel ? ` · ${stepLabel}` : '';
  return `${paint(frame, 'cyan', true)} ${paint(percentText, 'cyan', true)} ${paint(`▕${bar}▏`, 'dim')} ${paint(label, 'cyan')}${paint(stepPart, 'dim')}`;
}

export function createProgressReporter(label: string): ProgressHandle {
  if (!output.isTTY) {
    return { reporter: () => {}, done: () => {}, fail: () => {} };
  }

  let currentStep = '';
  let percent = 0;
  let lastLineWidth = 0;

  const writeProgress = (): void => {
    const line = drawProgress(label, currentStep, percent);
    const lineWidth = visibleLength(line);
    const clearPad = lastLineWidth > lineWidth ? ' '.repeat(lastLineWidth - lineWidth) : '';
    output.write(`\r${line}${clearPad}`);
    lastLineWidth = Math.max(lastLineWidth, lineWidth);
  };

  writeProgress();
  const timer = setInterval(writeProgress, 110);

  return {
    reporter: (step) => {
      currentStep = step;
      const idx = STEPS.indexOf(step);
      if (idx >= 0) {
        percent = Math.round((idx / STEPS.length) * 100);
      }
      writeProgress();
    },
    done: () => {
      clearInterval(timer);
      currentStep = '';
      percent = 100;
      writeProgress();
      output.write('\n');
    },
    fail: () => {
      clearInterval(timer);
      output.write('\n');
    },
  };
}
