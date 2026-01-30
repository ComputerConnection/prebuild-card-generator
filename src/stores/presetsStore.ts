/**
 * Presets Store - Manages saved presets and folders
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Preset, PresetFolder, PrebuildConfig } from '../types';
import { DEFAULT_FOLDERS } from '../types';

interface PresetsState {
  // Presets
  presets: Preset[];
  folders: PresetFolder[];

  // Actions - Presets
  addPreset: (name: string, config: PrebuildConfig, folder?: string) => Preset;
  updatePreset: (id: string, updates: Partial<Omit<Preset, 'id'>>) => void;
  deletePreset: (id: string) => void;
  duplicatePreset: (id: string) => Preset | null;
  movePresetToFolder: (presetId: string, folderId: string | undefined) => void;

  // Actions - Folders
  addFolder: (name: string, color: string) => PresetFolder;
  updateFolder: (id: string, updates: Partial<Omit<PresetFolder, 'id'>>) => void;
  deleteFolder: (id: string, deletePresets?: boolean) => void;

  // Queries
  getPresetsByFolder: (folderId?: string) => Preset[];
  getPresetById: (id: string) => Preset | undefined;
  getFolderById: (id: string) => PresetFolder | undefined;

  // Batch operations
  deleteMultiplePresets: (ids: string[]) => void;
  exportPresets: (ids: string[]) => string;
  importPresets: (json: string) => number;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const usePresetsStore = create<PresetsState>()(
  persist(
    (set, get) => ({
      presets: [],
      folders: [...DEFAULT_FOLDERS],

      // Preset actions
      addPreset: (name, config, folder) => {
        const preset: Preset = {
          id: generateId(),
          name,
          config,
          createdAt: Date.now(),
          folder,
        };
        set((state) => ({ presets: [...state.presets, preset] }));
        return preset;
      },

      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),

      duplicatePreset: (id) => {
        const original = get().presets.find((p) => p.id === id);
        if (!original) return null;
        const duplicate: Preset = {
          ...original,
          id: generateId(),
          name: `${original.name} (Copy)`,
          createdAt: Date.now(),
        };
        set((state) => ({ presets: [...state.presets, duplicate] }));
        return duplicate;
      },

      movePresetToFolder: (presetId, folderId) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === presetId ? { ...p, folder: folderId } : p
          ),
        })),

      // Folder actions
      addFolder: (name, color) => {
        const folder: PresetFolder = {
          id: generateId(),
          name,
          color,
        };
        set((state) => ({ folders: [...state.folders, folder] }));
        return folder;
      },

      updateFolder: (id, updates) =>
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      deleteFolder: (id, deletePresets = false) =>
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          presets: deletePresets
            ? state.presets.filter((p) => p.folder !== id)
            : state.presets.map((p) =>
                p.folder === id ? { ...p, folder: undefined } : p
              ),
        })),

      // Queries
      getPresetsByFolder: (folderId) =>
        get().presets.filter((p) =>
          folderId ? p.folder === folderId : !p.folder
        ),

      getPresetById: (id) => get().presets.find((p) => p.id === id),

      getFolderById: (id) => get().folders.find((f) => f.id === id),

      // Batch operations
      deleteMultiplePresets: (ids) =>
        set((state) => ({
          presets: state.presets.filter((p) => !ids.includes(p.id)),
        })),

      exportPresets: (ids) => {
        const presetsToExport = get().presets.filter((p) => ids.includes(p.id));
        return JSON.stringify(presetsToExport, null, 2);
      },

      importPresets: (json) => {
        try {
          const imported = JSON.parse(json) as Preset[];
          if (!Array.isArray(imported)) return 0;

          const newPresets = imported.map((p) => ({
            ...p,
            id: generateId(), // Generate new IDs to avoid conflicts
            createdAt: Date.now(),
          }));

          set((state) => ({
            presets: [...state.presets, ...newPresets],
          }));

          return newPresets.length;
        } catch {
          return 0;
        }
      },
    }),
    {
      name: 'prebuild-presets-store',
      // Migrate from old localStorage keys
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Check for legacy data
          try {
            const legacyPresets = localStorage.getItem('prebuildPresets');
            const legacyFolders = localStorage.getItem('prebuildPresetFolders');

            const state = persistedState as PresetsState;

            if (legacyPresets && state.presets.length === 0) {
              state.presets = JSON.parse(legacyPresets);
            }
            if (legacyFolders) {
              const folders = JSON.parse(legacyFolders);
              if (folders.length > 0) {
                state.folders = folders;
              }
            }

            return state;
          } catch {
            return persistedState;
          }
        }
        return persistedState;
      },
      version: 1,
    }
  )
);
