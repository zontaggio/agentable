import { stdin as input, stdout as output } from 'node:process';
import { emitKeypressEvents } from 'node:readline';

interface Keypress {
  ctrl?: boolean;
  meta?: boolean;
  name?: string;
}

export async function promptSecret(prompt: string): Promise<string> {
  output.write(prompt);

  return new Promise<string>((resolve, reject) => {
    emitKeypressEvents(input);
    const stream = input as NodeJS.ReadStream;
    const wasRaw = Boolean(stream.isRaw);
    if (!wasRaw) {
      stream.setRawMode?.(true);
    }

    let value = '';

    const cleanup = () => {
      input.off('keypress', onKeypress);
      if (!wasRaw) {
        stream.setRawMode?.(false);
      }
      output.write('\n');
    };

    const onKeypress = (chunk: string, key: Keypress) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Setup interrupted by user.'));
        return;
      }

      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        resolve(value);
        return;
      }

      if (key.name === 'backspace') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          output.write('\b \b');
        }
        return;
      }

      if (key.ctrl || key.meta || !chunk) {
        return;
      }

      const visible = Array.from(chunk).filter((char) => char >= ' ' && char !== '\u007f');
      if (visible.length === 0) {
        return;
      }

      value += visible.join('');
      output.write('*'.repeat(visible.length));
    };

    input.on('keypress', onKeypress);
  });
}
