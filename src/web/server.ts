import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { runAgentReadiness } from '../core/engine';
import { RunOptions, WebHistoryPoint, WebReportPayload } from '../types';
import { APP_CSS, APP_JS, renderIndexHtml, renderStandaloneHtml } from './templates';
import { buildWebPayload, scoreToLevel } from './transform';
import { appendRecommendationFeedback } from './feedback';
import { appendHistory, computeRepoKey, loadHistory } from './history';
import { buildAccessibleUrl } from './url';

export interface StartWebServerOptions {
  runOptions: RunOptions;
  host: string;
  port: number;
  historyDir?: string;
  feedbackDir?: string;
}

export interface StartedWebServer {
  url: string;
  close: () => Promise<void>;
}

interface WebServerState {
  payload: WebReportPayload;
  history: WebHistoryPoint[];
}

class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
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

async function readBody(req: IncomingMessage, maxBytes = 1_000_000): Promise<string> {
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > maxBytes) {
      throw new HttpError(413, 'Request payload too large.');
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
}

function parseFeedbackPayload(body: string): {
  criterionId: string;
  useful: boolean;
  reason: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new HttpError(400, 'Feedback payload must be valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new HttpError(400, 'Feedback payload must be an object.');
  }

  const record = parsed as Record<string, unknown>;
  const criterionId = typeof record.criterionId === 'string' ? record.criterionId.trim() : '';
  const useful = typeof record.useful === 'boolean' ? record.useful : null;
  const reasonRaw = typeof record.reason === 'string' ? record.reason : '';
  const reason = reasonRaw.trim().slice(0, 600);

  if (!criterionId) {
    throw new HttpError(400, 'Feedback payload missing criterionId.');
  }
  if (useful === null) {
    throw new HttpError(400, 'Feedback payload missing useful boolean.');
  }

  return { criterionId, useful, reason };
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
  onProgress?: (step: string) => void,
): Promise<{ payload: WebReportPayload; history: WebHistoryPoint[] }> {
  const engineOutput = await runAgentReadiness(options.runOptions, onProgress);
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

export async function startWebServer(
  options: StartWebServerOptions,
  onProgress?: (step: string) => void,
): Promise<StartedWebServer> {
  const initial = await computePayload(options, null, onProgress);

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
        await readBody(req, 16_000);
        const next = await computePayload(options, state.history);
        state.payload = next.payload;
        state.history = next.history;
        json(res, 200, { ok: true, generatedAt: state.payload.generatedAt });
        return;
      }

      if (method === 'POST' && pathname === '/api/feedback') {
        const body = await readBody(req, 16_000);
        const payload = parseFeedbackPayload(body);
        const knownCriteria = new Set<string>();
        for (const cards of Object.values(state.payload.criteriaByCategory)) {
          for (const card of cards) {
            knownCriteria.add(card.id);
          }
        }
        if (!knownCriteria.has(payload.criterionId)) {
          throw new HttpError(400, `Unknown criterionId: ${payload.criterionId}`);
        }

        const repoIdentifier = state.payload.meta.repoIdentifier || state.payload.meta.repoPath;
        const repoKey = computeRepoKey(repoIdentifier);
        await appendRecommendationFeedback(
          {
            criterionId: payload.criterionId,
            useful: payload.useful,
            reason: payload.reason,
            timestamp: new Date().toISOString(),
            repoKey,
            repoIdentifier,
            fingerprint: state.payload.meta.fingerprint,
          },
          options.feedbackDir,
        );

        json(res, 200, { ok: true });
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
      if (error instanceof HttpError) {
        json(res, error.statusCode, { error: error.message });
        return;
      }
      // Details stay in the terminal running agentable; the dashboard may be reachable
      // from other machines when started with --host.
      console.error(`agentable: ${method} ${pathname} failed:`, error);
      json(res, 500, { error: 'Internal error. See the terminal running agentable for details.' });
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

  const url = buildAccessibleUrl(options.host, address.port);

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
