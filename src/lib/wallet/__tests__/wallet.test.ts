import { describe, it, expect } from 'vitest';
import { generateMnemonic, validateMnemonic } from '../generate';
import { deriveAddresses } from '../derive';

describe('wallet', () => {
  it('generates valid 24-word mnemonic', () => {
    const phrase = generateMnemonic(24);
    const words = phrase.split(' ');
    expect(words).toHaveLength(24);
    expect(validateMnemonic(phrase)).toBe(true);
  });

  it('generates valid 12-word mnemonic', () => {
    const phrase = generateMnemonic(12);
    expect(phrase.split(' ')).toHaveLength(12);
    expect(validateMnemonic(phrase)).toBe(true);
  });

  it('validates known good mnemonic', () => {
    // BIP39 standard test vector (all-zero entropy) -- not a real wallet
    const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    expect(validateMnemonic(phrase)).toBe(true);
  });

  it('rejects invalid mnemonic', () => {
    expect(validateMnemonic('not a valid mnemonic phrase')).toBe(false);
  });

  it('derives metamask addresses', () => {
    const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const addrs = deriveAddresses(phrase, 'metamask', 3);
    expect(addrs).toHaveLength(3);
    expect(addrs[0].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(addrs[0].index).toBe(0);
    expect(addrs[0].privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });
});
