import { WebReportPayload } from '../types';
import { APP_CSS, APP_JS, INDEX_HTML } from './templates-generated';

function serializePayload(payload: WebReportPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export { APP_CSS, APP_JS };

export function renderIndexHtml(): string {
  return INDEX_HTML;
}

export function renderStandaloneHtml(payload: WebReportPayload): string {
  const serialized = serializePayload(payload);
  return INDEX_HTML.replace('<title>Agentable</title>', '<title>Agentable Export</title>')
    .replace('<link rel="stylesheet" href="/assets/app.css" />', `<style>${APP_CSS}</style>`)
    .replace(
      '<script src="/assets/app.js"></script>',
      `<script>\n      window.__AGENTABLE_STATIC_EXPORT = true;\n      window.__AGENTABLE_PAYLOAD = ${serialized};\n    </script>\n    <script>${APP_JS}</script>`,
    );
}
