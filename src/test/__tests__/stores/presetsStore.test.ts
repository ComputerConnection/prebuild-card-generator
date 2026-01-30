/**
 * Tests for presetsStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePresetsStore } from '../../../stores/presetsStore';
import { defaultConfig } from '../../../data/componentOptions';
import type { PrebuildConfig } from '../../../types';

describe('presetsStore', () => {
  beforeEach(() => {
    // Reset the store
    usePresetsStore.setState({
      presets: [],
      folders: [
        { id: 'gaming', name: 'Gaming', color: '#dc2626' },
        { id: 'workstation', name: 'Workstation', color: '#2563eb' },
        { id: 'budget', name: 'Budget', color: '#16a34a' },
        { id: 'custom', name: 'Custom', color: '#8b5cf6' },
      ],
    });
  });

  const mockConfig: PrebuildConfig = {
    ...defaultConfig,
    modelName: 'Test Build',
    price: '$999',
  } as PrebuildConfig;

  describe('addPreset', () => {
    it('should add a new preset', () => {
      const preset = usePresetsStore.getState().addPreset('My Preset', mockConfig);

      expect(preset.name).toBe('My Preset');
      expect(preset.config.modelName).toBe('Test Build');
      expect(usePresetsStore.getState().presets).toHaveLength(1);
    });

    it('should add preset to folder', () => {
      const preset = usePresetsStore.getState().addPreset('Gaming Build', mockConfig, 'gaming');

      expect(preset.folder).toBe('gaming');
    });

    it('should generate unique IDs', () => {
      const preset1 = usePresetsStore.getState().addPreset('Preset 1', mockConfig);
      const preset2 = usePresetsStore.getState().addPreset('Preset 2', mockConfig);

      expect(preset1.id).not.toBe(preset2.id);
    });
  });

  describe('updatePreset', () => {
    it('should update preset name', () => {
      const preset = usePresetsStore.getState().addPreset('Original', mockConfig);
      usePresetsStore.getState().updatePreset(preset.id, { name: 'Updated' });

      const updated = usePresetsStore.getState().getPresetById(preset.id);
      expect(updated?.name).toBe('Updated');
    });

    it('should update preset config', () => {
      const preset = usePresetsStore.getState().addPreset('Test', mockConfig);
      const newConfig = { ...mockConfig, modelName: 'Updated Build' };
      usePresetsStore.getState().updatePreset(preset.id, { config: newConfig });

      const updated = usePresetsStore.getState().getPresetById(preset.id);
      expect(updated?.config.modelName).toBe('Updated Build');
    });
  });

  describe('deletePreset', () => {
    it('should remove preset', () => {
      const preset = usePresetsStore.getState().addPreset('To Delete', mockConfig);
      expect(usePresetsStore.getState().presets).toHaveLength(1);

      usePresetsStore.getState().deletePreset(preset.id);
      expect(usePresetsStore.getState().presets).toHaveLength(0);
    });
  });

  describe('duplicatePreset', () => {
    it('should create a copy with new ID and name', () => {
      const original = usePresetsStore.getState().addPreset('Original', mockConfig);
      const duplicate = usePresetsStore.getState().duplicatePreset(original.id);

      expect(duplicate).not.toBeNull();
      expect(duplicate?.id).not.toBe(original.id);
      expect(duplicate?.name).toBe('Original (Copy)');
      expect(duplicate?.config.modelName).toBe(original.config.modelName);
    });

    it('should return null for non-existent preset', () => {
      const result = usePresetsStore.getState().duplicatePreset('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('movePresetToFolder', () => {
    it('should move preset to new folder', () => {
      const preset = usePresetsStore.getState().addPreset('Test', mockConfig);
      usePresetsStore.getState().movePresetToFolder(preset.id, 'gaming');

      const moved = usePresetsStore.getState().getPresetById(preset.id);
      expect(moved?.folder).toBe('gaming');
    });

    it('should move preset to no folder', () => {
      const preset = usePresetsStore.getState().addPreset('Test', mockConfig, 'gaming');
      usePresetsStore.getState().movePresetToFolder(preset.id, undefined);

      const moved = usePresetsStore.getState().getPresetById(preset.id);
      expect(moved?.folder).toBeUndefined();
    });
  });

  describe('folders', () => {
    it('should add a new folder', () => {
      const folder = usePresetsStore.getState().addFolder('New Folder', '#ff0000');

      expect(folder.name).toBe('New Folder');
      expect(folder.color).toBe('#ff0000');
      expect(usePresetsStore.getState().folders).toHaveLength(5);
    });

    it('should update folder', () => {
      const folder = usePresetsStore.getState().addFolder('Test', '#000000');
      usePresetsStore.getState().updateFolder(folder.id, { name: 'Updated', color: '#ffffff' });

      const updated = usePresetsStore.getState().getFolderById(folder.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.color).toBe('#ffffff');
    });

    it('should delete folder and keep presets', () => {
      const folder = usePresetsStore.getState().addFolder('To Delete', '#000000');
      usePresetsStore.getState().addPreset('Test', mockConfig, folder.id);

      usePresetsStore.getState().deleteFolder(folder.id, false);

      const preset = usePresetsStore.getState().presets[0];
      expect(preset.folder).toBeUndefined();
    });

    it('should delete folder and its presets', () => {
      const folder = usePresetsStore.getState().addFolder('To Delete', '#000000');
      usePresetsStore.getState().addPreset('Test', mockConfig, folder.id);

      usePresetsStore.getState().deleteFolder(folder.id, true);

      expect(usePresetsStore.getState().presets).toHaveLength(0);
    });
  });

  describe('queries', () => {
    it('should get presets by folder', () => {
      usePresetsStore.getState().addPreset('Gaming 1', mockConfig, 'gaming');
      usePresetsStore.getState().addPreset('Gaming 2', mockConfig, 'gaming');
      usePresetsStore.getState().addPreset('Budget 1', mockConfig, 'budget');

      const gamingPresets = usePresetsStore.getState().getPresetsByFolder('gaming');
      expect(gamingPresets).toHaveLength(2);
    });

    it('should get presets without folder', () => {
      usePresetsStore.getState().addPreset('No Folder 1', mockConfig);
      usePresetsStore.getState().addPreset('No Folder 2', mockConfig);
      usePresetsStore.getState().addPreset('With Folder', mockConfig, 'gaming');

      const noFolderPresets = usePresetsStore.getState().getPresetsByFolder(undefined);
      expect(noFolderPresets).toHaveLength(2);
    });
  });

  describe('batch operations', () => {
    it('should delete multiple presets', () => {
      const p1 = usePresetsStore.getState().addPreset('P1', mockConfig);
      const p2 = usePresetsStore.getState().addPreset('P2', mockConfig);
      usePresetsStore.getState().addPreset('P3', mockConfig);

      usePresetsStore.getState().deleteMultiplePresets([p1.id, p2.id]);

      expect(usePresetsStore.getState().presets).toHaveLength(1);
    });

    it('should export presets as JSON', () => {
      const p1 = usePresetsStore.getState().addPreset('P1', mockConfig);
      const p2 = usePresetsStore.getState().addPreset('P2', mockConfig);

      const json = usePresetsStore.getState().exportPresets([p1.id, p2.id]);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('P1');
    });

    it('should import presets from JSON', () => {
      const presets = [
        { id: '1', name: 'Imported 1', config: mockConfig, createdAt: Date.now() },
        { id: '2', name: 'Imported 2', config: mockConfig, createdAt: Date.now() },
      ];

      const count = usePresetsStore.getState().importPresets(JSON.stringify(presets));

      expect(count).toBe(2);
      expect(usePresetsStore.getState().presets).toHaveLength(2);
    });

    it('should return 0 for invalid JSON import', () => {
      const count = usePresetsStore.getState().importPresets('invalid json');
      expect(count).toBe(0);
    });
  });
});
