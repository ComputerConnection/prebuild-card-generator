/**
 * Tests for storage abstraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LocalStorageAdapter,
  createVersionedStorage,
  migrateLegacyData,
} from '../../../lib/storage';

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter({ prefix: 'test-app' });
  });

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      adapter.set('key1', { name: 'Test', value: 123 });
      const result = adapter.get<{ name: string; value: number }>('key1');

      expect(result).toEqual({ name: 'Test', value: 123 });
    });

    it('should return null for non-existent keys', () => {
      const result = adapter.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle string values', () => {
      adapter.set('string-key', 'hello');
      expect(adapter.get('string-key')).toBe('hello');
    });

    it('should handle array values', () => {
      adapter.set('array-key', [1, 2, 3]);
      expect(adapter.get('array-key')).toEqual([1, 2, 3]);
    });
  });

  describe('remove', () => {
    it('should remove a key', () => {
      adapter.set('to-remove', 'value');
      expect(adapter.has('to-remove')).toBe(true);

      adapter.remove('to-remove');
      expect(adapter.has('to-remove')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      adapter.set('exists', 'value');
      expect(adapter.has('exists')).toBe(true);
    });

    it('should return false for non-existing keys', () => {
      expect(adapter.has('not-exists')).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return only keys with the prefix', () => {
      adapter.set('key1', 'value1');
      adapter.set('key2', 'value2');

      // Set a key without adapter (different prefix or no prefix)
      localStorage.setItem('other-key', 'value');

      const keys = adapter.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).not.toContain('other-key');
    });
  });

  describe('clear', () => {
    it('should clear only prefixed keys', () => {
      adapter.set('key1', 'value1');
      adapter.set('key2', 'value2');
      localStorage.setItem('other-key', 'value');

      adapter.clear();

      expect(adapter.keys()).toHaveLength(0);
      expect(localStorage.getItem('other-key')).toBe('value');
    });
  });
});

describe('createVersionedStorage', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter({ prefix: 'versioned-test' });
  });

  it('should return default value when no data exists', () => {
    const storage = createVersionedStorage(adapter, 'config', 1, { name: 'default' });
    expect(storage.get()).toEqual({ name: 'default' });
  });

  it('should store and retrieve versioned data', () => {
    const storage = createVersionedStorage(adapter, 'config', 1, { name: '' });

    storage.set({ name: 'stored' });
    expect(storage.get()).toEqual({ name: 'stored' });
  });

  it('should migrate old version data', () => {
    const migrate = vi.fn((oldData: { oldName: string }, oldVersion: number) => {
      return { name: oldData.oldName, version: oldVersion };
    });

    // Set old version data
    adapter.set('config', {
      version: 0,
      data: { oldName: 'legacy' },
      timestamp: Date.now(),
    });

    const storage = createVersionedStorage(adapter, 'config', 1, { name: '', version: 0 }, migrate);

    const result = storage.get();
    expect(migrate).toHaveBeenCalledWith({ oldName: 'legacy' }, 0);
    expect(result).toEqual({ name: 'legacy', version: 0 });
  });

  it('should not migrate if versions match', () => {
    const migrate = vi.fn();

    adapter.set('config', {
      version: 1,
      data: { name: 'current' },
      timestamp: Date.now(),
    });

    const storage = createVersionedStorage(adapter, 'config', 1, { name: '' }, migrate);

    storage.get();
    expect(migrate).not.toHaveBeenCalled();
  });

  it('should check if data exists', () => {
    const storage = createVersionedStorage(adapter, 'config', 1, { name: '' });

    expect(storage.has()).toBe(false);
    storage.set({ name: 'test' });
    expect(storage.has()).toBe(true);
  });

  it('should remove data', () => {
    const storage = createVersionedStorage(adapter, 'config', 1, { name: '' });

    storage.set({ name: 'test' });
    storage.remove();
    expect(storage.has()).toBe(false);
  });
});

describe('migrateLegacyData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should migrate legacy keys to new prefixed keys', () => {
    // Set legacy data
    localStorage.setItem('prebuildPresets', JSON.stringify([{ id: '1', name: 'Test' }]));

    const adapter = new LocalStorageAdapter();
    migrateLegacyData(adapter);

    const migrated = adapter.get<Array<{ id: string; name: string }>>('presets');
    expect(migrated).toEqual([{ id: '1', name: 'Test' }]);
  });

  it('should not overwrite existing data', () => {
    localStorage.setItem('prebuildPresets', JSON.stringify([{ id: '1', name: 'Legacy' }]));

    const adapter = new LocalStorageAdapter();
    adapter.set('presets', [{ id: '2', name: 'New' }]);

    migrateLegacyData(adapter);

    const data = adapter.get<Array<{ id: string; name: string }>>('presets');
    expect(data).toEqual([{ id: '2', name: 'New' }]);
  });
});
