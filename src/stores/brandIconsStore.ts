/**
 * Brand Icons Store - Manages custom brand icons and store profiles
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrandIcon, StoreProfile, ColorTheme } from '../types';

interface BrandIconsState {
  // Brand icons (shared across all configs)
  icons: BrandIcon[];

  // Store profiles
  profiles: StoreProfile[];
  activeProfileId: string | null;

  // Icon actions
  addIcon: (name: string, image: string) => void;
  removeIcon: (name: string) => void;
  updateIcon: (name: string, updates: Partial<BrandIcon>) => void;
  getIconByName: (name: string) => BrandIcon | undefined;

  // Profile actions
  addProfile: (name: string, logo: string | null, defaultTheme: ColorTheme) => StoreProfile;
  updateProfile: (id: string, updates: Partial<Omit<StoreProfile, 'id'>>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  getActiveProfile: () => StoreProfile | undefined;

  // Bulk operations
  importIcons: (icons: BrandIcon[]) => number;
  exportIcons: () => string;
  clearIcons: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useBrandIconsStore = create<BrandIconsState>()(
  persist(
    (set, get) => ({
      icons: [],
      profiles: [],
      activeProfileId: null,

      // Icon actions
      addIcon: (name, image) =>
        set((state) => {
          // Check if icon with same name exists
          const exists = state.icons.some((i) => i.name.toLowerCase() === name.toLowerCase());
          if (exists) {
            // Update existing
            return {
              icons: state.icons.map((i) =>
                i.name.toLowerCase() === name.toLowerCase() ? { ...i, image } : i
              ),
            };
          }
          return { icons: [...state.icons, { name, image }] };
        }),

      removeIcon: (name) =>
        set((state) => ({
          icons: state.icons.filter((i) => i.name !== name),
        })),

      updateIcon: (name, updates) =>
        set((state) => ({
          icons: state.icons.map((i) => (i.name === name ? { ...i, ...updates } : i)),
        })),

      getIconByName: (name) =>
        get().icons.find((i) => i.name.toLowerCase() === name.toLowerCase()),

      // Profile actions
      addProfile: (name, logo, defaultTheme) => {
        const profile: StoreProfile = {
          id: generateId(),
          name,
          logo,
          defaultTheme,
        };
        set((state) => ({ profiles: [...state.profiles, profile] }));
        return profile;
      },

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
        })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get();
        return profiles.find((p) => p.id === activeProfileId);
      },

      // Bulk operations
      importIcons: (icons) => {
        const existing = get().icons;
        const existingNames = new Set(existing.map((i) => i.name.toLowerCase()));
        const newIcons = icons.filter((i) => !existingNames.has(i.name.toLowerCase()));

        set((state) => ({
          icons: [...state.icons, ...newIcons],
        }));

        return newIcons.length;
      },

      exportIcons: () => JSON.stringify(get().icons, null, 2),

      clearIcons: () => set({ icons: [] }),
    }),
    {
      name: 'prebuild-brand-icons-store',
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Check for legacy data
          try {
            const legacyIcons = localStorage.getItem('customBrandIcons');
            const legacyProfiles = localStorage.getItem('storeProfiles');
            const legacyActiveId = localStorage.getItem('activeStoreId');

            const state = persistedState as BrandIconsState;

            if (legacyIcons && state.icons.length === 0) {
              state.icons = JSON.parse(legacyIcons);
            }
            if (legacyProfiles && state.profiles.length === 0) {
              state.profiles = JSON.parse(legacyProfiles);
            }
            if (legacyActiveId && !state.activeProfileId) {
              state.activeProfileId = JSON.parse(legacyActiveId);
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
