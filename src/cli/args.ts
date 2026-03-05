import { CliOptions } from './types';
import { printHelp } from './help';

export function parseArgs(argv: string[]): CliOptions | null {
  const args = [...argv];

  let repoPath = '.';
  let verbose = false;
  let noGh = false;
  let aiFailureMode: 'fallback' | 'strict' = 'fallback';
  let host = '127.0.0.1';
  let port = 4173;
  let setup = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg) {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      return null;
    }

    if (arg === '--verbose') {
      verbose = true;
      continue;
    }

    if (arg === '--no-ai') {
      throw new Error('Option --no-ai was removed. AI is now mandatory.');
    }

    if (arg === '--no-gh') {
      noGh = true;
      continue;
    }

    if (arg === '--terminal') {
      throw new Error(
        'Option --terminal was removed. Agentable now runs in web dashboard mode only.',
      );
    }

    if (arg === '--web') {
      continue;
    }

    if (arg === '--report') {
      throw new Error(
        'Option --report is not supported. Agentable now runs in web dashboard mode only.',
      );
    }

    if (arg === '--setup') {
      setup = true;
      continue;
    }

    if (arg === '--ai-failure-mode') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('--ai-failure-mode expects one of: fallback, strict.');
      }
      if (value !== 'fallback' && value !== 'strict') {
        throw new Error(`Invalid --ai-failure-mode value: ${value}`);
      }
      aiFailureMode = value;
      i += 1;
      continue;
    }

    if (arg.startsWith('--ai-failure-mode=')) {
      const value = arg.split('=', 2)[1];
      if (value !== 'fallback' && value !== 'strict') {
        throw new Error(`Invalid --ai-failure-mode value: ${value ?? ''}`);
      }
      aiFailureMode = value;
      continue;
    }

    if (arg === '--host') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('--host expects a value.');
      }
      host = value;
      i += 1;
      continue;
    }

    if (arg.startsWith('--host=')) {
      const value = arg.split('=', 2)[1];
      if (!value) {
        throw new Error('--host expects a value.');
      }
      host = value;
      continue;
    }

    if (arg === '--port') {
      const value = args[i + 1];
      if (!value) {
        throw new Error('--port expects a numeric value.');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(`Invalid --port value: ${value}`);
      }
      port = parsed;
      i += 1;
      continue;
    }

    if (arg.startsWith('--port=')) {
      const value = arg.split('=', 2)[1];
      const parsed = Number.parseInt(value ?? '', 10);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(`Invalid --port value: ${value ?? ''}`);
      }
      port = parsed;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    repoPath = arg;
  }

  return {
    runOptions: {
      repoPath,
      verbose,
      noGh,
      aiFailureMode,
    },
    host,
    port,
    setup,
  };
}
