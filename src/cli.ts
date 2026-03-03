#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import asciiLogo from 'cli-ascii-logo';
import { DEFAULT_OPENROUTER_MODEL } from './collectors/ai';
import { runAgentReadiness } from './core/engine';
import { getUserConfigPath, loadUserConfig, saveUserConfig } from './core/user-config';
import { RunOptions } from './types';
import { startWebServer } from './web/server';

interface CliOptions {
  runOptions: RunOptions;
  web: boolean;
  host: string;
  port: number;
  setup: boolean;
}

const BRAND_NAME = 'Agentable';
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*m/g;

const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  cyan: '\u001b[36m',
  magenta: '\u001b[35m',
  green: '\u001b[32m',
} as const;

function paint(text: string, color: keyof typeof ANSI, bold = false): string {
  if (!output.isTTY) {
    return text;
  }
  const prefix = `${bold ? ANSI.bold : ''}${ANSI[color]}`;
  return `${prefix}${text}${ANSI.reset}`;
}

function visibleLength(text: string): number {
  return text.replace(ANSI_ESCAPE_REGEX, '').length;
}

function padRightAnsi(text: string, width: number): string {
  const len = visibleLength(text);
  if (len >= width) {
    return text;
  }
  return `${text}${' '.repeat(width - len)}`;
}

function printAgentableBanner(): void {
  if (!output.isTTY) {
    return;
  }

  const art = asciiLogo.createLogo(BRAND_NAME, 'cyberpunk').split('\n').filter((line) => line.length > 0);

  console.log('');
  console.log(art.join('\n'));
  console.log(paint('Deterministic repository readiness scanner', 'dim'));
  console.log('');
}

function printHelp(): void {
  console.log(
    `${BRAND_NAME}\n\nUsage:\n  agentable [path] [--verbose] [--no-gh] [--web] [--terminal] [--host <ip>] [--port <n>] [--setup]\n\nOptions:\n  --verbose   Show additional evidence lines\n  --no-gh     Disable GitHub checks via gh CLI\n  --web       Force interactive web dashboard mode (default)\n  --terminal  Force terminal report output\n  --host      Host interface for web mode (default: 127.0.0.1)\n  --port      Port for web mode (default: 4173)\n  --setup     Configure OpenRouter API key/model and persist locally\n  --help      Show this help\n\nConfig:\n  OpenRouter AI is required. First run prompts for API key and model.\n  Saved at: ${getUserConfigPath()}\n`,
  );
}

function parseArgs(argv: string[]): CliOptions | null {
  const args = [...argv];

  let repoPath = '.';
  let verbose = false;
  let noGh = false;
  let web = true;
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

    if (arg === '--web') {
      web = true;
      continue;
    }

    if (arg === '--terminal') {
      web = false;
      continue;
    }

    if (arg === '--setup') {
      setup = true;
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
    },
    web,
    host,
    port,
    setup,
  };
}

function printSetupHeader(isReconfigure: boolean): void {
  const title = isReconfigure ? `${BRAND_NAME} Setup (Reconfigure)` : `${BRAND_NAME} First-Time Setup`;
  const lines = [
    '┌─────────────────────────────────────────────────────────────────────┐',
    `│ ${title.padEnd(67)}│`,
    '├─────────────────────────────────────────────────────────────────────┤',
    '│ We store your OpenRouter API key locally on this machine only.     │',
    `│ Config: ${getUserConfigPath().padEnd(57)}│`,
    '└─────────────────────────────────────────────────────────────────────┘',
  ];

  console.log('');
  console.log(paint(lines.join('\n'), 'magenta', true));
  console.log('');
}

async function promptAndSaveUserConfig(currentModel?: string, hasExistingKey = false): Promise<{
  openRouterApiKey: string;
  openRouterModel: string;
}> {
  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      `Interactive setup requires a TTY. Run in a terminal and use --setup. Config path: ${getUserConfigPath()}`,
    );
  }

  printSetupHeader(hasExistingKey);

  const rl = createInterface({ input, output });
  try {
    const apiPrompt = hasExistingKey
      ? `${paint('OpenRouter API key', 'cyan', true)} (press Enter to keep current): `
      : `${paint('OpenRouter API key', 'cyan', true)}: `;

    const apiInput = (await rl.question(apiPrompt)).trim();

    const modelDefault = (currentModel || DEFAULT_OPENROUTER_MODEL).trim();
    const modelInput = (await rl.question(`${paint('OpenRouter model', 'cyan', true)} [${modelDefault}]: `)).trim();
    const openRouterModel = modelInput || modelDefault;

    const existing = await loadUserConfig();
    const openRouterApiKey = apiInput || existing?.openRouterApiKey || '';

    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key is required for AI-enabled runs.');
    }

    const saved = await saveUserConfig({
      openRouterApiKey,
      openRouterModel,
    });

    console.log('');
    console.log(paint(`Saved ${BRAND_NAME} config at ${getUserConfigPath()}`, 'green', true));
    console.log('');

    return {
      openRouterApiKey: saved.openRouterApiKey,
      openRouterModel: saved.openRouterModel,
    };
  } finally {
    rl.close();
  }
}

