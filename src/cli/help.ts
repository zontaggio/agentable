import { getUserConfigPath } from '../core/user-config';
import { BRAND_NAME } from './constants';

export function printHelp(): void {
  console.log(
    `${BRAND_NAME}\n\nUsage:\n  agentable [path] [--verbose] [--no-gh] [--host <ip>] [--port <n>] [--setup]\n\nOptions:\n  --verbose   Show additional evidence lines\n  --no-gh     Disable GitHub checks via gh CLI\n  --host      Host interface for dashboard server (default: 127.0.0.1)\n  --port      Port for dashboard server (default: 4173)\n  --setup     Configure OpenRouter API key/model and persist locally\n  --help      Show this help\n\nConfig:\n  OpenRouter AI is required. First run prompts for API key and model.\n  Saved at: ${getUserConfigPath()}\n`,
  );
}
