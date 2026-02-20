import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../aes';

describe('AES-256-GCM', () => {
  const testKey = 'a'.repeat(64);

  it('encrypts and decrypts a string', async () => {
    const plaintext = 'hello world';
    const encrypted = await encrypt(plaintext, testKey);
    const decrypted = await decrypt(encrypted, testKey);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for same plaintext (random nonce)', async () => {
    const plaintext = 'same input';
    const a = await encrypt(plaintext, testKey);
    const b = await encrypt(plaintext, testKey);
    expect(a).not.toBe(b);
  });

  it('fails with wrong key', async () => {
    const encrypted = await encrypt('secret', testKey);
    const wrongKey = 'b'.repeat(64);
    await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
  });
});
