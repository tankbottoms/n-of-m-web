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
