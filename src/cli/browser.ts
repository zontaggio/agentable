import { spawn } from 'node:child_process';

export async function openBrowser(url: string): Promise<boolean> {
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

  try {
    const child = spawn(command, args, {
      stdio: 'ignore',
      detached: true,
    });

    return await new Promise<boolean>((resolve) => {
      const finish = (result: boolean) => {
        child.removeAllListeners('spawn');
        child.removeAllListeners('error');
        child.unref();
        resolve(result);
      };

      child.once('spawn', () => {
        finish(true);
      });
      child.once('error', () => {
        finish(false);
      });
    });
  } catch {
    return false;
  }
}
