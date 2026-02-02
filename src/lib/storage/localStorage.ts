/**
 * localStorage adapter with versioning and migration support
 */

import type { StorageAdapter, StorageOptions, VersionedData, MigrationFn } from './types';

const DEFAULT_PREFIX = 'prebuild-card-generator';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || DEFAULT_PREFIX;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}-${key}`;
  }

  get<T>(key: string): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
    }
  }

  remove(key: string): void {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.error(`Error removing from localStorage: ${key}`, error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage', error);
    }
  }

  keys(): string[] {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length + 1));
      }
    }
    return result;
  }

  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }
}

/**
 * Versioned storage utility for handling migrations
 */
export function createVersionedStorage<T>(
  adapter: StorageAdapter,
  key: string,
  version: number,
  defaultValue: T,
  migrate?: MigrationFn<T>
) {
  return {
    get(): T {
      const stored = adapter.get<VersionedData<T> | T>(key);

      if (!stored) {
        return defaultValue;
      }

      // Check if it's versioned data
      if (
        typeof stored === 'object' &&
        stored !== null &&
        'version' in stored &&
        'data' in stored
      ) {
        const versionedData = stored as VersionedData<T>;

        if (versionedData.version === version) {
          return versionedData.data;
        }

        // Need migration
        if (migrate && versionedData.version < version) {
          const migratedData = migrate(versionedData.data, versionedData.version);
          this.set(migratedData);
          return migratedData;
        }

        return versionedData.data;
      }

      // Legacy unversioned data - migrate from v0
      if (migrate) {
        const migratedData = migrate(stored, 0);
        this.set(migratedData);
        return migratedData;
      }

      // Try to use as-is
      return stored as T;
    },

    set(value: T): void {
      const versionedData: VersionedData<T> = {
        version,
        data: value,
        timestamp: Date.now(),
      };
      adapter.set(key, versionedData);
    },

    remove(): void {
      adapter.remove(key);
    },

    has(): boolean {
      return adapter.has(key);
    },
  };
}

/**
 * Legacy key mapping for backwards compatibility
 * Maps old keys to new prefixed keys
 */
export const legacyKeyMap: Record<string, string> = {
  prebuildPresets: 'presets',
  prebuildPresetFolders: 'preset-folders',
  customBrandIcons: 'brand-icons',
  storeProfiles: 'store-profiles',
  activeStoreId: 'active-store-id',
  customComponentLibrary: 'component-library',
};

/**
 * Migrate data from legacy keys to new versioned storage
 */
export function migrateLegacyData(adapter: LocalStorageAdapter): void {
  Object.entries(legacyKeyMap).forEach(([oldKey, newKey]) => {
    try {
      const oldData = localStorage.getItem(oldKey);
      if (oldData && !adapter.has(newKey)) {
        adapter.set(newKey, JSON.parse(oldData));
        // Keep old key for now for backwards compatibility
      }
    } catch (error) {
      console.error(`Error migrating legacy key ${oldKey}:`, error);
    }
  });
}
