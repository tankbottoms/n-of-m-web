# n-of-m-web Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-parity web port of the n-of-m mobile seed phrase manager using cik-oig's neo-brutalist design system.

**Architecture:** Fully client-side SvelteKit 2 SPA with adapter-static. All crypto operations (Shamir splitting, AES-256-GCM, BIP39/BIP44) run in-browser. Vault encrypted in IndexedDB. Camera QR scanning via WebRTC + jsQR.

**Tech Stack:** SvelteKit 2, Svelte 5 (runes), Bun, TypeScript, ethers.js, @noble/ciphers, buffer, jsQR, uuid

**Source reference:** Mobile app at `/Users/mark.phillips/Developer/n-of-m`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.css`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `.gitignore`

**Step 1: Initialize SvelteKit project**

```bash
cd /Users/mark.phillips/Developer/n-of-m-web
bun create svelte@latest . --template minimal --types typescript --no-add-ons
```

If the directory is non-empty, accept overwrite prompts. The scaffolding creates the basic SvelteKit structure.

**Step 2: Install dependencies**

```bash
bun add ethers @noble/ciphers buffer jsqr uuid
bun add -d @sveltejs/adapter-static @types/uuid
```

**Step 3: Configure adapter-static**

Replace `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true,
    }),
  },
};

export default config;
```

**Step 4: Configure Vite for buffer polyfill**

Update `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
});
```

**Step 5: Copy Font Awesome from cik-oig**

```bash
cp -r /Users/mark.phillips/Developer/cik-oig/static/fontawesome static/
```

**Step 6: Copy app.css from cik-oig and extend**

Copy `/Users/mark.phillips/Developer/cik-oig/src/app.css` to `src/app.css`, then append n-of-m-specific additions at the bottom:

```css
/* === n-of-m additions === */

/* Accent colors */
--color-accent: #5c6bc0;
--color-crypto-bg: #1a1a2e;
--color-crypto-text: #00ff88;
```

Add these three variables inside the `:root` block. Also add dark-mode overrides:

```css
/* Inside [data-theme='dark'] block: */
--color-crypto-bg: #0d0d1a;
--color-crypto-text: #00ff88;
```

**Step 7: Set up app.html**

Ensure `src/app.html` has:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-prerender="true">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

**Step 8: Set up +layout.svelte**

```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>n of m</title>
  <meta name="description" content="Shamir's Secret Sharing for Seed Phrases" />
  <link rel="stylesheet" href="/fontawesome/css/all.min.css" />
</svelte:head>

{@render children()}
```

**Step 9: Set up minimal +page.svelte**

```svelte
<div class="container" style="margin-top: 25vh; text-align: center;">
  <h1>n of m</h1>
  <p class="text-muted text-sm" style="margin-top: var(--spacing-sm);">
    Shamir's Secret Sharing for Seed Phrases
  </p>
</div>
```

**Step 10: Verify it runs**

```bash
bun run dev
```

Expected: Dev server starts, page shows "n of m" title with monospace font, dark borders.

**Step 11: Commit**

```bash
git add -A && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "scaffold sveltekit project with adapter-static and cik-oig design system"
```

---

## Task 2: Port Types and Constants

**Files:**
- Create: `src/lib/types.ts`, `src/lib/derivation.ts`

**Step 1: Create types.ts**

Port from `/Users/mark.phillips/Developer/n-of-m/constants/types.ts` -- copy verbatim:

```ts
export type WordCount = 12 | 15 | 18 | 21 | 24;
export type PathType = 'metamask' | 'ledger' | 'custom';

export interface DerivedAddress {
  index: number;
  address: string;
  privateKey: string;
  pinned?: boolean;
}

export interface ShamirConfig {
  threshold: number;
  totalShares: number;
}

export interface SecretRecord {
  id: string;
  name: string;
  createdAt: number;
  mnemonic: string;
  wordCount: WordCount;
  derivationPath: string;
  pathType: PathType;
  addressCount: number;
  addresses: DerivedAddress[];
  shamirConfig: ShamirConfig;
  metadata?: Record<string, string>;
  hasPassphrase: boolean;
  hasPIN: boolean;
  locked?: boolean;
}

export interface SharePayload {
  v: 1;
  id: string;
  name: string;
  shareIndex: number;
  totalShares: number;
  threshold: number;
  shareData: string;
  derivationPath: string;
  pathType: PathType;
  wordCount: WordCount;
  metadata?: Record<string, string>;
  hasPIN: boolean;
  hasPassphrase: boolean;
}
```

**Step 2: Create derivation.ts**

Port from `/Users/mark.phillips/Developer/n-of-m/constants/derivation.ts` -- copy verbatim, update import path:

```ts
import type { PathType } from './types';

export const DERIVATION_PATHS: Record<PathType, { label: string; template: string; description: string }> = {
  metamask: {
    label: 'MetaMask',
    template: "m/44'/60'/0'/0/{index}",
    description: 'Standard BIP44 - MetaMask, Rainbow, most web wallets',
  },
  ledger: {
    label: 'Ledger',
    template: "m/44'/60'/{index}'/0/0",
    description: 'Ledger Live derivation path',
  },
  custom: {
    label: 'Custom',
    template: '',
    description: 'Enter your own derivation path',
  },
};

export function getDerivationPath(pathType: PathType, index: number, customPath?: string): string {
  if (pathType === 'custom' && customPath) {
    return customPath.replace('{index}', String(index));
  }
  return DERIVATION_PATHS[pathType].template.replace('{index}', String(index));
}

export function getBasePath(pathType: PathType, customPath?: string): string {
  if (pathType === 'custom' && customPath) {
    return customPath.split('{index}')[0].replace(/\/+$/, '');
  }
  return DERIVATION_PATHS[pathType].template.replace('/{index}', '');
}

export const DEFAULT_ADDRESS_COUNT = 10;
export const DEFAULT_WORD_COUNT = 24;
export const DEFAULT_PATH_TYPE: PathType = 'metamask';
```

**Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/derivation.ts && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port types and derivation constants from mobile app"
```

---

## Task 3: Port Shamir Library

