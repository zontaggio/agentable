import { stdout as output } from 'node:process';
import { padRightAnsi, paint, visibleLength } from './ansi';

export function printDashboardReady(url: string, browserOpened?: boolean): void {
  if (!output.isTTY) {
    console.log(`Dashboard: ${url}`);
    console.log('Stop: Ctrl+C');
    return;
  }

  const openLabel =
    browserOpened === false ? 'Open manually if auto-open failed' : 'Auto-open requested';
  const rows = [
    `${paint('DASHBOARD', 'cyan', true)} ${paint('LIVE', 'green', true)}`,
    `${paint('URL ', 'dim')} ${paint(url, 'cyan', true)}`,
    `${paint('OPEN', 'dim')} ${paint(openLabel, browserOpened === false ? 'magenta' : 'green')}`,
    `${paint('STOP', 'dim')} ${paint('Ctrl+C', 'magenta', true)}`,
  ];
  const contentWidth = rows.reduce((max, row) => Math.max(max, visibleLength(row)), 0);

  console.log(
    `${paint('┌', 'cyan')}${paint('─'.repeat(contentWidth + 2), 'cyan')}${paint('┐', 'cyan')}`,
  );
  for (const row of rows) {
    console.log(`${paint('│', 'cyan')} ${padRightAnsi(row, contentWidth)} ${paint('│', 'cyan')}`);
  }
  console.log(
    `${paint('└', 'cyan')}${paint('─'.repeat(contentWidth + 2), 'cyan')}${paint('┘', 'cyan')}`,
  );
}
