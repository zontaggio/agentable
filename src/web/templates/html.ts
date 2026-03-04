import { WebReportPayload } from '../../types';

function serializePayload(payload: WebReportPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export function renderIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agentable</title>
    <link rel="stylesheet" href="/assets/app.css" />
  </head>
  <body>
    <div id="app"></div>
    <script src="/assets/app.js"></script>
  </body>
</html>`;
}

export function renderStandaloneHtml(
  payload: WebReportPayload,
  appCss: string,
  appJs: string,
): string {
  const serialized = serializePayload(payload);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Agentable Export</title>
    <style>${appCss}</style>
  </head>
  <body>
    <div id="app"></div>
    <script>
      window.__AGENTABLE_STATIC_EXPORT = true;
      window.__AGENTABLE_PAYLOAD = ${serialized};
    </script>
    <script>${appJs}</script>
  </body>
</html>`;
}
