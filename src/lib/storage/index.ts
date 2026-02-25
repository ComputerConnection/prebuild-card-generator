/**
 * Storage abstraction layer
 * Provides unified storage operations with backwards compatibility.
 * Auto-detects Electron vs. web environment.
 */

export * from './types';
export * from './localStorage';
export * from './electronStore';

import { LocalStorageAdapter, migrateLegacyData } from './localStorage';
import { ElectronStoreAdapter } from './electronStore';
import type { StorageAdapter } from './types';

/** True when running inside the Electron shell */
export const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// Create the appropriate adapter based on environment
let storageAdapter: StorageAdapter;

if (isElectron) {
  storageAdapter = new ElectronStoreAdapter();
} else {
  const adapter = new LocalStorageAdapter();
  migrateLegacyData(adapter);
  storageAdapter = adapter;
}

export { storageAdapter };
export default storageAdapter;
