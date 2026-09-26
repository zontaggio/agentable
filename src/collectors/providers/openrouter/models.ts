/** Vendor prefixes OpenRouter uses in its `vendor/model` IDs. */
const VENDOR_PREFIXES: Array<[RegExp, string]> = [
  [/^(gpt-|o\d)/, 'openai'],
  [/^claude-/, 'anthropic'],
  [/^gemini-/, 'google'],
  [/^llama-/, 'meta-llama'],
  [/^(mistral|mixtral|codestral)-/, 'mistralai'],
  [/^deepseek-/, 'deepseek'],
];

/**
 * OpenRouter identifies models as `vendor/model` (e.g. `openai/gpt-oss-120b`).
 * Versions up to 0.1.1 saved bare preset names such as `gpt-oss-120b`, so add the
 * vendor when it's known. IDs that already have one, or unknown names, pass through.
 */
export function toOpenRouterModelId(model: string): string {
  const trimmed = model.trim();
  if (trimmed.includes('/')) return trimmed;
  const vendor = VENDOR_PREFIXES.find(([pattern]) => pattern.test(trimmed))?.[1];
  return vendor ? `${vendor}/${trimmed}` : trimmed;
}
