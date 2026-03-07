import { stdin as input, stdout as output } from 'node:process';
import { emitKeypressEvents } from 'node:readline';
import { createInterface } from 'node:readline/promises';
import { DEFAULT_AI_PROVIDER } from '../collectors/ai';
import {
  AgentReadinessUserConfig,
  getUserConfigPath,
  loadUserConfig,
  saveUserConfig,
} from '../core/user-config';
import { RunOptions } from '../types';
import { padRightAnsi, paint, visibleLength } from './ansi';
import { BRAND_NAME } from './constants';
import { promptSecret } from './secret-input';
import { CliOptions } from './types';

type OpenRouterModelPresetId = 'default' | 'top' | 'premium';

interface OpenRouterModelPreset {
  id: OpenRouterModelPresetId;
  label: string;
  model: string;
  description: string;
}

interface ArrowMenuOption<T> {
  value: T;
  label: string;
  description?: string;
}

const DEFAULT_MODEL = 'gpt-oss-120b';
const TOP_MODEL = 'claude-sonnet-4.6';
const PREMIUM_MODEL = 'claude-opus-4.6';

const OPENROUTER_MODEL_PRESETS: OpenRouterModelPreset[] = [
  { id: 'default', label: 'Default', model: DEFAULT_MODEL, description: 'most affordable' },
  { id: 'top', label: 'Top', model: TOP_MODEL, description: 'best value' },
  { id: 'premium', label: 'Premium', model: PREMIUM_MODEL, description: 'most expensive' },
];

function printSetupHeader(isReconfigure: boolean): void {
  const title = isReconfigure
    ? `${BRAND_NAME} Setup (Reconfigure OpenRouter)`
    : `${BRAND_NAME} First-Time Setup`;
  const rows = [
    title,
    'OpenRouter is the default provider for this release.',
    `Config: ${getUserConfigPath()}`,
  ];
  const [headerRow, ...bodyRows] = rows;
  if (!headerRow) return;
  const contentWidth = rows.reduce((max, row) => Math.max(max, visibleLength(row)), 0);

  console.log('');
  console.log(
    `${paint('┌', 'magenta', true)}${paint('─'.repeat(contentWidth + 2), 'magenta', true)}${paint('┐', 'magenta', true)}`,
  );
  console.log(
    `${paint('│', 'magenta', true)} ${padRightAnsi(headerRow, contentWidth)} ${paint('│', 'magenta', true)}`,
  );
  console.log(
    `${paint('├', 'magenta', true)}${paint('─'.repeat(contentWidth + 2), 'magenta', true)}${paint('┤', 'magenta', true)}`,
  );
  for (const row of bodyRows) {
    console.log(
      `${paint('│', 'magenta', true)} ${padRightAnsi(row, contentWidth)} ${paint('│', 'magenta', true)}`,
    );
  }
  console.log(
    `${paint('└', 'magenta', true)}${paint('─'.repeat(contentWidth + 2), 'magenta', true)}${paint('┘', 'magenta', true)}`,
  );
  console.log('');
}

function chooseInput(currentValue: string, userInput: string): string {
  const normalized = userInput.trim();
  return normalized || currentValue;
}

function modelPresetForValue(value: string): OpenRouterModelPreset | null {
  return OPENROUTER_MODEL_PRESETS.find((item) => item.model === value) ?? null;
}

function initialModelMenuIndex(currentModel: string): number {
  const presetIndex = OPENROUTER_MODEL_PRESETS.findIndex((item) => item.model === currentModel);
  return presetIndex === -1 ? OPENROUTER_MODEL_PRESETS.length : presetIndex;
}

