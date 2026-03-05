import { stdout as output } from 'node:process';
import { parseArgs } from './args';
import { printAgentableBanner } from './banner';
import { openBrowser } from './browser';
import { printDashboardReady } from './dashboard';
import { createProgressReporter } from './progress';
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
    const progress = createProgressReporter('Running analysis');

    let started;
    try {
      started = await startWebServer(
        { runOptions, host: parsed.host, port: parsed.port },
        progress.reporter,
      );
      progress.done();
    } catch (error) {
      progress.fail();
      throw error;
    }

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
    console.error(`agentable failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