async function enrichRunOptions(parsed: CliOptions): Promise<RunOptions> {
  const runOptions: RunOptions = { ...parsed.runOptions };

  const existingConfig = await loadUserConfig();

  if (parsed.setup) {
    const configured = await promptAndSaveUserConfig(
      existingConfig?.openRouterModel,
      Boolean(existingConfig?.openRouterApiKey),
    );
    runOptions.aiApiKey = configured.openRouterApiKey;
    runOptions.aiModel = configured.openRouterModel;
    return runOptions;
  }

  if (!existingConfig) {
    if (!input.isTTY || !output.isTTY) {
      throw new Error(
        `OpenRouter config not found and AI is required. Run \`agentable --setup\` in an interactive terminal. Config path: ${getUserConfigPath()}`,
      );
    }
    console.log(`${BRAND_NAME} first-time setup: configure your OpenRouter credentials.`);
    const configured = await promptAndSaveUserConfig(DEFAULT_OPENROUTER_MODEL, false);
    runOptions.aiApiKey = configured.openRouterApiKey;
    runOptions.aiModel = configured.openRouterModel;
    return runOptions;
  }

  runOptions.aiApiKey = existingConfig.openRouterApiKey;
  runOptions.aiModel = existingConfig.openRouterModel || DEFAULT_OPENROUTER_MODEL;
  return runOptions;
}

function drawProgress(label: string, percent: number): void {
  const width = 24;
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;
  const spinnerFrames = ['◐', '◓', '◑', '◒'];
  const frame = spinnerFrames[Math.floor(Date.now() / 110) % spinnerFrames.length] ?? '◐';
  const bar = `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
  const line = `${paint(frame, 'cyan', true)} ${paint(label, 'cyan', true)}  ${String(Math.round(clamped)).padStart(3)}%  ${paint(`▕${bar}▏`, 'dim')}`;
  output.write(`\r${line}`);
}

async function runWithProgress<T>(label: string, task: () => Promise<T>): Promise<T> {
  if (!output.isTTY) {
    return task();
  }

  let percent = 6;
  let ticks = 0;
  drawProgress(label, percent);

  const timer = setInterval(() => {
    ticks += 1;
    const bump = ticks % 5 === 0 ? 2 : 1;
    percent = Math.min(95, percent + bump);
    drawProgress(label, percent);
  }, 120);

  try {
    const result = await task();
    clearInterval(timer);
    drawProgress(label, 100);
    output.write('\n');
    return result;
  } catch (error) {
    clearInterval(timer);
    output.write('\n');
    throw error;
  }
}

function openBrowser(url: string): void {
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

function printDashboardReady(url: string): void {
  if (!output.isTTY) {
    console.log(`Dashboard: ${url}`);
    console.log('Stop: Ctrl+C');
    return;
  }

  const rows = [
    `${paint('DASHBOARD', 'cyan', true)} ${paint('LIVE', 'green', true)}`,
    `${paint('URL ', 'dim')} ${paint(url, 'cyan', true)}`,
    `${paint('OPEN', 'dim')} ${paint('Browser launched', 'green')}`,
    `${paint('STOP', 'dim')} ${paint('Ctrl+C', 'magenta', true)}`,
  ];
  const contentWidth = rows.reduce((max, row) => Math.max(max, visibleLength(row)), 0);

  console.log(`${paint('┌', 'cyan')}${paint('─'.repeat(contentWidth + 2), 'cyan')}${paint('┐', 'cyan')}`);
  for (const row of rows) {
    console.log(`${paint('│', 'cyan')} ${padRightAnsi(row, contentWidth)} ${paint('│', 'cyan')}`);
  }
  console.log(`${paint('└', 'cyan')}${paint('─'.repeat(contentWidth + 2), 'cyan')}${paint('┘', 'cyan')}`);
}

async function main(): Promise<void> {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (!parsed) {
      process.exitCode = 0;
      return;
    }

    printAgentableBanner();

    const runOptions = await enrichRunOptions(parsed);

    if (parsed.web) {
      const started = await runWithProgress('Running analysis', async () =>
        startWebServer({
          runOptions,
          host: parsed.host,
          port: parsed.port,
        }),
      );

      if (output.isTTY) {
        openBrowser(started.url);
      }
      printDashboardReady(started.url);

      const shutdown = async (): Promise<void> => {
        await started.close();
        process.exit(0);
      };

      process.once('SIGINT', () => {
        void shutdown();
      });
      process.once('SIGTERM', () => {
        void shutdown();
      });

      await new Promise<void>(() => {
        // keep process alive while server is running
      });
      return;
    }

    const outputResult = await runWithProgress('Running analysis', async () => runAgentReadiness(runOptions));
    console.log(outputResult.report);
    process.exitCode = 0;
  } catch (error) {
    console.error(
      `agentable failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}

void main();
