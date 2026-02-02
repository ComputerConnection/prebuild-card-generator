import { ComponentCategory } from '../types';

export interface ComponentEntry {
  id: string;
  category: ComponentCategory;
  brand: string;
  modelLine: string;
  model: string;
  fullName: string;
  isCustom?: boolean;
}

export interface ComponentLibrary {
  components: ComponentEntry[];
  version: number;
}

const LIBRARY_STORAGE_KEY = 'prebuild-card-component-library';
const LIBRARY_VERSION = 1;

// Known brands by category for smart suggestions
export const CATEGORY_BRANDS: Record<ComponentCategory, string[]> = {
  cpu: ['Intel', 'AMD'],
  gpu: ['NVIDIA', 'AMD', 'Intel'],
  ram: ['Corsair', 'G.Skill', 'Kingston', 'Crucial', 'Team Group', 'PNY'],
  storage: ['Samsung', 'Western Digital', 'Seagate', 'Crucial', 'SK hynix', 'Sabrent', 'Kingston'],
  motherboard: ['ASUS', 'MSI', 'Gigabyte', 'ASRock'],
  psu: ['Corsair', 'Seasonic', 'EVGA', 'be quiet!', 'Thermaltake', 'Cooler Master'],
  case: ['Lian Li', 'NZXT', 'Corsair', 'Fractal Design', 'Phanteks', 'be quiet!', 'Cooler Master'],
  cooling: ['Noctua', 'Corsair', 'NZXT', 'be quiet!', 'Arctic', 'Cooler Master', 'EK'],
};

// Model lines by brand for smart suggestions
export const BRAND_MODEL_LINES: Record<string, string[]> = {
  // CPUs
  Intel: ['Core i9', 'Core i7', 'Core i5', 'Core i3'],
  AMD: ['Ryzen 9', 'Ryzen 7', 'Ryzen 5', 'Ryzen 3'],
  // GPUs
  NVIDIA: ['RTX 50 Series', 'RTX 40 Series', 'RTX 30 Series'],
  // RAM
  Corsair: ['Vengeance', 'Dominator'],
  'G.Skill': ['Trident Z5', 'Trident Z', 'Ripjaws'],
  Kingston: ['Fury Beast', 'Fury Renegade'],
  // Storage
  Samsung: ['990 Pro', '980 Pro', '970 EVO', '870 EVO'],
  'Western Digital': ['Black SN850X', 'Black SN770', 'Blue SN580'],
  Seagate: ['FireCuda', 'Barracuda'],
  Crucial: ['T700', 'P5 Plus', 'MX500'],
  // Motherboards
  ASUS: ['ROG Maximus', 'ROG Strix', 'TUF Gaming', 'Prime', 'ProArt'],
  MSI: ['MEG', 'MPG', 'MAG', 'Pro'],
  Gigabyte: ['Aorus Master', 'Aorus Elite', 'Gaming X', 'UD'],
  ASRock: ['Taichi', 'Steel Legend', 'Phantom Gaming', 'Pro'],
  // PSUs
  Seasonic: ['Prime', 'Focus', 'Vertex'],
  // Cases
  'Lian Li': ['O11 Dynamic', 'Lancool', 'A4-H2O'],
  NZXT: ['H9', 'H7', 'H5', 'H1'],
  'Fractal Design': ['Torrent', 'North', 'Meshify', 'Define'],
  // Cooling
  Noctua: ['NH-D15', 'NH-U12', 'NH-L9'],
  'be quiet!': ['Dark Rock', 'Pure Rock', 'Silent Loop'],
  Arctic: ['Liquid Freezer', 'Freezer'],
};

/**
 * Parse a component string into structured data
 */
export function parseComponentString(
  fullName: string,
  category: ComponentCategory
): Partial<ComponentEntry> {
  const brands = CATEGORY_BRANDS[category] || [];
  let brand = '';
  let modelLine = '';
  let model = fullName;

  // Try to detect brand
  for (const b of brands) {
    if (fullName.toLowerCase().includes(b.toLowerCase())) {
      brand = b;
      break;
    }
  }

  // Try to detect model line if we have a brand
  if (brand && BRAND_MODEL_LINES[brand]) {
    for (const ml of BRAND_MODEL_LINES[brand]) {
      if (fullName.toLowerCase().includes(ml.toLowerCase())) {
        modelLine = ml;
        break;
      }
    }
  }

  // Extract just the model part (everything after brand/model line)
  if (brand) {
    model = fullName.replace(new RegExp(brand, 'i'), '').trim();
    if (modelLine) {
      model = model.replace(new RegExp(modelLine, 'i'), '').trim();
    }
  }

  return { brand, modelLine, model, fullName };
}

/**
 * Build full display name from parts
 */
