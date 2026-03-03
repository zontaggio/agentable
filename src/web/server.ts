import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { runAgentReadiness } from '../core/engine';
import { RunOptions, WebHistoryPoint, WebReportPayload } from '../types';
import { APP_CSS, APP_JS, renderIndexHtml, renderStandaloneHtml } from './templates';
import { buildWebPayload, scoreToLevel } from './transform';
import { appendHistory, computeRepoKey, loadHistory } from './history';

export interface StartWebServerOptions {
  runOptions: RunOptions;
  host: string;
  port: number;
  historyDir?: string;
}

export interface StartedWebServer {
  url: string;
  close: () => Promise<void>;
}

interface WebServerState {
  payload: WebReportPayload;
  history: WebHistoryPoint[];
}

function json(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(body);
}

function text(res: ServerResponse, statusCode: number, contentType: string, data: string): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
  res.setHeader('Content-Length', Buffer.byteLength(data));
  res.end(data);
}

function notFound(res: ServerResponse): void {
  text(res, 404, 'text/plain', 'Not found');
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

function toHistorySnapshot(payload: WebReportPayload): WebHistoryPoint {
  return {
    timestamp: payload.generatedAt,
    score: payload.summary.score,
    coverage: payload.summary.coverage,
    level: scoreToLevel(payload.summary.score),
    fingerprint: payload.meta.fingerprint,
  };
}

async function computePayload(
  options: StartWebServerOptions,
  previousHistory: WebHistoryPoint[] | null,
): Promise<{ payload: WebReportPayload; history: WebHistoryPoint[] }> {
  const engineOutput = await runAgentReadiness(options.runOptions);
  const repoKey = computeRepoKey(engineOutput.meta.repoIdentifier || engineOutput.meta.repoPath);

  let history = previousHistory ?? (await loadHistory(repoKey, options.historyDir));
  const basePayload = buildWebPayload(
    {
      summary: engineOutput.summary,
      results: engineOutput.results,
      warnings: engineOutput.warnings,
      meta: engineOutput.meta,
      actionPlan: engineOutput.actionPlan,
    },
    history,
  );

  history = await appendHistory(repoKey, toHistorySnapshot(basePayload), options.historyDir);

  const payload = buildWebPayload(
    {
      summary: engineOutput.summary,
      results: engineOutput.results,
      warnings: engineOutput.warnings,
      meta: engineOutput.meta,
      actionPlan: engineOutput.actionPlan,
    },
    history,
  );

  return {
    payload,
    history,
  };
}

export async function startWebServer(options: StartWebServerOptions): Promise<StartedWebServer> {
  const initial = await computePayload(options, null);

  const state: WebServerState = {
    payload: initial.payload,
    history: initial.history,
  };

  const server = createServer(async (req, res) => {
    const method = req.method ?? 'GET';
    const url = req.url ?? '/';
    const pathname = new URL(url, 'http://localhost').pathname;

    try {
      if (method === 'GET' && pathname === '/') {
        text(res, 200, 'text/html', renderIndexHtml());
        return;
      }

      if (method === 'GET' && pathname === '/assets/app.css') {
        text(res, 200, 'text/css', APP_CSS);
        return;
      }

      if (method === 'GET' && pathname === '/assets/app.js') {
        text(res, 200, 'application/javascript', APP_JS);
        return;
      }

      if (method === 'GET' && pathname === '/api/report') {
        json(res, 200, state.payload);
        return;
      }

      if (method === 'POST' && pathname === '/api/refresh') {
        await readBody(req);
        const next = await computePayload(options, state.history);
        state.payload = next.payload;
        state.history = next.history;
        json(res, 200, { ok: true, generatedAt: state.payload.generatedAt });
        return;
      }

      if (method === 'GET' && pathname === '/api/export.json') {
        const repoName = path.basename(state.payload.header.repoPath);
        const filename = `agentable-${repoName}.json`;
        const body = JSON.stringify(state.payload, null, 2);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(body);
        return;
      }

      if (method === 'GET' && pathname === '/api/export.html') {
        const repoName = path.basename(state.payload.header.repoPath);
        const filename = `agentable-${repoName}.html`;
        const body = renderStandaloneHtml(state.payload);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(body);
        return;
      }

      notFound(res);
    } catch (error) {
      json(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to resolve server address.');
  }

  const url = `http://${options.host}:${address.port}`;

  return {
    url,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}
