/**
 * ComponentsForm - PC component selection with library management
 * Optimized with shallow selectors and memo
 */

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '../../stores';
import { EnhancedComponentSelector } from '../EnhancedComponentSelector';
import { ComponentCategory, calculateComponentTotal } from '../../types';
import {
  ComponentLibrary,
  loadComponentLibrary,
  saveComponentLibrary,
  createInitialLibrary,
  addComponent as addComponentToLibrary,
  exportLibrary,
  importLibrary,
} from '../../utils/componentLibrary';
import { componentOptions } from '../../data/componentOptions';

const COMPONENT_ORDER: ComponentCategory[] = [
  'cpu',
  'gpu',
  'ram',
  'storage',
  'motherboard',
  'psu',
  'case',
  'cooling',
];

export const ComponentsForm = memo(function ComponentsForm() {
  // Use shallow selector to prevent unnecessary re-renders
  const { config, setConfig, setComponent, setComponentPrice } = useConfigStore(
    useShallow((state) => ({
      config: state.config,
      setConfig: state.setConfig,
      setComponent: state.setComponent,
      setComponentPrice: state.setComponentPrice,
    }))
  );
  const libraryImportRef = useRef<HTMLInputElement>(null);

  // Use the legacy component library system for compatibility
  const [componentLibrary, setComponentLibrary] = useState<ComponentLibrary>(() => {
    const stored = loadComponentLibrary();
    return stored || createInitialLibrary(componentOptions);
  });

  // Save library when it changes
  useEffect(() => {
    saveComponentLibrary(componentLibrary);
  }, [componentLibrary]);

  const handleAddComponent = useCallback(
    (category: ComponentCategory, brand: string, modelLine: string, model: string) => {
      setComponentLibrary((prev) => addComponentToLibrary(prev, category, brand, modelLine, model));
    },
    []
  );

  const handleExportLibrary = useCallback(() => {
    const json = exportLibrary(componentLibrary);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-library.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [componentLibrary]);

  const handleImportLibrary = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const imported = importLibrary(json);
      if (imported) {
        setComponentLibrary(imported);
        alert(`Imported ${imported.components.length} components`);
      } else {
        alert('Failed to import library - invalid format');
      }
    };
    reader.readAsText(file);

    if (libraryImportRef.current) {
      libraryImportRef.current.value = '';
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Components</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={config.showComponentPrices}
              onChange={(e) => setConfig({ showComponentPrices: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-gray-600">Show prices</span>
          </label>
          <div className="flex items-center gap-1 border-l pl-3">
            <input
              ref={libraryImportRef}
              type="file"
              accept=".json"
              onChange={handleImportLibrary}
              className="hidden"
            />
            <button
              onClick={() => libraryImportRef.current?.click()}
              className="text-xs text-blue-600 hover:text-blue-700"
              title="Import component library"
            >
              Import
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleExportLibrary}
              className="text-xs text-blue-600 hover:text-blue-700"
              title="Export component library"
            >
              Export
            </button>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Use dropdowns to browse by brand, or click "+" to add new components to your library.
      </p>
      {config.showComponentPrices && (
        <div className="mb-3 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
          Component total: ${calculateComponentTotal(config.componentPrices).toFixed(2)}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        {COMPONENT_ORDER.map((category) => (
          <EnhancedComponentSelector
            key={category}
            category={category}
            value={config.components[category]}
            library={componentLibrary}
            onChange={(value) => setComponent(category, value)}
            onAddNew={handleAddComponent}
            showPrice={config.showComponentPrices}
            priceValue={config.componentPrices[category]}
            onPriceChange={(value) => setComponentPrice(category, value)}
          />
        ))}
      </div>
    </div>
  );
});
