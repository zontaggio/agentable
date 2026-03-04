import { spawn } from 'node:child_process';

export function openBrowser(url: string): void {
  const platform = process.platform;

  let command: string;
  let args: string[];

  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, {
    stdio: 'ignore',
    detached: true,
  });

  child.on('error', () => {
    // Ignore browser-launch errors; URL is still printed.
  });
  child.unref();
}
