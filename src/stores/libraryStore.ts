/**
 * Library Store - Manages component library and custom components
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ComponentCategory } from '../types';
import { componentOptions } from '../data/componentOptions';

export interface LibraryComponent {
  id: string;
  category: ComponentCategory;
  name: string;
  brand?: string;
  isCustom: boolean;
  createdAt: number;
}

export interface ComponentLibrary {
  components: LibraryComponent[];
  version: number;
}

interface LibraryState {
  library: ComponentLibrary;

  // Actions
  addComponent: (category: ComponentCategory, name: string, brand?: string) => LibraryComponent;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<Omit<LibraryComponent, 'id'>>) => void;

  // Queries
  getComponentsByCategory: (category: ComponentCategory) => LibraryComponent[];
  getComponentOptions: (category: ComponentCategory) => string[];
  searchComponents: (query: string, category?: ComponentCategory) => LibraryComponent[];

  // Import/Export
  exportLibrary: () => string;
  importLibrary: (json: string) => number;
  resetLibrary: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initialize library from default component options
const createInitialLibrary = (): ComponentLibrary => {
  const components: LibraryComponent[] = [];

  Object.entries(componentOptions).forEach(([category, options]) => {
    options.forEach((name) => {
      components.push({
        id: generateId(),
        category: category as ComponentCategory,
        name,
        isCustom: false,
        createdAt: Date.now(),
      });
    });
  });

  return {
    components,
    version: 1,
  };
};

// Detect brand from component name
const detectBrand = (name: string): string | undefined => {
  const brandPatterns: Record<string, RegExp> = {
    Intel: /^Intel|Intel$/i,
    AMD: /^AMD|AMD$/i,
    NVIDIA: /^NVIDIA|GeForce|RTX|GTX/i,
    ASUS: /^ASUS|ROG|TUF/i,
    MSI: /^MSI/i,
    Gigabyte: /^Gigabyte|AORUS/i,
    ASRock: /^ASRock/i,
    Corsair: /^Corsair/i,
    NZXT: /^NZXT/i,
    'Lian Li': /^Lian Li/i,
    'Fractal Design': /^Fractal/i,
    'be quiet!': /^be quiet/i,
    Phanteks: /^Phanteks/i,
    Samsung: /^Samsung/i,
    'Western Digital': /^WD|^Western Digital/i,
    Seagate: /^Seagate/i,
    Kingston: /^Kingston/i,
    Crucial: /^Crucial/i,
    'G.Skill': /^G\.?Skill/i,
  };

  for (const [brand, pattern] of Object.entries(brandPatterns)) {
    if (pattern.test(name)) {
      return brand;
    }
  }

  return undefined;
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      library: createInitialLibrary(),

      addComponent: (category, name, brand) => {
        const component: LibraryComponent = {
          id: generateId(),
          category,
          name,
          brand: brand || detectBrand(name),
          isCustom: true,
          createdAt: Date.now(),
        };

        set((state) => ({
          library: {
            ...state.library,
            components: [...state.library.components, component],
          },
        }));

        return component;
      },

      removeComponent: (id) =>
        set((state) => ({
          library: {
            ...state.library,
            components: state.library.components.filter((c) => c.id !== id),
          },
        })),

      updateComponent: (id, updates) =>
        set((state) => ({
          library: {
            ...state.library,
            components: state.library.components.map((c) =>
              c.id === id ? { ...c, ...updates } : c
            ),
          },
        })),

      getComponentsByCategory: (category) =>
        get().library.components.filter((c) => c.category === category),

      getComponentOptions: (category) =>
        get()
          .library.components.filter((c) => c.category === category)
          .map((c) => c.name),

      searchComponents: (query, category) => {
        const lowerQuery = query.toLowerCase();
        return get().library.components.filter(
          (c) =>
            (!category || c.category === category) &&
            (c.name.toLowerCase().includes(lowerQuery) ||
              c.brand?.toLowerCase().includes(lowerQuery))
        );
      },

      exportLibrary: () => JSON.stringify(get().library, null, 2),

      importLibrary: (json) => {
        try {
          const imported = JSON.parse(json) as ComponentLibrary;
          if (!imported.components || !Array.isArray(imported.components)) {
            return 0;
          }

          // Merge with existing, avoiding duplicates
          const existing = get().library.components;
          const existingNames = new Set(existing.map((c) => `${c.category}:${c.name}`));

          const newComponents = imported.components
            .filter((c) => !existingNames.has(`${c.category}:${c.name}`))
            .map((c) => ({
              ...c,
              id: generateId(),
              createdAt: Date.now(),
            }));

          set((state) => ({
            library: {
              ...state.library,
              components: [...state.library.components, ...newComponents],
            },
          }));

          return newComponents.length;
        } catch {
          return 0;
        }
      },

      resetLibrary: () => set({ library: createInitialLibrary() }),
    }),
    {
      name: 'prebuild-library-store',
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Check for legacy data
          try {
            const legacyLibrary = localStorage.getItem('customComponentLibrary');
            if (legacyLibrary) {
              const state = persistedState as LibraryState;
              const parsed = JSON.parse(legacyLibrary);
              if (parsed.components) {
                state.library = parsed;
              }
            }
            return persistedState;
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
