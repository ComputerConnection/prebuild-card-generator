/**
 * Storage abstraction layer
 * Provides unified storage operations with backwards compatibility
 */

export * from './types';
export * from './localStorage';

import { LocalStorageAdapter, migrateLegacyData } from './localStorage';

// Create singleton adapter instance
const storageAdapter = new LocalStorageAdapter();

// Run migration on load
migrateLegacyData(storageAdapter);

export { storageAdapter };
export default storageAdapter;
