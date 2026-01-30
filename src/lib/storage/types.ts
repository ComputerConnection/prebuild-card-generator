/**
 * Storage abstraction types
 * Provides type-safe storage operations with versioning support
 */

export interface StorageAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
  has(key: string): boolean;
}

export interface StorageOptions {
  prefix?: string;
  version?: number;
}

export interface VersionedData<T> {
  version: number;
  data: T;
  timestamp: number;
}

export type MigrationFn<T> = (oldData: unknown, oldVersion: number) => T;

export interface StorageConfig<T> {
  key: string;
  version: number;
  defaultValue: T;
  migrate?: MigrationFn<T>;
}
