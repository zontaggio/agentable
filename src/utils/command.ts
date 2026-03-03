import { execFile as execFileCb } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCb);

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  code?: number;
}

/**
 * Execute a shell command with timeout and error handling.
 * @param command - Command executable name
 * @param args - Command arguments
 * @param cwd - Working directory for command execution
 * @returns Result object with stdout, stderr, and success status
 */
export async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFile(command, args, {
      cwd,
      timeout: 20_000,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    });

    return {
      ok: true,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
    };
  } catch (error) {
    const e = error as NodeJS.ErrnoException & {
      stdout?: string;
      stderr?: string;
      code?: number;
    };

    return {
      ok: false,
      stdout: (e.stdout ?? '').trim(),
      stderr: (e.stderr ?? '').trim() || e.message,
      code: typeof e.code === 'number' ? e.code : undefined,
    };
  }
}
