import { stdout as output } from 'node:process';
import { paint } from './ansi';

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

function drawBar(percent: number): string {
  const width = 24;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  const percentText = `${String(Math.round(clamped)).padStart(3)}%`;
  return `${paint(percentText, 'cyan', true)} ${paint(`▕${bar}▏`, 'dim')}`;
}

export function createProgressReporter(label: string): ProgressHandle {
  if (!output.isTTY) {
    return { reporter: () => {}, done: () => {}, fail: () => {} };
  }

  const spinnerFrames = ['◐', '◓', '◑', '◒'];
  let currentStep = '';
  let percent = 0;

  // Write two lines; cursor ends at start of line 1 ready to overwrite
  const writeLines = (finalize = false): void => {
    const frame = spinnerFrames[Math.floor(Date.now() / 110) % spinnerFrames.length] ?? '◐';
    const stepPart = currentStep ? ` · ${currentStep}` : '';
    const line1 = `${paint(frame, 'cyan', true)} ${paint(label, 'cyan')}${paint(stepPart, 'dim')}`;
    const line2 = `  ${drawBar(percent)}`;
    const eol = '\x1b[K'; // clear to end of line

    if (finalize) {
      output.write(`\r${eol}${line1}\n\r${eol}${line2}\n`);
    } else {
      // Write both lines then move cursor back to line 1
      output.write(`\r${eol}${line1}\n\r${eol}${line2}\x1b[1A`);
    }
  };

  writeLines();
  const timer = setInterval(writeLines, 110);

  return {
    reporter: (step) => {
      currentStep = step;
      const idx = STEPS.indexOf(step);
      if (idx >= 0) {
        percent = Math.round((idx / STEPS.length) * 100);
      }
      writeLines();
    },
    done: () => {
      clearInterval(timer);
      percent = 100;
      currentStep = '';
      writeLines(true);
    },
    fail: () => {
      clearInterval(timer);
      output.write('\n\n');
    },
  };
}
