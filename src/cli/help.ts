import { getUserConfigPath } from '../core/user-config';
import { BRAND_NAME } from './constants';

export function printHelp(): void {
  console.log(
    `${BRAND_NAME}\n\nUsage:\n  agentable [path] [--verbose] [--no-gh] [--ai-failure-mode <fallback|strict>] [--host <ip>] [--port <n>] [--setup] [--dry-run]\n\nOptions:\n  --verbose           Show additional evidence lines\n  --no-gh             Disable GitHub checks via gh CLI\n  --ai-failure-mode   AI failure behavior (default: fallback)\n  --host              Host interface for dashboard server (default: 127.0.0.1)\n  --port              Port for dashboard server (default: 4173)\n  --setup             Configure OpenRouter API key + model\n  --dry-run           Print criteria catalog + applicability and exit without analysis\n  --help              Show this help\n\nConfig:\n  AI config is optional in fallback mode and required in strict mode.\n  Provider mode: OpenRouter only.\n  Setup model presets: openai/gpt-oss-120b (default), anthropic/claude-sonnet-5 (top), anthropic/claude-opus-5.5 (premium).\n  Saved at: ${getUserConfigPath()}\n`,
  );
}
