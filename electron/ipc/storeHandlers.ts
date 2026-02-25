import { ipcMain, safeStorage } from 'electron';
import Store from 'electron-store';

// electron-store v11 extends Conf, which uses typed keys.
// We use a generic Record<string, unknown> and access via the untyped overloads.
type AppStore = Store<Record<string, unknown>>;

const store: AppStore = new Store({
  name: 'prebuild-card-generator',
});

// Separate store for credentials
const credentialStore: AppStore = new Store({
  name: 'prebuild-credentials',
});

// Helper: typed wrappers around Conf methods for dynamic string keys
function storeGet(s: AppStore, key: string, fallback?: unknown): unknown {
  return (s as any).get(key, fallback);  // eslint-disable-line @typescript-eslint/no-explicit-any
}
function storeSet(s: AppStore, key: string, value: unknown): void {
  (s as any).set(key, value);  // eslint-disable-line @typescript-eslint/no-explicit-any
}
function storeDelete(s: AppStore, key: string): void {
  (s as any).delete(key);  // eslint-disable-line @typescript-eslint/no-explicit-any
}
function storeHas(s: AppStore, key: string): boolean {
  return (s as any).has(key);  // eslint-disable-line @typescript-eslint/no-explicit-any
}
function storeGetAll(s: AppStore): Record<string, unknown> {
  return (s as any).store;  // eslint-disable-line @typescript-eslint/no-explicit-any
}
function storeClear(s: AppStore): void {
  (s as any).clear();  // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function registerStoreHandlers(): void {
  ipcMain.handle('store:get', (_event, key: string) => {
    return storeGet(store, key, null);
  });

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    storeSet(store, key, value);
  });

  ipcMain.handle('store:delete', (_event, key: string) => {
    storeDelete(store, key);
  });

  ipcMain.handle('store:has', (_event, key: string) => {
    return storeHas(store, key);
  });

  ipcMain.handle('store:keys', () => {
    return Object.keys(storeGetAll(store));
  });

  ipcMain.handle('store:clear', () => {
    storeClear(store);
  });

  ipcMain.handle('store:getAll', () => {
    return storeGetAll(store);
  });

  ipcMain.handle('store:importData', (_event, data: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(data)) {
      storeSet(store, key, value);
    }
  });
}

// ── Credential helpers (used by email handlers) ──────────────

export function saveEncryptedCredential(key: string, value: string): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value);
    storeSet(credentialStore, key, encrypted.toString('base64'));
  } else {
    storeSet(credentialStore, key, value);
  }
}

export function getEncryptedCredential(key: string): string | null {
  const stored = storeGet(credentialStore, key) as string | undefined;
  if (!stored) return null;

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(stored, 'base64');
      return safeStorage.decryptString(buffer);
    } catch {
      return stored;
    }
  }
  return stored;
}
