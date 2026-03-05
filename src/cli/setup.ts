import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { DEFAULT_OPENROUTER_MODEL } from '../collectors/ai';
import { getUserConfigPath, loadUserConfig, saveUserConfig } from '../core/user-config';
import { RunOptions } from '../types';
import { paint } from './ansi';
import { BRAND_NAME } from './constants';
import { CliOptions } from './types';

function printSetupHeader(isReconfigure: boolean): void {
  const title = isReconfigure
    ? `${BRAND_NAME} Setup (Reconfigure)`
    : `${BRAND_NAME} First-Time Setup`;
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

async function promptAndSaveUserConfig(
  currentModel?: string,
  hasExistingKey = false,
): Promise<{
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
    const modelInput = (
      await rl.question(`${paint('OpenRouter model', 'cyan', true)} [${modelDefault}]: `)
    ).trim();
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

export async function enrichRunOptions(parsed: CliOptions): Promise<RunOptions> {
  const runOptions: RunOptions = { ...parsed.runOptions };
  const aiFailureMode = runOptions.aiFailureMode ?? 'fallback';
  runOptions.aiFailureMode = aiFailureMode;

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
    if (aiFailureMode === 'strict' && (!input.isTTY || !output.isTTY)) {
      throw new Error(
        `OpenRouter config not found and strict AI mode is enabled. Run \`agentable --setup\` in an interactive terminal or switch to --ai-failure-mode=fallback. Config path: ${getUserConfigPath()}`,
      );
    }

    if (aiFailureMode === 'strict') {
      console.log(`${BRAND_NAME} first-time setup: configure your OpenRouter credentials.`);
      const configured = await promptAndSaveUserConfig(DEFAULT_OPENROUTER_MODEL, false);
      runOptions.aiApiKey = configured.openRouterApiKey;
      runOptions.aiModel = configured.openRouterModel;
      return runOptions;
    }

    console.log(
      `${BRAND_NAME}: OpenRouter config not found. Continuing in fallback mode with AI-assisted criteria marked as unverified.`,
    );
    return runOptions;
  }

  runOptions.aiApiKey = existingConfig.openRouterApiKey;
  runOptions.aiModel = existingConfig.openRouterModel || DEFAULT_OPENROUTER_MODEL;
  return runOptions;
}
