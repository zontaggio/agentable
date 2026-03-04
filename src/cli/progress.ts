import { stdout as output } from 'node:process';
import { paint } from './ansi';

export type ProgressReporter = (step: string) => void;

export interface ProgressHandle {
  reporter: ProgressReporter;
  done: () => void;
  fail: () => void;
}

export function createProgressReporter(label: string): ProgressHandle {
  if (!output.isTTY) {
    return { reporter: () => {}, done: () => {}, fail: () => {} };
  }

  const spinnerFrames = ['◐', '◓', '◑', '◒'];
  let currentStep = '';
  let lastLineWidth = 0;

  const writeLine = (): void => {
    const frame = spinnerFrames[Math.floor(Date.now() / 110) % spinnerFrames.length] ?? '◐';
    const stepPart = currentStep ? ` · ${currentStep}` : '';
    const line = `${paint(frame, 'cyan', true)} ${paint(label, 'cyan')}${paint(stepPart, 'dim')}`;
    const pad = lastLineWidth > line.length ? ' '.repeat(lastLineWidth - line.length) : '';
    output.write(`\r${line}${pad}`);
    lastLineWidth = Math.max(lastLineWidth, line.length);
  };

  writeLine();
  const timer = setInterval(writeLine, 110);

  return {
    reporter: (step) => {
      currentStep = step;
      writeLine();
    },
    done: () => {
      clearInterval(timer);
      output.write('\n');
    },
    fail: () => {
      clearInterval(timer);
      output.write('\n');
    },
  };
}