**Files:**
- Create: `src/lib/shamir/constants.ts`, `src/lib/shamir/table.ts`, `src/lib/shamir/codec.ts`, `src/lib/shamir/horner.ts`, `src/lib/shamir/lagrange.ts`, `src/lib/shamir/points.ts`, `src/lib/shamir/share.ts`, `src/lib/shamir/random.ts`, `src/lib/shamir/split.ts`, `src/lib/shamir/combine.ts`, `src/lib/shamir/index.ts`
- Create: `src/lib/shamir/__tests__/integration.test.ts`

**Step 1: Port all shamir modules**

Copy these files verbatim from `/Users/mark.phillips/Developer/n-of-m/lib/shamir/`:
- `constants.ts` -- no changes needed
- `table.ts` -- no changes needed
- `codec.ts` -- no changes needed (uses `buffer` package which we installed)
- `horner.ts` -- no changes needed
- `lagrange.ts` -- no changes needed
- `points.ts` -- no changes needed
- `share.ts` -- no changes needed
- `split.ts` -- no changes needed
- `combine.ts` -- no changes needed
- `index.ts` -- no changes needed

**Step 2: Port random.ts with Web Crypto replacement**

The only file that needs modification. Replace `expo-crypto` with Web Crypto API:

```ts
import { Buffer } from 'buffer';

function random(size: number): Buffer {
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  return Buffer.from(arr);
}

export { random };
```

**Step 3: Write integration test**

Create `src/lib/shamir/__tests__/integration.test.ts` -- port from mobile's test file. Copy the test file verbatim from `/Users/mark.phillips/Developer/n-of-m/lib/shamir/__tests__/integration.test.ts`. No import path changes needed since relative paths are identical.

**Step 4: Configure vitest**

```bash
bun add -d vitest
```

Add to `vite.config.ts`:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

Add test script to `package.json`:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 5: Run tests**

```bash
bun run test
```

Expected: All integration tests pass. The Shamir library is pure JS math over Buffer -- no native dependencies to port.

**Step 6: Commit**

```bash
git add src/lib/shamir/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port shamir secret sharing library with web crypto RNG"
```

---

## Task 4: Port Crypto Library

**Files:**
- Create: `src/lib/crypto/aes.ts`, `src/lib/crypto/kdf.ts`, `src/lib/crypto/index.ts`

**Step 1: Port aes.ts**

Copy from mobile, replace `expo-crypto` with Web Crypto:

```ts
import { gcm } from '@noble/ciphers/aes';

export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const keyBytes = hexToBytes(keyHex.slice(0, 64));
  const encoded = new TextEncoder().encode(plaintext);

  const cipher = gcm(keyBytes, nonce);
  const ciphertext = cipher.encrypt(encoded);

  return bytesToHex(nonce) + bytesToHex(ciphertext);
}

export async function decrypt(encrypted: string, keyHex: string): Promise<string> {
  const nonce = hexToBytes(encrypted.slice(0, 24));
  const ciphertext = hexToBytes(encrypted.slice(24));
  const keyBytes = hexToBytes(keyHex.slice(0, 64));

  const cipher = gcm(keyBytes, nonce);
  const decrypted = cipher.decrypt(ciphertext);

  return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Step 2: Port kdf.ts with Web Crypto PBKDF2**

Replace the iterative SHA-256 with proper PBKDF2:

```ts
const KDF_ITERATIONS = 100_000;

