/**
 * Tests for src/utils/componentLibrary.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseComponentString,
  buildFullName,
  convertLegacyOptions,
  addComponent,
  removeComponent,
  getBrandsForCategory,
  getComponents,
  getComponentOptions,
  CATEGORY_BRANDS,
} from '../../../utils/componentLibrary';
import type { ComponentLibrary } from '../../../utils/componentLibrary';

/**
 * Helper to create an empty library for test isolation.
 */
function createEmptyLibrary(): ComponentLibrary {
  return { components: [], version: 1 };
}

/**
 * Helper to create a library pre-populated with a known set of components.
 */
function createSeededLibrary(): ComponentLibrary {
  return {
    version: 1,
    components: [
      {
        id: 'cpu-1',
        category: 'cpu',
        brand: 'Intel',
        modelLine: 'Core i7',
        model: '13700K',
        fullName: 'Intel Core i7 13700K',
        isCustom: false,
      },
      {
        id: 'cpu-2',
        category: 'cpu',
        brand: 'AMD',
        modelLine: 'Ryzen 7',
        model: '7800X3D',
        fullName: 'AMD Ryzen 7 7800X3D',
        isCustom: false,
      },
      {
        id: 'gpu-1',
        category: 'gpu',
        brand: 'NVIDIA',
        modelLine: '',
        model: 'GeForce RTX 4070',
        fullName: 'NVIDIA GeForce RTX 4070',
        isCustom: false,
      },
      {
        id: 'gpu-2',
        category: 'gpu',
        brand: 'AMD',
        modelLine: '',
        model: 'Radeon RX 7900 XTX',
        fullName: 'AMD Radeon RX 7900 XTX',
        isCustom: false,
      },
      {
        id: 'ram-1',
        category: 'ram',
        brand: 'Corsair',
        modelLine: 'Vengeance',
        model: 'DDR5-6000 32GB',
        fullName: 'Corsair Vengeance DDR5-6000 32GB',
        isCustom: false,
      },
      {
        id: 'custom-1',
        category: 'gpu',
        brand: 'CustomBrand',
        modelLine: '',
        model: 'SuperCard 9000',
        fullName: 'CustomBrand SuperCard 9000',
        isCustom: true,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// parseComponentString
// ---------------------------------------------------------------------------
describe('parseComponentString', () => {
  it('should detect Intel brand and Core i7 model line for cpu', () => {
    const result = parseComponentString('Intel Core i7-13700K', 'cpu');

    expect(result.brand).toBe('Intel');
    expect(result.modelLine).toBe('Core i7');
    expect(result.fullName).toBe('Intel Core i7-13700K');
    // The model should be everything after removing brand and model line
    expect(result.model).toBeDefined();
    expect(result.model).not.toContain('Intel');
    expect(result.model).not.toContain('Core i7');
  });

  it('should detect NVIDIA brand for gpu', () => {
    const result = parseComponentString('NVIDIA GeForce RTX 4070', 'gpu');

    expect(result.brand).toBe('NVIDIA');
    expect(result.fullName).toBe('NVIDIA GeForce RTX 4070');
  });

  it('should return empty brand for unknown parts', () => {
    const result = parseComponentString('Unknown Custom Part', 'cpu');

    expect(result.brand).toBe('');
    expect(result.modelLine).toBe('');
    expect(result.model).toBe('Unknown Custom Part');
    expect(result.fullName).toBe('Unknown Custom Part');
  });

  it('should handle brand-only string', () => {
    const result = parseComponentString('Intel', 'cpu');

    expect(result.brand).toBe('Intel');
    expect(result.fullName).toBe('Intel');
    // After stripping brand, model should be empty or whitespace-trimmed
    expect(result.model).toBe('');
  });

  it('should detect AMD brand and Ryzen 9 model line for cpu', () => {
    const result = parseComponentString('AMD Ryzen 9 7950X', 'cpu');

    expect(result.brand).toBe('AMD');
    expect(result.modelLine).toBe('Ryzen 9');
    expect(result.model).toBe('7950X');
  });

  it('should be case-insensitive for brand detection', () => {
    const result = parseComponentString('intel core i5-14600K', 'cpu');

    expect(result.brand).toBe('Intel');
  });

  it('should detect brand but no model line when model line is absent', () => {
    const result = parseComponentString('Corsair DDR5-6000', 'ram');

    expect(result.brand).toBe('Corsair');
    // "DDR5-6000" does not match any Corsair model line
    expect(result.modelLine).toBe('');
  });

  it('should detect brand and model line for ram', () => {
    const result = parseComponentString('Corsair Vengeance DDR5 32GB', 'ram');

    expect(result.brand).toBe('Corsair');
    expect(result.modelLine).toBe('Vengeance');
  });
});

// ---------------------------------------------------------------------------
// buildFullName
// ---------------------------------------------------------------------------
describe('buildFullName', () => {
  it('should join all three parts with spaces', () => {
    expect(buildFullName('Intel', 'Core i7', '13700K')).toBe('Intel Core i7 13700K');
  });

  it('should handle missing middle part (model line)', () => {
    expect(buildFullName('NVIDIA', '', 'GeForce RTX 4070')).toBe('NVIDIA GeForce RTX 4070');
  });

  it('should filter out empty strings', () => {
    expect(buildFullName('', '', '13700K')).toBe('13700K');
    expect(buildFullName('Intel', '', '')).toBe('Intel');
    expect(buildFullName('', 'Core i7', '')).toBe('Core i7');
  });

  it('should return empty string when all parts are empty', () => {
    expect(buildFullName('', '', '')).toBe('');
  });

  it('should handle brand + model with no model line', () => {
    expect(buildFullName('Samsung', '', '990 Pro 2TB')).toBe('Samsung 990 Pro 2TB');
  });
});

// ---------------------------------------------------------------------------
// convertLegacyOptions
// ---------------------------------------------------------------------------
describe('convertLegacyOptions', () => {
  it('should convert a simple options map to ComponentEntry array', () => {
    const options = {
      cpu: ['Intel Core i7-13700K', 'AMD Ryzen 7 7800X3D'],
      gpu: [] as string[],
      ram: [] as string[],
      storage: [] as string[],
      motherboard: [] as string[],
      psu: [] as string[],
      case: [] as string[],
      cooling: [] as string[],
    };

    const entries = convertLegacyOptions(options);

    expect(entries).toHaveLength(2);
    expect(entries[0].category).toBe('cpu');
    expect(entries[0].fullName).toBe('Intel Core i7-13700K');
    expect(entries[0].brand).toBe('Intel');
    expect(entries[0].isCustom).toBe(false);
    expect(entries[0].id).toBeDefined();
    expect(entries[0].id.length).toBeGreaterThan(0);

    expect(entries[1].category).toBe('cpu');
    expect(entries[1].fullName).toBe('AMD Ryzen 7 7800X3D');
    expect(entries[1].brand).toBe('AMD');
  });

  it('should preserve full names exactly as provided', () => {
    const options = {
      cpu: [] as string[],
      gpu: ['NVIDIA GeForce RTX 4090'] as string[],
      ram: [] as string[],
      storage: [] as string[],
      motherboard: [] as string[],
      psu: [] as string[],
      case: [] as string[],
      cooling: [] as string[],
    };

    const entries = convertLegacyOptions(options);

    expect(entries).toHaveLength(1);
    expect(entries[0].fullName).toBe('NVIDIA GeForce RTX 4090');
    expect(entries[0].category).toBe('gpu');
  });

  it('should return empty array when all categories are empty', () => {
    const options = {
      cpu: [] as string[],
      gpu: [] as string[],
      ram: [] as string[],
      storage: [] as string[],
      motherboard: [] as string[],
      psu: [] as string[],
      case: [] as string[],
      cooling: [] as string[],
    };

    const entries = convertLegacyOptions(options);

    expect(entries).toHaveLength(0);
  });

  it('should generate unique IDs for each entry', () => {
    const options = {
      cpu: ['CPU A', 'CPU B', 'CPU C'],
      gpu: [] as string[],
      ram: [] as string[],
      storage: [] as string[],
      motherboard: [] as string[],
      psu: [] as string[],
      case: [] as string[],
      cooling: [] as string[],
    };

    const entries = convertLegacyOptions(options);
    const ids = entries.map((e) => e.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// addComponent
// ---------------------------------------------------------------------------
describe('addComponent', () => {
  let library: ComponentLibrary;

  beforeEach(() => {
    library = createEmptyLibrary();
  });

  it('should add a new custom component', () => {
    const updated = addComponent(library, 'cpu', 'Intel', 'Core i9', '14900K');

    expect(updated.components).toHaveLength(1);
    expect(updated.components[0].category).toBe('cpu');
    expect(updated.components[0].brand).toBe('Intel');
    expect(updated.components[0].modelLine).toBe('Core i9');
    expect(updated.components[0].model).toBe('14900K');
    expect(updated.components[0].fullName).toBe('Intel Core i9 14900K');
    expect(updated.components[0].isCustom).toBe(true);
    expect(updated.components[0].id).toBeDefined();
  });

  it('should prevent duplicates (case-insensitive)', () => {
    const first = addComponent(library, 'cpu', 'Intel', 'Core i7', '13700K');
    const second = addComponent(first, 'cpu', 'intel', 'core i7', '13700k');

    expect(second.components).toHaveLength(1);
  });

  it('should return unchanged library for exact duplicates', () => {
    const first = addComponent(library, 'gpu', 'NVIDIA', '', 'GeForce RTX 4070');
    const second = addComponent(first, 'gpu', 'NVIDIA', '', 'GeForce RTX 4070');

    expect(second).toBe(first); // Same reference since duplicate detected
    expect(second.components).toHaveLength(1);
  });

  it('should allow same name in different categories', () => {
    const first = addComponent(library, 'cpu', 'TestBrand', '', 'Model X');
    const second = addComponent(first, 'gpu', 'TestBrand', '', 'Model X');

    expect(second.components).toHaveLength(2);
  });

  it('should not mutate the original library', () => {
    const original = createEmptyLibrary();
    const updated = addComponent(original, 'cpu', 'Intel', 'Core i5', '14600K');

    expect(original.components).toHaveLength(0);
    expect(updated.components).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// removeComponent
// ---------------------------------------------------------------------------
describe('removeComponent', () => {
  let library: ComponentLibrary;

  beforeEach(() => {
    library = createSeededLibrary();
  });

  it('should remove a component by ID', () => {
    const updated = removeComponent(library, 'cpu-1');

    expect(updated.components).toHaveLength(library.components.length - 1);
    expect(updated.components.find((c) => c.id === 'cpu-1')).toBeUndefined();
  });

  it('should return unchanged library for non-existent ID', () => {
    const updated = removeComponent(library, 'non-existent-id');

    expect(updated.components).toHaveLength(library.components.length);
  });

  it('should not affect other components', () => {
    const updated = removeComponent(library, 'gpu-1');

    expect(updated.components.find((c) => c.id === 'cpu-1')).toBeDefined();
    expect(updated.components.find((c) => c.id === 'cpu-2')).toBeDefined();
    expect(updated.components.find((c) => c.id === 'gpu-2')).toBeDefined();
    expect(updated.components.find((c) => c.id === 'ram-1')).toBeDefined();
  });

  it('should not mutate the original library', () => {
    const originalLength = library.components.length;
    removeComponent(library, 'cpu-1');

    expect(library.components).toHaveLength(originalLength);
  });
});

// ---------------------------------------------------------------------------
// getBrandsForCategory
// ---------------------------------------------------------------------------
describe('getBrandsForCategory', () => {
  it('should return known brands for a category', () => {
    const library = createEmptyLibrary();
    const brands = getBrandsForCategory(library, 'cpu');

    expect(brands).toContain('Intel');
    expect(brands).toContain('AMD');
  });

  it('should include custom brands from library components', () => {
    const library = createSeededLibrary();
    const brands = getBrandsForCategory(library, 'gpu');

    // Known brands
    expect(brands).toContain('NVIDIA');
    expect(brands).toContain('AMD');
    expect(brands).toContain('Intel');
    // Custom brand from seeded library
    expect(brands).toContain('CustomBrand');
  });

  it('should return sorted brands', () => {
    const library = createSeededLibrary();
    const brands = getBrandsForCategory(library, 'gpu');
    const sorted = [...brands].sort();

    expect(brands).toEqual(sorted);
  });

  it('should not include duplicate brands', () => {
    const library = createSeededLibrary();
    const brands = getBrandsForCategory(library, 'gpu');
    const unique = [...new Set(brands)];

    expect(brands).toEqual(unique);
  });

  it('should return all known brands from CATEGORY_BRANDS for ram', () => {
    const library = createEmptyLibrary();
    const brands = getBrandsForCategory(library, 'ram');
    const knownBrands = CATEGORY_BRANDS['ram'];

    for (const brand of knownBrands) {
      expect(brands).toContain(brand);
    }
  });
});

// ---------------------------------------------------------------------------
// getComponents
// ---------------------------------------------------------------------------
describe('getComponents', () => {
  let library: ComponentLibrary;

  beforeEach(() => {
    library = createSeededLibrary();
  });

  it('should filter by category', () => {
    const cpuComponents = getComponents(library, 'cpu');

    expect(cpuComponents).toHaveLength(2);
    cpuComponents.forEach((c) => {
      expect(c.category).toBe('cpu');
    });
  });

  it('should filter by category and brand', () => {
    const nvidiaGpus = getComponents(library, 'gpu', 'NVIDIA');

    expect(nvidiaGpus).toHaveLength(1);
    expect(nvidiaGpus[0].brand).toBe('NVIDIA');
    expect(nvidiaGpus[0].id).toBe('gpu-1');
  });

  it('should filter by category, brand, and model line', () => {
    const coreI7Cpus = getComponents(library, 'cpu', 'Intel', 'Core i7');

    expect(coreI7Cpus).toHaveLength(1);
    expect(coreI7Cpus[0].brand).toBe('Intel');
    expect(coreI7Cpus[0].modelLine).toBe('Core i7');
    expect(coreI7Cpus[0].id).toBe('cpu-1');
  });

  it('should return empty array when no matches exist', () => {
    const result = getComponents(library, 'psu');

    expect(result).toEqual([]);
  });

  it('should return all gpu components when only category is specified', () => {
    const allGpus = getComponents(library, 'gpu');

    // gpu-1, gpu-2, and custom-1 are all gpu category
    expect(allGpus).toHaveLength(3);
  });

  it('should return empty array for brand with no components in category', () => {
    const result = getComponents(library, 'cpu', 'Corsair');

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getComponentOptions
// ---------------------------------------------------------------------------
describe('getComponentOptions', () => {
  let library: ComponentLibrary;

  beforeEach(() => {
    library = createSeededLibrary();
  });

  it('should return sorted full names for a category', () => {
    const cpuOptions = getComponentOptions(library, 'cpu');

    expect(cpuOptions).toHaveLength(2);
    const sorted = [...cpuOptions].sort();
    expect(cpuOptions).toEqual(sorted);
  });

  it('should return full names for gpu category including custom', () => {
    const gpuOptions = getComponentOptions(library, 'gpu');

    expect(gpuOptions).toHaveLength(3);
    expect(gpuOptions).toContain('NVIDIA GeForce RTX 4070');
    expect(gpuOptions).toContain('AMD Radeon RX 7900 XTX');
    expect(gpuOptions).toContain('CustomBrand SuperCard 9000');
  });

  it('should return empty array for category with no components', () => {
    const result = getComponentOptions(library, 'psu');

    expect(result).toEqual([]);
  });

  it('should return strings only', () => {
    const options = getComponentOptions(library, 'ram');

    options.forEach((opt) => {
      expect(typeof opt).toBe('string');
    });
  });
});