export function buildFullName(brand: string, modelLine: string, model: string): string {
  const parts = [brand, modelLine, model].filter(Boolean);
  return parts.join(' ').trim();
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Convert legacy component options to library format
 */
export function convertLegacyOptions(
  options: Record<ComponentCategory, string[]>
): ComponentEntry[] {
  const entries: ComponentEntry[] = [];

  for (const [category, items] of Object.entries(options)) {
    for (const fullName of items) {
      const parsed = parseComponentString(fullName, category as ComponentCategory);
      entries.push({
        id: generateId(),
        category: category as ComponentCategory,
        brand: parsed.brand || '',
        modelLine: parsed.modelLine || '',
        model: parsed.model || fullName,
        fullName: fullName,
        isCustom: false,
      });
    }
  }

  return entries;
}

/**
 * Load component library from localStorage
 */
export function loadComponentLibrary(): ComponentLibrary | null {
  try {
    const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (stored) {
      const lib = JSON.parse(stored) as ComponentLibrary;
      if (lib.version === LIBRARY_VERSION) {
        return lib;
      }
    }
  } catch (e) {
    console.error('Failed to load component library:', e);
  }
  return null;
}

/**
 * Save component library to localStorage
 */
export function saveComponentLibrary(library: ComponentLibrary): void {
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
  } catch (e) {
    console.error('Failed to save component library:', e);
  }
}

/**
 * Add a new component to the library
 */
export function addComponent(
  library: ComponentLibrary,
  category: ComponentCategory,
  brand: string,
  modelLine: string,
  model: string
): ComponentLibrary {
  const fullName = buildFullName(brand, modelLine, model);

  // Check for duplicates
  const exists = library.components.some(
    (c) => c.category === category && c.fullName.toLowerCase() === fullName.toLowerCase()
  );

  if (exists) {
    return library;
  }

  const newEntry: ComponentEntry = {
    id: generateId(),
    category,
    brand,
    modelLine,
    model,
    fullName,
    isCustom: true,
  };

  return {
    ...library,
    components: [...library.components, newEntry],
  };
}

/**
 * Remove a component from the library
 */
export function removeComponent(library: ComponentLibrary, id: string): ComponentLibrary {
  return {
    ...library,
    components: library.components.filter((c) => c.id !== id),
  };
}

/**
 * Get all unique brands for a category
 */
export function getBrandsForCategory(
  library: ComponentLibrary,
  category: ComponentCategory
): string[] {
  const brands = new Set<string>();

  // Add known brands first
  CATEGORY_BRANDS[category]?.forEach((b) => brands.add(b));

  // Add brands from library
  library.components
    .filter((c) => c.category === category && c.brand)
    .forEach((c) => brands.add(c.brand));

  return Array.from(brands).sort();
}

/**
 * Get all unique model lines for a brand in a category
 */
export function getModelLinesForBrand(
  library: ComponentLibrary,
  category: ComponentCategory,
  brand: string
): string[] {
  const modelLines = new Set<string>();

  // Add known model lines first
  BRAND_MODEL_LINES[brand]?.forEach((ml) => modelLines.add(ml));

  // Add model lines from library
  library.components
    .filter((c) => c.category === category && c.brand === brand && c.modelLine)
    .forEach((c) => modelLines.add(c.modelLine));

  return Array.from(modelLines).sort();
}

/**
 * Get all components matching filters
 */
export function getComponents(
  library: ComponentLibrary,
  category: ComponentCategory,
  brand?: string,
  modelLine?: string
): ComponentEntry[] {
  return library.components.filter((c) => {
    if (c.category !== category) return false;
    if (brand && c.brand !== brand) return false;
    if (modelLine && c.modelLine !== modelLine) return false;
    return true;
  });
}

/**
 * Get all components for a category (flat list of full names)
 */
export function getComponentOptions(
  library: ComponentLibrary,
  category: ComponentCategory
): string[] {
  return library.components
    .filter((c) => c.category === category)
    .map((c) => c.fullName)
    .sort();
}

/**
 * Export library as JSON
 */
export function exportLibrary(library: ComponentLibrary): string {
  return JSON.stringify(library, null, 2);
}

/**
 * Import library from JSON
 */
export function importLibrary(json: string): ComponentLibrary | null {
  try {
    const lib = JSON.parse(json) as ComponentLibrary;
    if (lib.components && Array.isArray(lib.components)) {
      return { ...lib, version: LIBRARY_VERSION };
    }
  } catch (e) {
    console.error('Failed to import library:', e);
  }
  return null;
}

/**
 * Create initial library from legacy options
 */
export function createInitialLibrary(
  legacyOptions: Record<ComponentCategory, string[]>
): ComponentLibrary {
  return {
    version: LIBRARY_VERSION,
    components: convertLegacyOptions(legacyOptions),
  };
}
