import { stdin as input, stdout as output } from 'node:process';
import { createInterface, Interface } from 'node:readline/promises';
import {
  DEFAULT_AI_PROVIDER,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENROUTER_MODEL,
} from '../collectors/ai';
import { DEFAULT_OPENAI_BASE_URL } from '../collectors/providers/openai/http';
import {
  AgentReadinessUserConfig,
  getUserConfigPath,
  loadUserConfig,
  saveUserConfig,
} from '../core/user-config';
import { AiProviderName, RunOptions } from '../types';
import { paint } from './ansi';
import { BRAND_NAME } from './constants';
import { CliOptions } from './types';

function providerLabel(provider: AiProviderName): string {
  return provider === 'openai' ? 'OpenAI-compatible' : 'OpenRouter';
}

function printSetupHeader(isReconfigure: boolean): void {
  const title = isReconfigure
    ? `${BRAND_NAME} Setup (Reconfigure)`
    : `${BRAND_NAME} First-Time Setup`;
  const lines = [
    '┌─────────────────────────────────────────────────────────────────────┐',
    `│ ${title.padEnd(67)}│`,
    '├─────────────────────────────────────────────────────────────────────┤',
    '│ We store your AI provider config locally on this machine only.     │',
    `│ Config: ${getUserConfigPath().padEnd(57)}│`,
    '└─────────────────────────────────────────────────────────────────────┘',
  ];

  console.log('');
  console.log(paint(lines.join('\n'), 'magenta', true));
  console.log('');
}

function normalizeProvider(value: string, fallback: AiProviderName): AiProviderName {
  const low = value.trim().toLowerCase();
  if (!low) {
    return fallback;
  }

  if (low === '1' || low === 'openrouter' || low === 'router') {
    return 'openrouter';
  }
  if (low === '2' || low === 'openai' || low === 'openai-compatible') {
    return 'openai';
  }

  throw new Error('Invalid provider. Choose openrouter or openai.');
}

async function promptProvider(
  rl: Interface,
  existingConfig: AgentReadinessUserConfig | null,
): Promise<AiProviderName> {
  const current = existingConfig?.provider ?? DEFAULT_AI_PROVIDER;
  const answer = await rl.question(
    `${paint('AI provider', 'cyan', true)} [1=openrouter, 2=openai] (${current}): `,
  );
  return normalizeProvider(answer, current);
}

async function promptAndSaveUserConfig(
  existingConfig: AgentReadinessUserConfig | null,
): Promise<AgentReadinessUserConfig> {
  if (!input.isTTY || !output.isTTY) {
    throw new Error(
      `Interactive setup requires a TTY. Run in a terminal and use --setup. Config path: ${getUserConfigPath()}`,
    );
  }

  printSetupHeader(Boolean(existingConfig));

  const rl = createInterface({ input, output });
  try {
    const provider = await promptProvider(rl, existingConfig);
    const isSameProvider = existingConfig?.provider === provider;

    if (provider === 'openrouter') {
      const previousKey = isSameProvider ? (existingConfig?.apiKey ?? '') : '';
      const previousModel =
        isSameProvider && existingConfig?.model ? existingConfig.model : DEFAULT_OPENROUTER_MODEL;

      const apiPrompt = previousKey
        ? `${paint('OpenRouter API key', 'cyan', true)} (press Enter to keep current): `
        : `${paint('OpenRouter API key', 'cyan', true)}: `;
      const apiInput = (await rl.question(apiPrompt)).trim();

      const modelInput = (
        await rl.question(`${paint('OpenRouter model', 'cyan', true)} [${previousModel}]: `)
      ).trim();
      const model = modelInput || previousModel;
      const apiKey = apiInput || previousKey;

      if (!apiKey) {
        throw new Error('OpenRouter API key is required for provider=openrouter.');
      }

      const saved = await saveUserConfig({
        provider,
        apiKey,
        model,
      });

      console.log('');
      console.log(paint(`Saved ${BRAND_NAME} config at ${getUserConfigPath()}`, 'green', true));
      console.log('');

      return saved;
    }

    const previousKey = isSameProvider ? (existingConfig?.apiKey ?? '') : '';
    const previousModel =
      isSameProvider && existingConfig?.model ? existingConfig.model : DEFAULT_OPENAI_MODEL;
    const previousBaseUrl =
      isSameProvider && existingConfig?.baseUrl ? existingConfig.baseUrl : DEFAULT_OPENAI_BASE_URL;

    const apiPrompt = previousKey
      ? `${paint('OpenAI API key', 'cyan', true)} (optional, Enter keeps current): `
      : `${paint('OpenAI API key', 'cyan', true)} (optional): `;
    const apiInput = (await rl.question(apiPrompt)).trim();

    const modelInput = (
      await rl.question(`${paint('OpenAI model', 'cyan', true)} [${previousModel}]: `)
    ).trim();
    const model = modelInput || previousModel;

    const baseUrlInput = (
      await rl.question(
        `${paint('OpenAI base URL', 'cyan', true)} [${previousBaseUrl}] (for Ollama/vLLM/etc): `,
      )
    ).trim();
    const baseUrl = baseUrlInput || previousBaseUrl;

    const saved = await saveUserConfig({
      provider,
      apiKey: apiInput || previousKey,
      model,
      baseUrl,
    });

    console.log('');
    console.log(paint(`Saved ${BRAND_NAME} config at ${getUserConfigPath()}`, 'green', true));
    console.log('');

    return saved;
  } finally {
    rl.close();
  }
}

function applyConfigToRunOptions(runOptions: RunOptions, config: AgentReadinessUserConfig): void {
  runOptions.aiProvider = config.provider;
  runOptions.aiApiKey = config.apiKey;
  runOptions.aiModel = config.model;
  runOptions.aiBaseUrl = config.provider === 'openai' ? config.baseUrl : undefined;
}

export async function enrichRunOptions(parsed: CliOptions): Promise<RunOptions> {
  const runOptions: RunOptions = { ...parsed.runOptions };
  const aiFailureMode = runOptions.aiFailureMode ?? 'fallback';
  runOptions.aiFailureMode = aiFailureMode;

  const existingConfig = await loadUserConfig();

  if (parsed.setup) {
    const configured = await promptAndSaveUserConfig(existingConfig);
    applyConfigToRunOptions(runOptions, configured);
    return runOptions;
  }

  if (!existingConfig) {
    if (aiFailureMode === 'strict' && (!input.isTTY || !output.isTTY)) {
      throw new Error(
        `AI config not found and strict AI mode is enabled. Run \`agentable --setup\` in an interactive terminal or switch to --ai-failure-mode=fallback. Config path: ${getUserConfigPath()}`,
      );
    }

    if (aiFailureMode === 'strict') {
      console.log(`${BRAND_NAME} first-time setup: configure your AI provider credentials.`);
      const configured = await promptAndSaveUserConfig(null);
      applyConfigToRunOptions(runOptions, configured);
      return runOptions;
    }

    console.log(
      `${BRAND_NAME}: AI config not found. Continuing in fallback mode with AI-assisted criteria marked as unverified.`,
    );
    return runOptions;
  }

  applyConfigToRunOptions(runOptions, existingConfig);
  console.log(
    `${BRAND_NAME}: using configured AI provider ${providerLabel(existingConfig.provider)} (${existingConfig.provider}).`,
  );
  return runOptions;
}
