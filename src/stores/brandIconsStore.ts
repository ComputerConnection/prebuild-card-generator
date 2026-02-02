/**
 * Brand Icons Store - Manages custom brand icons and store profiles
 *
 * Handles migration from legacy localStorage keys:
 * - 'prebuild-card-brand-icons' (from App.tsx legacy system)
 * - 'customBrandIcons', 'storeProfiles', 'activeStoreId' (older format)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrandIcon, StoreProfile, ColorTheme } from '../types';

// Legacy localStorage keys to migrate from
const LEGACY_KEYS = {
  brandIcons: 'prebuild-card-brand-icons',
  customBrandIcons: 'customBrandIcons',
  storeProfiles: 'storeProfiles',
  activeStoreId: 'activeStoreId',
} as const;

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
        const state = persistedState as BrandIconsState;

        // Version 0 -> 1: Migrate from old localStorage keys
        if (version === 0 || version === 1) {
          try {
            // Migrate from 'prebuild-card-brand-icons' (App.tsx legacy)
            const appLegacyIcons = localStorage.getItem(LEGACY_KEYS.brandIcons);
            if (appLegacyIcons) {
              const parsed = JSON.parse(appLegacyIcons) as BrandIcon[];
              if (Array.isArray(parsed)) {
                // Merge with existing icons, avoiding duplicates
                const existingNames = new Set(state.icons.map(i => i.name.toLowerCase()));
                const newIcons = parsed.filter(i => !existingNames.has(i.name.toLowerCase()));
                state.icons = [...state.icons, ...newIcons];
              }
              // Clean up legacy key
              localStorage.removeItem(LEGACY_KEYS.brandIcons);
            }

            // Migrate from 'customBrandIcons' (older format)
            const customIcons = localStorage.getItem(LEGACY_KEYS.customBrandIcons);
            if (customIcons && state.icons.length === 0) {
              const parsed = JSON.parse(customIcons) as BrandIcon[];
              if (Array.isArray(parsed)) {
                state.icons = parsed;
              }
              localStorage.removeItem(LEGACY_KEYS.customBrandIcons);
            }

            // Migrate profiles
            const legacyProfiles = localStorage.getItem(LEGACY_KEYS.storeProfiles);
            if (legacyProfiles && state.profiles.length === 0) {
              const parsed = JSON.parse(legacyProfiles);
              if (Array.isArray(parsed)) {
                state.profiles = parsed;
              }
              localStorage.removeItem(LEGACY_KEYS.storeProfiles);
            }

            // Migrate active profile ID
            const legacyActiveId = localStorage.getItem(LEGACY_KEYS.activeStoreId);
            if (legacyActiveId && !state.activeProfileId) {
              state.activeProfileId = JSON.parse(legacyActiveId);
              localStorage.removeItem(LEGACY_KEYS.activeStoreId);
            }
          } catch {
            // Ignore parse errors, keep existing state
          }
        }

        return state;
      },
      version: 2,
      // Run migration check on every rehydration to catch any leftover legacy data
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Check for any remaining legacy data and migrate it
        try {
          const appLegacyIcons = localStorage.getItem(LEGACY_KEYS.brandIcons);
          if (appLegacyIcons) {
            const parsed = JSON.parse(appLegacyIcons) as BrandIcon[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Import and clean up
              state.importIcons(parsed);
              localStorage.removeItem(LEGACY_KEYS.brandIcons);
            }
          }
        } catch {
          // Ignore errors
        }
      },
    }
  )
);
