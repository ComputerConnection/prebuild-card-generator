/**
 * Custom Zustand persist storage that auto-detects Electron vs. web environment.
 * In Electron, persists via IPC to electron-store (async).
 * In web, persists to localStorage (sync).
 */

import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

const stateStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (isElectron && window.electronAPI) {
      return window.electronAPI.store.get<string>(name);
    }
    return localStorage.getItem(name);
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.store.set(name, value);
    } else {
      localStorage.setItem(name, value);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (isElectron && window.electronAPI) {
      await window.electronAPI.store.delete(name);
    } else {
      localStorage.removeItem(name);
    }
  },
};

export const zustandStorage = createJSONStorage(() => stateStorage);
