const WILDCARD_HOSTS = new Set(['0.0.0.0', '::', '[::]']);

function formatUrlHost(host: string): string {
  const normalized = host.trim();
  if (WILDCARD_HOSTS.has(normalized)) {
    return 'localhost';
  }
  if (normalized.includes(':') && !normalized.startsWith('[')) {
    return `[${normalized}]`;
  }
  return normalized;
}

export function buildAccessibleUrl(host: string, port: number): string {
  return `http://${formatUrlHost(host)}:${port}`;
}