export async function deriveKey(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(salt),
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

Note: Increased from 10,000 to 100,000 iterations (OWASP 2024 recommendation for PBKDF2-SHA256).

**Step 3: Create index.ts**

```ts
export { encrypt, decrypt } from './aes';
export { deriveKey, generateSalt } from './kdf';
```

**Step 4: Write test for encrypt/decrypt roundtrip**

Create `src/lib/crypto/__tests__/aes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../aes';

describe('AES-256-GCM', () => {
  const testKey = 'a'.repeat(64); // 256-bit key as hex

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
    expect(() => decrypt(encrypted, wrongKey)).rejects.toThrow();
  });
});
```

**Step 5: Run tests**

```bash
bun run test
```

Expected: All pass.

**Step 6: Commit**

```bash
git add src/lib/crypto/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port crypto library with Web Crypto PBKDF2 and AES-256-GCM"
```

---

## Task 5: Port Wallet Library

**Files:**
- Create: `src/lib/wallet/generate.ts`, `src/lib/wallet/derive.ts`, `src/lib/wallet/index.ts`

**Step 1: Port generate.ts**

Replace `expo-crypto` with Web Crypto:

```ts
import { Mnemonic } from 'ethers';
import type { WordCount } from '../types';

const WORD_COUNT_TO_ENTROPY: Record<WordCount, number> = {
  12: 128, 15: 160, 18: 192, 21: 224, 24: 256,
};

export function generateMnemonic(wordCount: WordCount = 24, extraEntropy?: Uint8Array): string {
  const entropyBits = WORD_COUNT_TO_ENTROPY[wordCount];
  const entropyBytes = entropyBits / 8;
  const entropy = new Uint8Array(entropyBytes);
  crypto.getRandomValues(entropy);

  if (extraEntropy) {
    for (let i = 0; i < entropy.length; i++) {
      entropy[i] ^= extraEntropy[i % extraEntropy.length];
    }
  }

  const mnemonic = Mnemonic.fromEntropy(entropy);
  return mnemonic.phrase;
}

export function validateMnemonic(phrase: string): boolean {
  try {
    Mnemonic.fromPhrase(phrase);
    return true;
  } catch {
    return false;
  }
}
```

**Step 2: Port derive.ts**

```ts
import { HDNodeWallet } from 'ethers';
import type { DerivedAddress, PathType } from '../types';
import { getDerivationPath } from '../derivation';

export function deriveAddresses(
  mnemonicPhrase: string,
  pathType: PathType,
  count: number,
  customPath?: string,
  passphrase?: string
): DerivedAddress[] {
  const root = HDNodeWallet.fromPhrase(mnemonicPhrase, passphrase ?? '', 'm');
  const addresses: DerivedAddress[] = [];

  for (let i = 0; i < count; i++) {
    const path = getDerivationPath(pathType, i, customPath);
    const wallet = root.derivePath(path);
    addresses.push({
      index: i,
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  }

  return addresses;
}
```

**Step 3: Create index.ts**

```ts
export { generateMnemonic, validateMnemonic } from './generate';
export { deriveAddresses } from './derive';
```

**Step 4: Write test**

Create `src/lib/wallet/__tests__/wallet.test.ts`:

```ts
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
```

**Step 5: Run tests**

```bash
bun run test
```

**Step 6: Commit**

```bash
git add src/lib/wallet/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port wallet library with BIP39 generation and BIP44 derivation"
```

---

## Task 6: Port Entropy Library

**Files:**
- Create: `src/lib/entropy/motion.ts`, `src/lib/entropy/mix.ts`, `src/lib/entropy/index.ts`

**Step 1: Create motion.ts (web equivalent of accelerometer)**

```ts
export interface MotionSample {
  x: number;
  y: number;
  t: number;
}

export class MotionCollector {
  private samples: MotionSample[] = [];
  private targetSamples: number;

  constructor(targetSamples = 256) {
    this.targetSamples = targetSamples;
  }

  addSample(x: number, y: number): void {
    this.samples.push({ x, y, t: performance.now() });
  }

  get progress(): number {
    return Math.min(1, this.samples.length / this.targetSamples);
  }

  get isComplete(): boolean {
    return this.samples.length >= this.targetSamples;
  }

  toEntropy(): Uint8Array {
    const result = new Uint8Array(32);
    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i];
      const byte = Math.floor(((s.x * 7919 + s.y * 6271 + s.t * 3571) % 256 + 256) % 256);
      result[i % 32] ^= byte;
    }
    return result;
  }

  reset(): void {
    this.samples = [];
  }
}
```

**Step 2: Create mix.ts**

Replace `expo-crypto` with Web Crypto:

```ts
export async function mixEntropy(...sources: Uint8Array[]): Promise<Uint8Array> {
  const result = new Uint8Array(32);
  for (const source of sources) {
    for (let i = 0; i < 32; i++) {
      result[i] ^= source[i % source.length];
    }
  }

  const systemEntropy = new Uint8Array(32);
  crypto.getRandomValues(systemEntropy);
  for (let i = 0; i < 32; i++) {
    result[i] ^= systemEntropy[i];
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', result);
  return new Uint8Array(hashBuffer);
}
```

**Step 3: Create index.ts**

```ts
export { MotionCollector } from './motion';
export type { MotionSample } from './motion';
export { mixEntropy } from './mix';
```

**Step 4: Commit**

```bash
git add src/lib/entropy/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port entropy library with mouse motion collector and Web Crypto mixing"
```

---

## Task 7: Port Storage Library (IndexedDB Vault)

**Files:**
- Create: `src/lib/storage/vault.ts`, `src/lib/storage/keys.ts`, `src/lib/storage/index.ts`

**Step 1: Create keys.ts**

Replace `expo-secure-store` with localStorage for key persistence, `expo-crypto` with Web Crypto:

```ts
import { deriveKey, generateSalt } from '../crypto/kdf';

const MASTER_KEY_KEY = 'shamir_master_key';
const SALT_KEY = 'shamir_master_salt';
const PIN_HASH_KEY = 'shamir_pin_hash';
const VAULT_PASSWORD_HASH_KEY = 'shamir_vault_password_hash';
const VAULT_PASSWORD_SALT_KEY = 'shamir_vault_password_salt';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function initMasterKey(): Promise<string> {
  let key = localStorage.getItem(MASTER_KEY_KEY);
  if (!key) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = bytesToHex(bytes);
    localStorage.setItem(MASTER_KEY_KEY, key);
  }
  return key;
}

export function getMasterKey(): string | null {
  return localStorage.getItem(MASTER_KEY_KEY);
}

export async function setPIN(pin: string): Promise<void> {
  const salt = generateSalt();
  const hash = await deriveKey(pin, salt);
  localStorage.setItem(PIN_HASH_KEY, hash);
  localStorage.setItem(SALT_KEY, salt);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  const salt = localStorage.getItem(SALT_KEY);
  if (!storedHash || !salt) return false;
  const hash = await deriveKey(pin, salt);
  return hash === storedHash;
}

export function hasPIN(): boolean {
  return localStorage.getItem(PIN_HASH_KEY) !== null;
}

export async function setVaultPassword(password: string): Promise<void> {
  const salt = generateSalt();
  const hash = await deriveKey(password, salt);
  localStorage.setItem(VAULT_PASSWORD_HASH_KEY, hash);
  localStorage.setItem(VAULT_PASSWORD_SALT_KEY, salt);
}

export async function verifyVaultPassword(password: string): Promise<boolean> {
  const storedHash = localStorage.getItem(VAULT_PASSWORD_HASH_KEY);
  const salt = localStorage.getItem(VAULT_PASSWORD_SALT_KEY);
  if (!storedHash || !salt) return false;
  const hash = await deriveKey(password, salt);
  return hash === storedHash;
}

export function hasVaultPassword(): boolean {
  return localStorage.getItem(VAULT_PASSWORD_HASH_KEY) !== null;
}

export function removeVaultPassword(): void {
  localStorage.removeItem(VAULT_PASSWORD_HASH_KEY);
  localStorage.removeItem(VAULT_PASSWORD_SALT_KEY);
}
```

**Step 2: Create vault.ts**

Replace `expo-file-system` with IndexedDB:

```ts
import type { SecretRecord } from '../types';
import { encrypt, decrypt } from '../crypto/aes';
import { initMasterKey } from './keys';

const DB_NAME = 'shamir_vault';
const STORE_NAME = 'vault';
const VAULT_KEY = 'records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readRaw(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(VAULT_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function writeRaw(data: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, VAULT_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function readVault(): Promise<SecretRecord[]> {
  const key = await initMasterKey();
  try {
    const encrypted = await readRaw();
    if (!encrypted) return [];
    const json = await decrypt(encrypted, key);
    return JSON.parse(json);
  } catch {
    return [];
  }
}

async function writeVault(records: SecretRecord[]): Promise<void> {
  const key = await initMasterKey();
  const json = JSON.stringify(records);
  const encrypted = await encrypt(json, key);
  await writeRaw(encrypted);
}

export async function getAllSecrets(): Promise<SecretRecord[]> {
  return readVault();
}

export async function getSecret(id: string): Promise<SecretRecord | undefined> {
  const records = await readVault();
  return records.find((r) => r.id === id);
}

export async function saveSecret(record: SecretRecord): Promise<void> {
  const records = await readVault();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await writeVault(records);
}

export async function updateSecret(id: string, updates: Partial<SecretRecord>): Promise<void> {
  const records = await readVault();
  const idx = records.findIndex((r) => r.id === id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...updates };
    await writeVault(records);
  }
}

export async function deleteSecret(id: string): Promise<void> {
  const records = await readVault();
  await writeVault(records.filter((r) => r.id !== id));
}
```

**Step 3: Create index.ts**

```ts
export { getAllSecrets, getSecret, saveSecret, updateSecret, deleteSecret } from './vault';
export { initMasterKey, getMasterKey, setPIN, verifyPIN, hasPIN, setVaultPassword, verifyVaultPassword, hasVaultPassword, removeVaultPassword } from './keys';
```

**Step 4: Commit**

```bash
git add src/lib/storage/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port storage library with IndexedDB vault and localStorage key management"
```

---

## Task 8: Port PDF Library

**Files:**
- Create: `src/lib/pdf/layouts.ts`, `src/lib/pdf/templates.ts`, `src/lib/pdf/index.ts`

**Step 1: Copy layouts.ts verbatim**

Port from `/Users/mark.phillips/Developer/n-of-m/lib/pdf/layouts.ts` -- no changes needed.

**Step 2: Copy templates.ts verbatim**

Port from `/Users/mark.phillips/Developer/n-of-m/lib/pdf/templates.ts` -- no changes needed. The templates generate standalone HTML with inline CSS and QRious CDN script.

**Step 3: Create index.ts with browser print**

Replace `expo-print` with browser `window.print()` and iframe approach:

```ts
import type { SharePayload } from '../types';
import { renderPageHTML } from './templates';
import { LAYOUTS } from './layouts';
import type { LayoutType } from './layouts';

export { LAYOUTS } from './layouts';
export type { LayoutType, LayoutConfig } from './layouts';

export function generatePrintHTML(
  shares: SharePayload[],
  highlightColor: string,
  layoutType: LayoutType = 'full-page',
  firstAddress?: string
): string {
  const layout = LAYOUTS[layoutType];
  const qrDatas = shares.map((s) => JSON.stringify(s));
  return renderPageHTML(shares, qrDatas, highlightColor, layout, firstAddress);
}

export function printCards(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for QR codes to render
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
}

export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

**Step 4: Commit**

```bash
git add src/lib/pdf/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "port PDF library with browser print and HTML download"
```

---

## Task 9: QR Scanner Library

**Files:**
- Create: `src/lib/scanner/qr.ts`, `src/lib/scanner/index.ts`

**Step 1: Create qr.ts**

```ts
import jsQR from 'jsqr';

export interface ScannerConfig {
  onScan: (data: string) => boolean;
  onError?: (error: string) => void;
}

export class QRScanner {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private stream: MediaStream | null = null;
  private config: ScannerConfig;
  private cooldown = false;

  constructor(config: ScannerConfig) {
    this.config = config;
  }

  async start(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<void> {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      this.scan();
    } catch (err) {
      this.config.onError?.('Camera access denied');
    }
  }

  private scan(): void {
    if (!this.video || !this.canvas || !this.ctx) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx.drawImage(this.video, 0, 0);
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && !this.cooldown) {
        this.cooldown = true;
        const accepted = this.config.onScan(code.data);
        setTimeout(() => {
          this.cooldown = false;
        }, accepted ? 1500 : 500);
      }
    }

    this.animationId = requestAnimationFrame(() => this.scan());
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

export async function scanFromFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      resolve(code?.data ?? null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}
```

**Step 2: Create index.ts**

```ts
export { QRScanner, scanFromFile } from './qr';
export type { ScannerConfig } from './qr';
```

**Step 3: Commit**

```bash
git add src/lib/scanner/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "add QR scanner library with WebRTC camera and file upload support"
```

---

## Task 10: Base UI Components

**Files:**
- Create: `src/components/ThemeToggle.svelte`, `src/components/Panel.svelte`, `src/components/StepIndicator.svelte`, `src/components/TerminalLog.svelte`, `src/components/PinInput.svelte`, `src/components/MnemonicGrid.svelte`

**Step 1: ThemeToggle.svelte**

```svelte
<script lang="ts">
  let dark = $state(false);

  function toggle() {
    dark = !dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  $effect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      dark = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  });
