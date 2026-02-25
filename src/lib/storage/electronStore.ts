/**
 * Electron storage adapter — routes CRUD through IPC to the main process.
 * Implements the same StorageAdapter interface as localStorage.ts,
 * so all stores and components work without changes.
 *
 * NOTE: The underlying IPC calls are async, but the StorageAdapter interface
 * is synchronous. We use a local cache that syncs eagerly with the main
 * process store. On startup, the cache is populated from the main process.
 */

import type { StorageAdapter, StorageOptions } from './types';

const DEFAULT_PREFIX = 'prebuild-card-generator';

export class ElectronStoreAdapter implements StorageAdapter {
  private prefix: string;
  private cache: Map<string, unknown> = new Map();
  private readyPromise: Promise<void>;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix || DEFAULT_PREFIX;
    this.readyPromise = this.initCache();
  }

  /**
   * Populate the local cache from the main process store.
   * Called once on construction; the result is stored as readyPromise.
   */
  private async initCache(): Promise<void> {
    if (!window.electronAPI) return;

    try {
      const allData = await window.electronAPI.store.getAll();
      for (const [key, value] of Object.entries(allData)) {
        this.cache.set(key, value);
      }
    } catch (error) {
      console.error('Failed to initialize electron store cache:', error);
    }
  }

  private getFullKey(key: string): string {
    return `${this.prefix}-${key}`;
  }

  get<T>(key: string): T | null {
    const fullKey = this.getFullKey(key);

    // Read from cache (sync) — the cache is kept in sync by set/remove
    const cached = this.cache.get(fullKey);
    if (cached !== undefined) {
      return cached as T;
    }

    // If not in cache, try async fetch and update cache for next call
    if (window.electronAPI) {
      window.electronAPI.store.get<T>(fullKey).then((value) => {
        if (value !== null) {
          this.cache.set(fullKey, value);
        }
      });
    }

    return null;
  }

  set<T>(key: string, value: T): void {
    const fullKey = this.getFullKey(key);

    // Update cache immediately (sync)
    this.cache.set(fullKey, value);

    // Persist to main process (async, fire-and-forget)
    if (window.electronAPI) {
      window.electronAPI.store.set(fullKey, value).catch((error) => {
        console.error(`Error writing to electron store: ${fullKey}`, error);
      });
    }
  }

  remove(key: string): void {
    const fullKey = this.getFullKey(key);

    // Update cache immediately
    this.cache.delete(fullKey);

    // Persist deletion
    if (window.electronAPI) {
      window.electronAPI.store.delete(fullKey).catch((error) => {
        console.error(`Error removing from electron store: ${fullKey}`, error);
      });
    }
  }

  clear(): void {
    // Clear all keys with our prefix from cache
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.prefix)) {
        this.cache.delete(key);
      }
    }

    // Clear main process store
    if (window.electronAPI) {
      window.electronAPI.store.clear().catch((error) => {
        console.error('Error clearing electron store', error);
      });
    }
  }

  keys(): string[] {
    const result: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(this.prefix)) {
        result.push(key.slice(this.prefix.length + 1));
      }
    }
    return result;
  }

  has(key: string): boolean {
    const fullKey = this.getFullKey(key);
    return this.cache.has(fullKey);
  }

  /**
   * Wait for the initial cache population to complete.
   * Call this before first read if you need guaranteed fresh data.
   */
  async waitForInit(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Export all data for backup purposes.
   */
  async exportAll(): Promise<Record<string, unknown>> {
    if (!window.electronAPI) return {};
    return window.electronAPI.store.getAll();
  }

  /**
   * Import data from backup.
   */
  async importAll(data: Record<string, unknown>): Promise<void> {
    if (!window.electronAPI) return;
    await window.electronAPI.store.importData(data);
    // Refresh cache
    await this.initCache();
  }
}
