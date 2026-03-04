import { stdout as output } from 'node:process';
import { paint, visibleLength } from './ansi';

function drawProgress(stageLabel: string, percent: number): string {
  const width = 24;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const spinnerFrames = ['◐', '◓', '◑', '◒'];
  const frame = spinnerFrames[Math.floor(Date.now() / 110) % spinnerFrames.length] ?? '◐';
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  const percentText = `${String(Math.round(clamped)).padStart(3)}%`;
  return `${paint(frame, 'cyan', true)} ${paint(percentText, 'cyan', true)} ${paint(`▕${bar}▏`, 'dim')} ${paint(stageLabel, 'cyan')}`;
}

function progressPhaseLabel(baseLabel: string, percent: number): string {
  if (percent < 35) {
    return `${baseLabel} · Scanning repository`;
  }
  if (percent < 60) {
    return `${baseLabel} · Collecting project signals`;
  }
  if (percent < 82) {
    return `${baseLabel} · Evaluating criteria`;
  }
  if (percent < 94) {
    return `${baseLabel} · Building action plan`;
  }
  if (percent < 99) {
    return `${baseLabel} · Finalizing analysis`;
  }
  return `${baseLabel} · Waiting for completion`;
}

export async function runWithProgress<T>(label: string, task: () => Promise<T>): Promise<T> {
  if (!output.isTTY) {
    return task();
  }

  let percent = 6;
  let ticks = 0;
  let lastLineWidth = 0;
  const writeProgress = (value: number): void => {
    const dynamicLabel = progressPhaseLabel(label, value);
    const line = drawProgress(dynamicLabel, value);
    const lineWidth = visibleLength(line);
    const clearPad = lastLineWidth > lineWidth ? ' '.repeat(lastLineWidth - lineWidth) : '';
    output.write(`\r${line}${clearPad}`);
    lastLineWidth = Math.max(lastLineWidth, lineWidth);
  };

  writeProgress(percent);

  const timer = setInterval(() => {
    ticks += 1;
    let bump = 0.12;
    if (percent < 60) {
      bump = ticks % 5 === 0 ? 2 : 1.2;
    } else if (percent < 82) {
      bump = 0.6;
    } else if (percent < 94) {
      bump = 0.25;
    } else if (percent < 99) {
      bump = 0.06;
    }
    percent = Math.min(99, percent + bump);
    writeProgress(percent);
  }, 120);

  try {
    const result = await task();
    clearInterval(timer);
    ticks += 1;
    writeProgress(100);
    output.write('\n');
    return result;
  } catch (error) {
    clearInterval(timer);
    output.write('\n');
    throw error;
  }
}
