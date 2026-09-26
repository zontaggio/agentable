import { spawn } from 'node:child_process';

/**
 * Opens an http(s) URL in the default browser. Anything else is refused, and on
 * Windows the URL is handed to the URL protocol handler directly rather than through
 * `cmd /c start`, where characters such as `&` would be interpreted by the shell.
 */
export async function openBrowser(url: string): Promise<boolean> {
  let target: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    target = parsed.href;
  } catch {
    return false;
  }

  let command: string;
  let args: string[];

  if (process.platform === 'darwin') {
    command = 'open';
    args = [target];
  } else if (process.platform === 'win32') {
    command = 'rundll32';
    args = ['url.dll,FileProtocolHandler', target];
  } else {
    command = 'xdg-open';
    args = [target];
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
