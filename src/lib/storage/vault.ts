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
