import { useState, useEffect } from 'react';
import { ComponentCategory, COMPONENT_LABELS } from '../types';
import {
  ComponentLibrary,
  getBrandsForCategory,
  getModelLinesForBrand,
  getComponents,
  parseComponentString,
  buildFullName,
} from '../utils/componentLibrary';

interface HierarchicalComponentSelectorProps {
  category: ComponentCategory;
  value: string;
  library: ComponentLibrary;
  onChange: (value: string) => void;
  onAddNew: (category: ComponentCategory, brand: string, modelLine: string, model: string) => void;
  priceValue?: string;
  onPriceChange?: (value: string) => void;
  showPrice?: boolean;
}

export function HierarchicalComponentSelector({
  category,
  value,
  library,
  onChange,
  onAddNew,
  priceValue,
  onPriceChange,
  showPrice,
}: HierarchicalComponentSelectorProps) {
  const [mode, setMode] = useState<'browse' | 'custom'>('browse');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModelLine, setSelectedModelLine] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customModelLine, setCustomModelLine] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Parse current value to set initial selections (only on mount)
  useEffect(() => {
    if (value) {
      const parsed = parseComponentString(value, category);
      if (parsed.brand) {
        setSelectedBrand(parsed.brand);
        if (parsed.modelLine) {
          setSelectedModelLine(parsed.modelLine);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brands = getBrandsForCategory(library, category);
  const modelLines = selectedBrand ? getModelLinesForBrand(library, category, selectedBrand) : [];
  const components = getComponents(library, category, selectedBrand || undefined, selectedModelLine || undefined);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModelLine('');
    // Don't clear value yet - let user pick model
  };

  const handleModelLineChange = (modelLine: string) => {
    setSelectedModelLine(modelLine);
  };

  const handleModelSelect = (fullName: string) => {
    onChange(fullName);
  };

  const handleCustomSubmit = () => {
    const brand = customBrand.trim();
    const modelLine = customModelLine.trim();
    const model = customModel.trim();

    if (!model) {
      alert('Please enter a model name');
      return;
    }

    const fullName = buildFullName(brand, modelLine, model);
    onAddNew(category, brand, modelLine, model);
    onChange(fullName);

    // Reset form
    setCustomBrand('');
    setCustomModelLine('');
    setCustomModel('');
    setShowAddForm(false);
    setMode('browse');
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {COMPONENT_LABELS[category]}
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode(mode === 'browse' ? 'custom' : 'browse')}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {mode === 'browse' ? 'Type custom' : 'Browse'}
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="ml-2 w-5 h-5 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-sm font-bold"
            title="Add new component"
          >
            +
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showAddForm && (
        <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs font-medium text-green-800 mb-2">Add New {COMPONENT_LABELS[category]}</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              placeholder="Brand"
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              list={`brands-${category}`}
            />
            <datalist id={`brands-${category}`}>
              {brands.map(b => <option key={b} value={b} />)}
            </datalist>
            <input
              type="text"
              value={customModelLine}
              onChange={(e) => setCustomModelLine(e.target.value)}
              placeholder="Model Line"
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              list={`modellines-${category}`}
            />
            <datalist id={`modellines-${category}`}>
              {customBrand && getModelLinesForBrand(library, category, customBrand).map(ml => (
                <option key={ml} value={ml} />
              ))}
            </datalist>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="Model *"
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              Preview: {buildFullName(customBrand, customModelLine, customModel) || '(enter model)'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Add & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'custom' ? (
        /* Direct text input mode */
        <input
          type="text"
          value={value}
          onChange={handleDirectInput}
          placeholder={`Enter ${COMPONENT_LABELS[category].toLowerCase()}...`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        /* Hierarchical browse mode */
        <div className="space-y-1">
          {/* Row 1: Brand and Model Line */}
          <div className="flex gap-2">
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              value={selectedModelLine}
              onChange={(e) => handleModelLineChange(e.target.value)}
              disabled={!selectedBrand || modelLines.length === 0}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">All Models</option>
              {modelLines.map(ml => (
                <option key={ml} value={ml}>{ml}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Component selection */}
          <select
            value={value}
            onChange={(e) => handleModelSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select {COMPONENT_LABELS[category]}...</option>
            {components.map(comp => (
              <option key={comp.id} value={comp.fullName}>{comp.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {/* Current value display if set but not in dropdown */}
      {value && mode === 'browse' && !components.some(c => c.fullName === value) && (
        <p className="text-xs text-amber-600 mt-1">
          Custom: {value}
        </p>
      )}

      {/* Price input */}
      {showPrice && onPriceChange && (
        <input
          type="text"
          value={priceValue || ''}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder={`${COMPONENT_LABELS[category]} price`}
          className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}
    </div>
  );
}
