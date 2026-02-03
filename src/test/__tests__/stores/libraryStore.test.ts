/**
 * Tests for src/stores/libraryStore.ts
 * Tests the Zustand store for component library management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useLibraryStore } from '../../../stores/libraryStore';

describe('libraryStore', () => {
  beforeEach(() => {
    // Reset the store to initial state before each test
    useLibraryStore.getState().resetLibrary();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have components from default options', () => {
      const { library } = useLibraryStore.getState();
      expect(library.components.length).toBeGreaterThan(0);
    });

    it('should have version number', () => {
      const { library } = useLibraryStore.getState();
      expect(library.version).toBe(1);
    });

    it('should have default components marked as not custom', () => {
      const { library } = useLibraryStore.getState();
      const defaultComponents = library.components.filter((c) => !c.isCustom);
      expect(defaultComponents.length).toBeGreaterThan(0);
    });
  });

  describe('addComponent', () => {
    it('should add a new custom component', () => {
      const { addComponent, library } = useLibraryStore.getState();
      const initialCount = library.components.length;

      const component = addComponent('cpu', 'Intel Core i9-15900K');

      const { library: updatedLibrary } = useLibraryStore.getState();
      expect(updatedLibrary.components.length).toBe(initialCount + 1);
      expect(component.name).toBe('Intel Core i9-15900K');
      expect(component.category).toBe('cpu');
      expect(component.isCustom).toBe(true);
    });

    it('should auto-detect Intel brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'Intel Core i5-14600K');

      expect(component.brand).toBe('Intel');
    });

    it('should auto-detect AMD brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'AMD Ryzen 7 9700X');

      expect(component.brand).toBe('AMD');
    });

    it('should auto-detect NVIDIA brand from GeForce', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('gpu', 'GeForce RTX 5090');

      expect(component.brand).toBe('NVIDIA');
    });

    it('should auto-detect NVIDIA brand from RTX', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('gpu', 'RTX 4080 Super');

      expect(component.brand).toBe('NVIDIA');
    });

    it('should auto-detect ASUS brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('motherboard', 'ASUS ROG Strix Z890');

      expect(component.brand).toBe('ASUS');
    });

    it('should auto-detect MSI brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('motherboard', 'MSI MEG Z890 Ace');

      expect(component.brand).toBe('MSI');
    });

    it('should auto-detect Corsair brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('ram', 'Corsair Vengeance DDR5-6400');

      expect(component.brand).toBe('Corsair');
    });

    it('should auto-detect Samsung brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('storage', 'Samsung 990 Pro 2TB');

      expect(component.brand).toBe('Samsung');
    });

    it('should auto-detect Western Digital brand from WD', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('storage', 'WD Black SN850X 2TB');

      expect(component.brand).toBe('Western Digital');
    });

    it('should auto-detect G.Skill brand', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('ram', 'G.Skill Trident Z5 RGB');

      expect(component.brand).toBe('G.Skill');
    });

    it('should use provided brand over auto-detection', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('ram', 'Custom DDR5 RAM', 'MyBrand');

      expect(component.brand).toBe('MyBrand');
    });

    it('should leave brand undefined for unrecognized names', () => {
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('ram', 'Generic DDR5 32GB');

      expect(component.brand).toBeUndefined();
    });

    it('should generate unique IDs', () => {
      const { addComponent } = useLibraryStore.getState();
      const c1 = addComponent('cpu', 'Test CPU 1');
      const c2 = addComponent('cpu', 'Test CPU 2');

      expect(c1.id).not.toBe(c2.id);
    });

    it('should set createdAt timestamp', () => {
      const before = Date.now();
      const { addComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'Test CPU');
      const after = Date.now();

      expect(component.createdAt).toBeGreaterThanOrEqual(before);
      expect(component.createdAt).toBeLessThanOrEqual(after);
    });
  });

  describe('removeComponent', () => {
    it('should remove component by ID', () => {
      const { addComponent, removeComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'Test CPU');
      const initialCount = useLibraryStore.getState().library.components.length;

      removeComponent(component.id);

      const { library } = useLibraryStore.getState();
      expect(library.components.length).toBe(initialCount - 1);
      expect(library.components.find((c) => c.id === component.id)).toBeUndefined();
    });

    it('should not affect other components', () => {
      const { addComponent, removeComponent } = useLibraryStore.getState();
      const c1 = addComponent('cpu', 'CPU 1');
      const c2 = addComponent('cpu', 'CPU 2');

      removeComponent(c1.id);

      const { library } = useLibraryStore.getState();
      expect(library.components.find((c) => c.id === c2.id)).toBeDefined();
    });
  });

  describe('updateComponent', () => {
    it('should update component properties', () => {
      const { addComponent, updateComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'Old Name');

      updateComponent(component.id, { name: 'New Name' });

      const { library } = useLibraryStore.getState();
      const updated = library.components.find((c) => c.id === component.id);
      expect(updated?.name).toBe('New Name');
    });

    it('should update brand', () => {
      const { addComponent, updateComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'Test CPU');

      updateComponent(component.id, { brand: 'NewBrand' });

      const { library } = useLibraryStore.getState();
      const updated = library.components.find((c) => c.id === component.id);
      expect(updated?.brand).toBe('NewBrand');
    });

    it('should update category', () => {
      const { addComponent, updateComponent } = useLibraryStore.getState();
      const component = addComponent('cpu', 'Test Component');

      updateComponent(component.id, { category: 'gpu' });

      const { library } = useLibraryStore.getState();
      const updated = library.components.find((c) => c.id === component.id);
      expect(updated?.category).toBe('gpu');
    });
  });

  describe('getComponentsByCategory', () => {
    it('should return components for specified category', () => {
      const { getComponentsByCategory } = useLibraryStore.getState();
      const cpuComponents = getComponentsByCategory('cpu');

      expect(cpuComponents.length).toBeGreaterThan(0);
      cpuComponents.forEach((c) => {
        expect(c.category).toBe('cpu');
      });
    });

    it('should include custom components', () => {
      const { addComponent, getComponentsByCategory } = useLibraryStore.getState();
      const custom = addComponent('gpu', 'Custom GPU');

      const gpuComponents = getComponentsByCategory('gpu');
      expect(gpuComponents.find((c) => c.id === custom.id)).toBeDefined();
    });

    it('should return empty array for category with no components', () => {
      // Reset to empty
      useLibraryStore.setState({
        library: { components: [], version: 1 },
      });

      const { getComponentsByCategory } = useLibraryStore.getState();
      const components = getComponentsByCategory('cpu');

      expect(components).toEqual([]);
    });
  });

  describe('getComponentOptions', () => {
    it('should return component names for category', () => {
      const { getComponentOptions } = useLibraryStore.getState();
      const cpuOptions = getComponentOptions('cpu');

      expect(cpuOptions.length).toBeGreaterThan(0);
      expect(typeof cpuOptions[0]).toBe('string');
    });

    it('should include custom component names', () => {
      const { addComponent, getComponentOptions } = useLibraryStore.getState();
      addComponent('gpu', 'My Custom GPU');

      const gpuOptions = getComponentOptions('gpu');
      expect(gpuOptions).toContain('My Custom GPU');
    });
  });

  describe('searchComponents', () => {
    it('should search by component name', () => {
      const { searchComponents } = useLibraryStore.getState();
      const results = searchComponents('Intel');

      expect(results.length).toBeGreaterThan(0);
      results.forEach((c) => {
        expect(c.name.toLowerCase()).toContain('intel');
      });
    });

    it('should search by brand', () => {
      const { addComponent, searchComponents } = useLibraryStore.getState();
      addComponent('ram', 'Vengeance DDR5', 'Corsair');

      const results = searchComponents('Corsair');
      expect(results.some((c) => c.brand === 'Corsair')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const { searchComponents } = useLibraryStore.getState();
      const upper = searchComponents('INTEL');
      const lower = searchComponents('intel');
      const mixed = searchComponents('InTeL');

      expect(upper.length).toBe(lower.length);
      expect(lower.length).toBe(mixed.length);
    });

    it('should filter by category when provided', () => {
      const { searchComponents } = useLibraryStore.getState();
      const results = searchComponents('Intel', 'cpu');

      results.forEach((c) => {
        expect(c.category).toBe('cpu');
      });
    });

    it('should return empty array for no matches', () => {
      const { searchComponents } = useLibraryStore.getState();
      const results = searchComponents('xyznonexistent123');

      expect(results).toEqual([]);
    });
  });

  describe('exportLibrary', () => {
    it('should export library as JSON string', () => {
      const { exportLibrary, library } = useLibraryStore.getState();
      const json = exportLibrary();

      const parsed = JSON.parse(json);
      expect(parsed.components).toBeDefined();
      expect(parsed.version).toBe(library.version);
    });

    it('should include custom components', () => {
      const { addComponent, exportLibrary } = useLibraryStore.getState();
      addComponent('cpu', 'Export Test CPU');

      const json = exportLibrary();
      expect(json).toContain('Export Test CPU');
    });
  });

  describe('importLibrary', () => {
    it('should import components from JSON', () => {
      const { importLibrary } = useLibraryStore.getState();
      const importData = {
        components: [
          {
            id: 'imp-1',
            category: 'cpu',
            name: 'Imported CPU',
            isCustom: true,
            createdAt: Date.now(),
          },
          {
            id: 'imp-2',
            category: 'gpu',
            name: 'Imported GPU',
            isCustom: true,
            createdAt: Date.now(),
          },
        ],
        version: 1,
      };

      const count = importLibrary(JSON.stringify(importData));

      expect(count).toBe(2);
      const { library } = useLibraryStore.getState();
      expect(library.components.find((c) => c.name === 'Imported CPU')).toBeDefined();
      expect(library.components.find((c) => c.name === 'Imported GPU')).toBeDefined();
    });

    it('should skip duplicate components', () => {
      const { library } = useLibraryStore.getState();
      const existingComponent = library.components[0];

      const importData = {
        components: [
          { ...existingComponent }, // Duplicate
          {
            id: 'new-1',
            category: 'cpu',
            name: 'New Unique CPU',
            isCustom: true,
            createdAt: Date.now(),
          },
        ],
        version: 1,
      };

      const count = useLibraryStore.getState().importLibrary(JSON.stringify(importData));

      expect(count).toBe(1); // Only the new one
    });

    it('should generate new IDs for imported components', () => {
      const { importLibrary } = useLibraryStore.getState();
      const importData = {
        components: [
          {
            id: 'original-id',
            category: 'cpu',
            name: 'Import Test',
            isCustom: true,
            createdAt: Date.now(),
          },
        ],
        version: 1,
      };

      importLibrary(JSON.stringify(importData));

      const { library } = useLibraryStore.getState();
      const imported = library.components.find((c) => c.name === 'Import Test');
      expect(imported?.id).not.toBe('original-id');
    });

    it('should return 0 for invalid JSON', () => {
      const { importLibrary } = useLibraryStore.getState();
      const count = importLibrary('invalid json');

      expect(count).toBe(0);
    });

    it('should return 0 for missing components array', () => {
      const { importLibrary } = useLibraryStore.getState();
      const count = importLibrary(JSON.stringify({ version: 1 }));

      expect(count).toBe(0);
    });

    it('should return 0 for non-array components', () => {
      const { importLibrary } = useLibraryStore.getState();
      const count = importLibrary(JSON.stringify({ components: 'not an array', version: 1 }));

      expect(count).toBe(0);
    });
  });

  describe('resetLibrary', () => {
    it('should reset to default components', () => {
      const { addComponent, resetLibrary, library: _beforeLibrary } = useLibraryStore.getState();

      // Add custom components
      addComponent('cpu', 'Custom CPU 1');
      addComponent('gpu', 'Custom GPU 1');

      resetLibrary();

      const { library: afterLibrary } = useLibraryStore.getState();

      // Should not have custom components
      expect(afterLibrary.components.filter((c) => c.isCustom)).toEqual([]);

      // Should have default components
      expect(afterLibrary.components.length).toBeGreaterThan(0);
    });

    it('should reset version', () => {
      const { resetLibrary } = useLibraryStore.getState();
      resetLibrary();

      const { library } = useLibraryStore.getState();
      expect(library.version).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty search query', () => {
      const { searchComponents, library } = useLibraryStore.getState();
      const results = searchComponents('');

      // Empty search should match all (or based on implementation)
      expect(results.length).toBe(library.components.length);
    });

    it('should handle special characters in component names', () => {
      const { addComponent, searchComponents } = useLibraryStore.getState();
      addComponent('ram', 'G.Skill Trident Z5 (32GB)', 'G.Skill');

      const results = searchComponents('G.Skill');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle very long component names', () => {
      const { addComponent } = useLibraryStore.getState();
      const longName = 'A'.repeat(500);
      const component = addComponent('cpu', longName);

      expect(component.name).toBe(longName);
    });

    it('should handle concurrent operations', () => {
      const { addComponent, removeComponent } = useLibraryStore.getState();

      const _c1 = addComponent('cpu', 'Test 1');
      const c2 = addComponent('cpu', 'Test 2');
      const _c3 = addComponent('cpu', 'Test 3');

      removeComponent(c2.id);
      const _c4 = addComponent('cpu', 'Test 4');

      const { library } = useLibraryStore.getState();
      const names = library.components.map((c) => c.name);

      expect(names).toContain('Test 1');
      expect(names).not.toContain('Test 2');
      expect(names).toContain('Test 3');
      expect(names).toContain('Test 4');
    });
  });
});