</script>

<button class="theme-toggle" onclick={toggle} aria-label="Toggle theme">
  <i class="fa-thin {dark ? 'fa-sun' : 'fa-moon'}"></i>
</button>

<style>
  .theme-toggle {
    position: fixed;
    top: var(--spacing-md);
    right: var(--spacing-md);
    z-index: 200;
    font-size: 1.1rem;
    padding: 0.4rem 0.5rem;
  }
</style>
```

**Step 2: Panel.svelte**

```svelte
<script lang="ts">
  let { title = '', children, headerRight }: {
    title?: string;
    children: any;
    headerRight?: any;
  } = $props();
</script>

<div class="panel">
  {#if title}
    <div class="panel-header">
      <span>{title}</span>
      {#if headerRight}
        <span class="header-right">{@render headerRight()}</span>
      {/if}
    </div>
  {/if}
  <div class="panel-body">
    {@render children()}
  </div>
</div>

<style>
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .panel-body {
    padding: var(--spacing-md);
  }
</style>
```

**Step 3: StepIndicator.svelte**

```svelte
<script lang="ts">
  interface Step {
    label: string;
    key: string;
  }

  let { steps, currentStep, completedSteps = [] }: {
    steps: Step[];
    currentStep: string;
    completedSteps?: string[];
  } = $props();
</script>

<div class="step-indicator">
  {#each steps as step, i}
    <span
      class="step-badge"
      class:active={step.key === currentStep}
      class:completed={completedSteps.includes(step.key)}
    >
      {#if completedSteps.includes(step.key)}
        <i class="fa-thin fa-check"></i>
      {:else}
        {i + 1}
      {/if}
      {step.label}
    </span>
  {/each}
</div>

<style>
  .step-indicator {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: var(--spacing-md);
  }

  .step-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.2rem 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    background: transparent;
  }

  .step-badge.active {
    background: rgba(92, 107, 192, 0.15);
    border-color: var(--color-accent, #5c6bc0);
    color: var(--color-accent, #5c6bc0);
  }

  .step-badge.completed {
    background: rgba(40, 167, 69, 0.15);
    border-color: var(--color-success);
    color: var(--color-success);
  }
</style>
```

**Step 4: TerminalLog.svelte**

```svelte
<script lang="ts">
  export interface LogEntry {
    text: string;
    type: 'info' | 'fetch' | 'found' | 'match' | 'clear' | 'error';
    time: string;
  }

  let { entries = [], expanded = false }: {
    entries: LogEntry[];
    expanded?: boolean;
  } = $props();

  let logEl: HTMLDivElement;

  $effect(() => {
    if (logEl && entries.length) {
      logEl.scrollTop = logEl.scrollHeight;
    }
  });
</script>

<div class="terminal-log" class:expanded bind:this={logEl}>
  {#each entries as entry}
    <div class="log-line {entry.type}">
      <span class="log-time">[{entry.time}]</span> {entry.text}
    </div>
  {/each}
</div>

<style>
  .expanded {
    max-height: 800px;
  }
  .log-time {
    color: var(--color-text-muted);
    font-size: 0.8em;
  }
</style>
```

**Step 5: PinInput.svelte**

```svelte
<script lang="ts">
  let { length = 6, value = $bindable(''), onComplete }: {
    length?: number;
    value?: string;
    onComplete?: (pin: string) => void;
  } = $props();

  function onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    value = input.value.replace(/\D/g, '').slice(0, length);
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }
</script>

<div class="pin-input-wrapper">
  <input
    type="password"
    inputmode="numeric"
    pattern="[0-9]*"
    maxlength={length}
    value={value}
    oninput={onInput}
    placeholder={'*'.repeat(length)}
    class="pin-input"
  />
  <span class="pin-hint text-xs text-muted">{value.length}/{length} DIGITS</span>
</div>

<style>
  .pin-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .pin-input {
    font-size: 1.5rem;
    letter-spacing: 0.5em;
    text-align: center;
    padding: 0.75rem;
    max-width: 300px;
  }
  .pin-hint {
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
</style>
```

**Step 6: MnemonicGrid.svelte**

```svelte
<script lang="ts">
  let { words = [], masked = false }: {
    words: string[];
    masked?: boolean;
  } = $props();
</script>

<div class="mnemonic-grid">
  {#each words as word, i}
    <div class="word-cell">
      <span class="word-index">{i + 1}</span>
      <span class="word-text">{masked ? '****' : word}</span>
    </div>
  {/each}
</div>

<style>
  .mnemonic-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .word-cell {
    border: 1px solid var(--color-border-dark);
    box-shadow: 2px 2px 0px var(--color-shadow);
    padding: 0.5rem;
    font-family: var(--font-mono);
    position: relative;
  }

  .word-index {
    position: absolute;
    top: 2px;
    left: 4px;
    font-size: 0.6rem;
    color: var(--color-text-muted);
  }

  .word-text {
    display: block;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .mnemonic-grid { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 480px) {
    .mnemonic-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
```

**Step 7: Commit**

```bash
git add src/components/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "add base UI components: ThemeToggle, Panel, StepIndicator, TerminalLog, PinInput, MnemonicGrid"
```

---

## Task 11: Additional UI Components

**Files:**
- Create: `src/components/EntropyCanvas.svelte`, `src/components/AddressTable.svelte`, `src/components/PathEditor.svelte`, `src/components/ShareCard.svelte`

**Step 1: EntropyCanvas.svelte**

```svelte
<script lang="ts">
  import { MotionCollector } from '$lib/entropy/motion';

  let { collector, onComplete }: {
    collector: MotionCollector;
    onComplete: () => void;
  } = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  $effect(() => {
    if (canvas) {
      ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  });

  function onMove(e: MouseEvent | TouchEvent) {
    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    collector.addSample(x, y);

    if (ctx) {
      const hue = (collector.progress * 120) | 0;
      ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.6)`;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (collector.isComplete) {
      onComplete();
    }
  }
</script>

<div class="entropy-wrapper">
  <canvas
    bind:this={canvas}
    width={600}
    height={200}
    class="entropy-canvas"
    onmousemove={onMove}
    ontouchmove|preventDefault={onMove}
  ></canvas>
  <div class="progress-bar">
    <div class="progress-fill" style="width: {collector.progress * 100}%"></div>
  </div>
  <span class="text-xs text-muted" style="text-align: center; display: block; margin-top: 0.25rem;">
    MOVE YOUR MOUSE OR FINGER ACROSS THE CANVAS
  </span>
</div>

<style>
  .entropy-wrapper {
    width: 100%;
  }
  .entropy-canvas {
    width: 100%;
    height: 200px;
    border: 1px solid var(--color-border-dark);
    box-shadow: 2px 2px 0px var(--color-shadow);
    cursor: crosshair;
    touch-action: none;
  }
  .progress-bar {
    height: 4px;
    background: var(--color-border);
    margin-top: 0.5rem;
  }
  .progress-fill {
    height: 100%;
    background: var(--color-success);
    transition: width 0.1s;
  }
</style>
```

**Step 2: AddressTable.svelte**

```svelte
<script lang="ts">
  import type { DerivedAddress } from '$lib/types';

  let { addresses, showPrivateKeys = false }: {
    addresses: DerivedAddress[];
    showPrivateKeys?: boolean;
  } = $props();

  let revealedKeys = $state<Set<number>>(new Set());

  function toggleKey(index: number) {
    const next = new Set(revealedKeys);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    revealedKeys = next;
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  function truncate(addr: string): string {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  }
</script>

<table class="data-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Address</th>
      {#if showPrivateKeys}
        <th>Private Key</th>
      {/if}
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each addresses as addr}
      <tr>
        <td class="text-muted">{addr.index}</td>
        <td>
          <span class="addr-mono">{truncate(addr.address)}</span>
        </td>
        {#if showPrivateKeys}
          <td>
            {#if revealedKeys.has(addr.index)}
              <span class="addr-mono text-xs">{truncate(addr.privateKey)}</span>
            {:else}
              <span class="text-muted text-xs">HIDDEN</span>
            {/if}
          </td>
        {/if}
        <td class="actions">
          <button class="btn-icon" onclick={() => copyToClipboard(addr.address)} title="Copy address">
            <i class="fa-thin fa-copy"></i>
          </button>
          {#if showPrivateKeys}
            <button class="btn-icon" onclick={() => toggleKey(addr.index)} title="Toggle key">
              <i class="fa-thin {revealedKeys.has(addr.index) ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </button>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .addr-mono {
    font-family: var(--font-mono);
    font-size: 0.8rem;
  }
  .actions {
    display: flex;
    gap: 0.25rem;
  }
  .btn-icon {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.2rem 0.4rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    cursor: pointer;
    text-transform: none;
  }
  .btn-icon:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
</style>
```

**Step 3: PathEditor.svelte**

```svelte
<script lang="ts">
  import type { PathType } from '$lib/types';
  import { DERIVATION_PATHS, getBasePath } from '$lib/derivation';

  let { pathType = $bindable('metamask'), customPath = $bindable('') }: {
    pathType?: PathType;
    customPath?: string;
  } = $props();

  const pathTypes: PathType[] = ['metamask', 'ledger', 'custom'];
  let displayPath = $derived(
    pathType === 'custom' ? customPath : DERIVATION_PATHS[pathType].template
  );
</script>

<div class="path-editor">
  <div class="path-buttons">
    {#each pathTypes as pt}
      <button
        class:primary={pathType === pt}
        onclick={() => { pathType = pt; }}
      >
        {DERIVATION_PATHS[pt].label}
      </button>
    {/each}
  </div>
  <p class="text-xs text-muted mt-sm">{DERIVATION_PATHS[pathType].description}</p>
  {#if pathType === 'custom'}
    <input
      type="text"
      bind:value={customPath}
      placeholder="m/44'/60'/0'/0/{index}"
      class="mt-sm"
      style="width: 100%;"
    />
  {:else}
    <div class="path-display mt-sm">
      <code>{displayPath}</code>
    </div>
  {/if}
</div>

<style>
  .path-buttons {
    display: flex;
    gap: 0.35rem;
  }
  .path-display {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 0.4rem 0.75rem;
    background: var(--color-bg-alt);
    border: 1px solid var(--color-border);
  }
</style>
```

**Step 4: ShareCard.svelte**

A Svelte wrapper that renders the mobile app's card HTML template inline for preview:

```svelte
<script lang="ts">
  import type { SharePayload } from '$lib/types';

  let { share, highlightColor = '#A8D8EA' }: {
    share: SharePayload;
    highlightColor?: string;
  } = $props();

  let pinInfo = $derived(share.hasPIN ? 'PIN: ENABLED' : 'PIN: NONE');
  let ppInfo = $derived(share.hasPassphrase ? 'PASSPHRASE: ENABLED' : 'PASSPHRASE: NONE');
  let date = $derived(new Date().toISOString().replace('T', ' ').slice(0, 16));
</script>

<div class="share-card">
  <div class="card-header" style="background: {highlightColor};">
    <span class="card-title">{share.shareIndex}/{share.totalShares} SHAMIR</span>
    <span class="card-meta">T:{share.threshold} · {share.wordCount}W · V2</span>
  </div>

  <div class="card-section">
    <div class="section-label">INSTRUCTIONS</div>
    <div class="instructions">
      <p>This card is one fragment of a secret divided using
      <b>Shamir's Secret Sharing</b>. By itself this card
      reveals <b>nothing</b> about the original secret.</p>
      <p>To reconstruct the secret, collect and scan
      <b>at least {share.threshold} of the {share.totalShares} total share cards</b>.</p>
    </div>
  </div>

  <div class="card-section card-date">
    <span class="section-label">CREATED</span>
    <span class="date-value">{date}</span>
  </div>

  <div class="card-footer">
    <div class="footer-warning">
      &#9888; DO NOT LOSE THIS CARD — SHARE {share.shareIndex}
      OF {share.totalShares}. NEED {share.threshold}+ TO RECOVER.
    </div>
    <div class="footer-info">{pinInfo} · {ppInfo}</div>
    <div class="footer-guid">{share.id}</div>
  </div>
</div>

<style>
  .share-card {
    border: 3px solid var(--color-border-dark);
    box-shadow: 4px 4px 0px var(--color-shadow);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    max-width: 500px;
  }
  .card-header {
    padding: 0.5rem 0.75rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 3px solid var(--color-border-dark);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-title { font-size: 0.85rem; }
  .card-meta { font-size: 0.65rem; opacity: 0.7; }
  .card-section {
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--color-border-dark);
  }
  .section-label {
    font-weight: bold;
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
  }
  .instructions {
    font-size: 0.7rem;
    line-height: 1.5;
  }
  .instructions p { margin-bottom: 0.25rem; }
  .card-date {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .card-date .section-label { margin-bottom: 0; }
  .date-value { font-weight: bold; font-size: 0.75rem; }
  .card-footer {
    padding: 0.5rem 0.75rem;
    border-top: 3px solid var(--color-border-dark);
    background: var(--color-bg-alt);
  }
  .footer-warning {
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.15rem;
  }
  .footer-info {
    font-size: 0.6rem;
    font-weight: bold;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: 0.15rem;
  }
  .footer-guid {
    font-size: 0.55rem;
    color: var(--color-text-muted);
    text-align: right;
  }
</style>
```

**Step 5: Commit**

```bash
git add src/components/ && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "add EntropyCanvas, AddressTable, PathEditor, ShareCard components"
```

---

## Task 12: Hero Component and App Shell

**Files:**
- Create: `src/components/Hero.svelte`
- Modify: `src/routes/+page.svelte`

**Step 1: Create Hero.svelte**

```svelte
<script lang="ts">
  let { onNavigate }: {
    onNavigate: (mode: 'generate' | 'scan' | 'vault' | 'settings') => void;
  } = $props();
</script>

<div class="hero">
  <h1 class="hero-title">n of m</h1>
  <p class="hero-subtitle">Shamir's Secret Sharing for Seed Phrases</p>
  <p class="hero-tagline text-muted text-sm">Split. Print. Recover.</p>

  <div class="hero-actions mt-lg">
    <button class="primary" onclick={() => onNavigate('generate')}>
      <i class="fa-thin fa-key"></i> Generate
    </button>
    <button onclick={() => onNavigate('scan')}>
      <i class="fa-thin fa-qrcode"></i> Scan
    </button>
    <button onclick={() => onNavigate('vault')}>
      <i class="fa-thin fa-vault"></i> Vault
    </button>
    <button onclick={() => onNavigate('settings')}>
      <i class="fa-thin fa-gear"></i> Settings
    </button>
  </div>

  <div class="hero-info mt-lg">
    <p class="text-sm text-muted">
      Generate a seed phrase, split it into <b>m</b> shares where any <b>n</b> can
      reconstruct it. Print QR-coded share cards. Scan to recover. Fully offline.
    </p>
  </div>
</div>

<style>
  .hero {
    text-align: center;
    max-width: 600px;
    margin: 0 auto;
  }
  .hero-title {
    font-size: 2.5rem;
    letter-spacing: 0.1em;
    text-transform: lowercase;
  }
  .hero-subtitle {
    font-size: 0.9rem;
    margin-top: var(--spacing-xs);
  }
  .hero-tagline {
    margin-top: var(--spacing-xs);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    font-size: 0.75rem;
  }
  .hero-actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: center;
    flex-wrap: wrap;
  }
  .hero-actions button {
    min-width: 120px;
  }
  .hero-info {
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
  }
</style>
```

**Step 2: Build +page.svelte app shell**

This is the single-page orchestrator. It manages which mode/view is active:

```svelte
<script lang="ts">
  import ThemeToggle from '../components/ThemeToggle.svelte';
  import Hero from '../components/Hero.svelte';

  type Mode = 'home' | 'generate' | 'scan' | 'vault' | 'settings';
  let mode = $state<Mode>('home');
  let isActive = $derived(mode !== 'home');

  function navigate(m: Mode) {
    mode = m;
  }

  function goHome() {
    mode = 'home';
  }
</script>

<ThemeToggle />

<div class="app-wrapper" class:active={isActive}>
  {#if isActive}
    <div class="nav-bar">
      <button class="btn-icon" onclick={goHome}>
        <i class="fa-thin fa-arrow-left"></i> BACK
      </button>
      <span class="nav-title">{mode.toUpperCase()}</span>
      <span></span>
    </div>
  {/if}

  <div class="container">
    {#if mode === 'home'}
      <Hero onNavigate={(m) => navigate(m)} />
    {:else if mode === 'generate'}
      <p class="text-muted">Generate flow placeholder</p>
    {:else if mode === 'scan'}
      <p class="text-muted">Scan flow placeholder</p>
    {:else if mode === 'vault'}
      <p class="text-muted">Vault placeholder</p>
    {:else if mode === 'settings'}
      <p class="text-muted">Settings placeholder</p>
    {/if}
  </div>
</div>

<style>
  .app-wrapper {
    margin-top: 25vh;
    transition: margin-top 0.3s ease;
  }
  .app-wrapper.active {
    margin-top: 0;
  }
  .nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--spacing-md);
  }
  .nav-title {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .btn-icon {
    background: none;
    border: none;
    box-shadow: none;
    padding: 0.3rem 0.5rem;
    font-size: 0.8rem;
    cursor: pointer;
    text-transform: uppercase;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-text-muted);
    letter-spacing: 0.03em;
  }
  .btn-icon:hover {
    color: var(--color-text);
    box-shadow: none;
    transform: none;
  }
</style>
```

**Step 3: Verify it runs**

```bash
bun run dev
```

Expected: Hero view with centered title, 4 action buttons, theme toggle. Clicking any button transitions to active state (margin collapses, nav bar appears).

**Step 4: Commit**

```bash
git add src/components/Hero.svelte src/routes/+page.svelte && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "add Hero component and app shell with mode-based navigation"
```

---

## Task 13: Generate Flow

**Files:**
- Create: `src/components/GenerateFlow.svelte`
- Modify: `src/routes/+page.svelte` (wire in)

This is the largest component. It implements the 7-step wizard: Word Count -> Entropy -> Mnemonic -> Derivation -> Shamir -> Metadata -> Preview.

**Step 1: Create GenerateFlow.svelte**

Create at `src/components/GenerateFlow.svelte`. This file will be substantial (~400 lines). It uses Svelte 5 runes for all state. Key implementation notes:

- Uses `$state` for current step, mnemonic, share config, addresses, etc.
- Imports and uses: `StepIndicator`, `MnemonicGrid`, `EntropyCanvas`, `PathEditor`, `AddressTable`, `ShareCard`, `Panel`, `TerminalLog`, `PinInput`
- Each step renders conditionally based on `currentStep`
- Step progression validates before advancing
- On final step, calls `split()` from shamir lib and renders share card previews
- Print button calls `printCards()` from pdf lib
- Save button calls `saveSecret()` from storage lib

The component manages this state:

```ts
let currentStep = $state<string>('words');
let completedSteps = $state<string[]>([]);
let wordCount = $state<WordCount>(24);
let entropyMode = $state<'system' | 'motion' | 'combined'>('system');
let motionEntropy = $state<Uint8Array | null>(null);
let mnemonic = $state('');
let importMode = $state(false);
let importText = $state('');
let pathType = $state<PathType>('metamask');
let customPath = $state("m/44'/60'/0'/0/{index}");
let addressCount = $state(5);
let addresses = $state<DerivedAddress[]>([]);
let threshold = $state(3);
let totalShares = $state(5);
let secretName = $state('');
let pin = $state('');
let passphrase = $state('');
let shares = $state<SharePayload[]>([]);
let highlightColor = $state('#A8D8EA');
let logEntries = $state<LogEntry[]>([]);
```

Each step is a Panel with the step's content. Use the `StepIndicator` at top. Navigation buttons "BACK" and "NEXT" at the bottom of each step panel.

The full component implementation should follow the patterns established in the mobile app's generate flow screens. Wire each step to its corresponding library functions.

**Step 2: Wire into +page.svelte**

Replace the generate placeholder:

```svelte
{:else if mode === 'generate'}
  <GenerateFlow onComplete={goHome} />
```

Add the import at top:

```svelte
import GenerateFlow from '../components/GenerateFlow.svelte';
```

**Step 3: Test manually**

```bash
bun run dev
```

Walk through all 7 steps: pick word count, skip/collect entropy, generate mnemonic, pick derivation path, configure shamir, add metadata, preview share cards.

**Step 4: Commit**

```bash
git add src/components/GenerateFlow.svelte src/routes/+page.svelte && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "implement 7-step generate flow with shamir splitting and card preview"
```

---

## Task 14: Scan Flow

**Files:**
- Create: `src/components/ScanFlow.svelte`
- Modify: `src/routes/+page.svelte` (wire in)

**Step 1: Create ScanFlow.svelte**

Implements the camera-based QR scanner with share collection, threshold tracking, and mnemonic reconstruction. Key state:

```ts
let state = $state<'scanning' | 'pin_required' | 'reconstructing' | 'done' | 'error'>('scanning');
let scannedShares = $state<SharePayload[]>([]);
let targetThreshold = $state(0);
let targetTotal = $state(0);
let error = $state<string | null>(null);
let recoveredMnemonic = $state('');
let pin = $state('');
let scanner: QRScanner | null = null;
```

Uses the `QRScanner` class from `$lib/scanner`. On successful threshold collection, calls `combine()` from shamir lib to reconstruct. If `hasPIN`, shows PinInput first. Displays progress dots and recovered mnemonic grid.

Include a file upload fallback button that uses `scanFromFile()`.

**Step 2: Wire into +page.svelte**

```svelte
{:else if mode === 'scan'}
  <ScanFlow onComplete={goHome} />
```

**Step 3: Commit**

```bash
git add src/components/ScanFlow.svelte src/routes/+page.svelte && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "implement scan flow with camera QR scanning and share reconstruction"
```

---

## Task 15: Vault Panel

**Files:**
- Create: `src/components/VaultPanel.svelte`
- Modify: `src/routes/+page.svelte` (wire in)

**Step 1: Create VaultPanel.svelte**

Displays stored secrets from IndexedDB vault. Features:

- List view: each secret as a panel row with name, date, word count badge, shamir config badge
- Expand/collapse detail view on click
- Detail view: masked mnemonic (click to reveal), address table, re-export cards button, delete button
- Per-secret lock/unlock toggle
- Inline rename (click name to edit)
- Vault password gate (if `hasVaultPassword()` is true, prompt before showing list)

Key imports: `getAllSecrets`, `updateSecret`, `deleteSecret` from `$lib/storage`, `MnemonicGrid`, `AddressTable`, `Panel`.

**Step 2: Wire into +page.svelte**

```svelte
{:else if mode === 'vault'}
  <VaultPanel />
```

**Step 3: Commit**

```bash
git add src/components/VaultPanel.svelte src/routes/+page.svelte && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "implement vault panel with secret list, detail view, and management"
```

---

## Task 16: Settings Panel

**Files:**
- Create: `src/components/SettingsPanel.svelte`
- Modify: `src/routes/+page.svelte` (wire in)

**Step 1: Create SettingsPanel.svelte**

Settings sections:

1. **Theme** -- highlight color picker using palette swatches from `PALETTES` (port from mobile's `theme.ts`)
2. **PDF Layout** -- radio buttons: Full Page / Compact / Wallet Size
3. **Default Word Count** -- button group: 12/15/18/21/24
4. **Vault Password** -- set/change/remove with PinInput-style input
5. **About** -- version info, "Fully offline. No network requests."

All preferences stored in `localStorage` with keys prefixed `shamir_pref_`.

**Step 2: Wire into +page.svelte**

```svelte
{:else if mode === 'settings'}
  <SettingsPanel />
```

**Step 3: Commit**

```bash
git add src/components/SettingsPanel.svelte src/routes/+page.svelte && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "implement settings panel with theme, layout, and vault password options"
```

---

## Task 17: Responsive Polish and Final CSS

**Files:**
- Modify: `src/app.css`

**Step 1: Add remaining CSS patterns**

Ensure `app.css` includes all the neo-brutalist patterns from cik-oig that components rely on. Review each component for any inline styles that should be in the global CSS. Add any missing utility classes.

**Step 2: Test responsive breakpoints**

Open dev tools and test at:
- Desktop (1200px+)
- Tablet (768px)
- Mobile (480px)

Fix any layout issues. Ensure MnemonicGrid collapses to 3/2 columns. Ensure hero actions stack vertically on mobile.

**Step 3: Commit**

```bash
git add src/app.css && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "responsive CSS polish and complete neo-brutalist design system"
```

---

## Task 18: Build and Deploy

**Files:**
- Modify: `package.json` (build scripts)

**Step 1: Test production build**

```bash
bun run build
```

Expected: Static output in `build/` directory with `index.html` fallback.

**Step 2: Preview production build**

```bash
bun run preview
```

Walk through all flows: generate, scan (camera may not work in preview -- test file upload), vault, settings.

**Step 3: Deploy to Vercel**

```bash
bun add -d @sveltejs/adapter-vercel
```

Wait -- we're using adapter-static which already works with Vercel. Just push to GitHub and connect to Vercel, or use:

```bash
npx vercel --prod
```

**Step 4: Commit final**

```bash
git add -A && GIT_COMMITTER_NAME="tankbottoms" GIT_COMMITTER_EMAIL="tankbottoms@users.noreply.github.com" git commit --author="tankbottoms <tankbottoms@users.noreply.github.com>" -m "production build configuration and deployment setup"
```

---

## Summary

| Task | Description | Estimated Complexity |
|------|-------------|---------------------|
| 1 | Project scaffolding | Low |
| 2 | Types and constants | Low |
| 3 | Shamir library port | Medium (port + test) |
| 4 | Crypto library port | Medium (Web Crypto API) |
| 5 | Wallet library port | Low (ethers.js identical) |
| 6 | Entropy library | Medium (new mouse collector) |
| 7 | Storage library | Medium (IndexedDB) |
| 8 | PDF library | Low (template reuse) |
| 9 | QR scanner library | Medium (WebRTC + jsQR) |
| 10 | Base UI components | Medium (6 components) |
| 11 | Additional UI components | Medium (4 components) |
| 12 | Hero + app shell | Low |
| 13 | Generate flow | High (7-step wizard) |
| 14 | Scan flow | Medium |
| 15 | Vault panel | Medium |
| 16 | Settings panel | Low |
| 17 | Responsive polish | Low |
| 18 | Build and deploy | Low |