async function selectWithArrows<T>(
  title: string,
  options: ArrowMenuOption<T>[],
  initialIndex = 0,
): Promise<T> {
  if (options.length === 0) {
    throw new Error('Menu options cannot be empty.');
  }

  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), options.length - 1);
  let selectedIndex = safeInitialIndex;
  let renderedLines = 0;

  const render = () => {
    const lines = [
      paint(title, 'cyan', true),
      ...options.map((option, index) => {
        const marker = index === selectedIndex ? '●' : '○';
        const details = option.description ? ` (${option.description})` : '';
        return `  ${marker} ${option.label}${details}`;
      }),
      paint('Use ↑/↓ and Enter to select.', 'dim'),
    ];

    if (renderedLines > 0) {
      output.write(`\u001B[${renderedLines}A`);
    }

    for (const line of lines) {
      output.write(`\u001B[2K\r${line}\n`);
    }

    renderedLines = lines.length;
  };

  return new Promise<T>((resolve, reject) => {
    emitKeypressEvents(input);
    const stream = input as NodeJS.ReadStream;
    const wasRaw = Boolean(stream.isRaw);
    if (!wasRaw) {
      stream.setRawMode?.(true);
    }

    const cleanup = () => {
      input.off('keypress', onKeyPress);
      if (!wasRaw) {
        stream.setRawMode?.(false);
      }
      output.write('\n');
    };

    const onKeyPress = (_chunk: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Setup interrupted by user.'));
        return;
      }

      if (key.name === 'up') {
        selectedIndex = (selectedIndex - 1 + options.length) % options.length;
        render();
        return;
      }

      if (key.name === 'down') {
        selectedIndex = (selectedIndex + 1) % options.length;
        render();
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        const selected = options[selectedIndex];
        if (!selected) {
          cleanup();
          reject(new Error('Menu selection failed.'));
          return;
        }
        cleanup();
        resolve(selected.value);
      }
    };

    input.on('keypress', onKeyPress);
    render();
  });
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
  const previousApiKey = existingConfig?.apiKey ?? '';
  const previousModel = existingConfig?.model ?? DEFAULT_MODEL;

  console.log(`${paint('Provider', 'cyan', true)}: OpenRouter`);
  console.log('');

  const apiKeyPrompt = previousApiKey
    ? `${paint('OpenRouter API key', 'cyan', true)} (Enter keeps current): `
    : `${paint('OpenRouter API key', 'cyan', true)} (required): `;
  const apiKey = chooseInput(previousApiKey, await promptSecret(apiKeyPrompt));

  const rl = createInterface({ input, output });
  try {
    const modelOptions: ArrowMenuOption<string>[] = [
      { value: DEFAULT_MODEL, label: DEFAULT_MODEL, description: 'Default - most affordable' },
      { value: TOP_MODEL, label: TOP_MODEL, description: 'Top - best value' },
      { value: PREMIUM_MODEL, label: PREMIUM_MODEL, description: 'Premium - most expensive' },
      { value: '__custom__', label: 'Custom model', description: 'enter manually' },
    ];

    const selectedModel = await selectWithArrows(
      paint('Select OpenRouter model', 'cyan', true),
      modelOptions,
      initialModelMenuIndex(previousModel),
    );

    let model = selectedModel;
    if (selectedModel === '__custom__') {
      const customDefault = modelPresetForValue(previousModel) ? '' : previousModel;
      const customPrompt = customDefault
        ? `${paint('Custom model id', 'cyan', true)} [${customDefault}]: `
        : `${paint('Custom model id', 'cyan', true)}: `;
      model = chooseInput(customDefault, await rl.question(customPrompt));
    }

    const saved = await saveUserConfig({
      provider: 'openrouter',
      apiKey,
      model,
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
  runOptions.aiBaseUrl = undefined;
}

export async function enrichRunOptions(parsed: CliOptions): Promise<RunOptions> {
  const runOptions: RunOptions = { ...parsed.runOptions };
  const aiFailureMode = runOptions.aiFailureMode ?? 'fallback';
  runOptions.aiFailureMode = aiFailureMode;

  const loaded = await loadUserConfig();
  for (const warning of loaded.warnings) {
    console.log(paint(`${BRAND_NAME}: ${warning}`, 'magenta', true));
  }

  if (parsed.setup) {
    const configured = await promptAndSaveUserConfig(loaded.config);
    applyConfigToRunOptions(runOptions, configured);
    return runOptions;
  }

  if (!loaded.config) {
    if (aiFailureMode === 'strict' && (!input.isTTY || !output.isTTY)) {
      throw new Error(
        `AI config not found or invalid and strict AI mode is enabled. Run \`agentable --setup\` in an interactive terminal or switch to --ai-failure-mode=fallback. Config path: ${getUserConfigPath()}`,
      );
    }

    if (aiFailureMode === 'strict') {
      const setupReason = loaded.needsSetup
        ? 'previous config must be replaced'
        : 'configuration is required';
      console.log(`${BRAND_NAME} setup required: ${setupReason}.`);
      const configured = await promptAndSaveUserConfig(null);
      applyConfigToRunOptions(runOptions, configured);
      return runOptions;
    }

    console.log(
      `${BRAND_NAME}: OpenRouter config not found. Continuing in fallback mode with AI-assisted criteria marked as unverified.`,
    );
    return runOptions;
  }

  applyConfigToRunOptions(runOptions, loaded.config);
  console.log(`${BRAND_NAME}: using configured AI provider (${DEFAULT_AI_PROVIDER}).`);
  return runOptions;
}
