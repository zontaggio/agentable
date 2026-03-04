import { stdout as output } from 'node:process';
import { parseArgs } from './args';
import { printAgentableBanner } from './banner';
import { openBrowser } from './browser';
import { printDashboardReady } from './dashboard';
import { runWithProgress } from './progress';
import { enrichRunOptions } from './setup';
import { startWebServer } from '../web/server';

export async function runCli(): Promise<void> {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    if (!parsed) {
      process.exitCode = 0;
      return;
    }

    printAgentableBanner();

    const runOptions = await enrichRunOptions(parsed);
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
  } catch (error) {
    console.error(
      `agentable failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
