import { Buffer } from 'buffer';

function random(size: number): Buffer {
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return Buffer.from(arr);
}

export { random };
