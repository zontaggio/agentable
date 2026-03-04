import { stdout as output } from 'node:process';
import asciiLogo from 'cli-ascii-logo';
import { paint } from './ansi';
import { BRAND_NAME } from './constants';

export function printAgentableBanner(): void {
  if (!output.isTTY) {
    return;
  }

  const art = asciiLogo
    .createLogo(BRAND_NAME, 'cyberpunk')
    .split('\n')
    .filter((line) => line.length > 0);

  console.log('');
  console.log(art.join('\n'));
  console.log(paint('Deterministic repository readiness scanner', 'dim'));
  console.log('');
}
