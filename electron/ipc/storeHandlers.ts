import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';

const store = new Store({
  name: 'prebuild-card-generator',
  defaults: {},
  // Encrypt sensitive fields
  encryptionKey: undefined, // Set to a key for encrypted storage
});

// Separate encrypted store for credentials
const credentialStore = new Store({
  name: 'prebuild-credentials',
  defaults: {},
});

export function registerStoreHandlers(): void {
  ipcMain.handle('store:get', (_event, key: string) => {
    return store.get(key, null);
  });

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    store.set(key, value);
  });

  ipcMain.handle('store:delete', (_event, key: string) => {
    store.delete(key as never);
  });

  ipcMain.handle('store:has', (_event, key: string) => {
    return store.has(key as never);
  });

  ipcMain.handle('store:keys', () => {
    return Object.keys(store.store);
  });

  ipcMain.handle('store:clear', () => {
    store.clear();
  });

  ipcMain.handle('store:getAll', () => {
    return store.store;
  });

  ipcMain.handle('store:importData', (_event, data: Record<string, unknown>) => {
    // Merge imported data into store
    for (const [key, value] of Object.entries(data)) {
      store.set(key, value);
    }
  });
}

// ── Credential helpers (used by email handlers) ──────────────

export function saveEncryptedCredential(key: string, value: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value);
    credentialStore.set(key, encrypted.toString('base64'));
  } else {
    // Fallback to plain storage if encryption unavailable
    credentialStore.set(key, value);
  }
}

export function getEncryptedCredential(key: string): string | null {
  const stored = credentialStore.get(key) as string | undefined;
  if (!stored) return null;

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(stored, 'base64');
      return safeStorage.decryptString(buffer);
    } catch {
      // If decryption fails, try reading as plain text (migration)
      return stored;
    }
  }
  return stored;
}
