import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { ComponentCategory, COMPONENT_LABELS, formatPriceForInput, parsePrice } from '../types';
import {
  ComponentLibrary,
  ComponentEntry,
  getBrandsForCategory,
  getModelLinesForBrand,
  getComponents,
  buildFullName,
} from '../utils/componentLibrary';

interface EnhancedComponentSelectorProps {
  category: ComponentCategory;
  value: string;
  library: ComponentLibrary;
  onChange: (value: string) => void;
  onAddNew: (category: ComponentCategory, brand: string, modelLine: string, model: string) => void;
  priceValue?: number;
  onPriceChange?: (value: number) => void;
  showPrice?: boolean;
}

const FAVORITES_KEY = 'component-favorites';
const RECENT_KEY = 'component-recent';
const MAX_RECENT = 5;

export const EnhancedComponentSelector = memo(function EnhancedComponentSelector({
  category,
  value,
  library,
  onChange,
  onAddNew,
  priceValue,
  onPriceChange,
  showPrice,
}: EnhancedComponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customModelLine, setCustomModelLine] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [favorites, setFavorites] = useState<Record<string, string[]>>({});
  const [recent, setRecent] = useState<Record<string, string[]>>({});

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load favorites and recent from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));

      const storedRecent = localStorage.getItem(RECENT_KEY);
      if (storedRecent) setRecent(JSON.parse(storedRecent));
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save favorites
  const saveFavorites = (newFavorites: Record<string, string[]>) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  // Save recent
  const saveRecent = (newRecent: Record<string, string[]>) => {
    setRecent(newRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get data
  const brands = getBrandsForCategory(library, category);
  const allComponents = getComponents(library, category);
  const filteredByBrand = selectedBrand
    ? getComponents(library, category, selectedBrand)
    : allComponents;

  // Filter by search
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return filteredByBrand;
    const query = searchQuery.toLowerCase();
    return filteredByBrand.filter(
      (comp) =>
        comp.fullName.toLowerCase().includes(query) ||
        comp.brand?.toLowerCase().includes(query) ||
        comp.model.toLowerCase().includes(query)
    );
  }, [filteredByBrand, searchQuery]);

  // Get favorites and recent for this category
  const categoryFavorites = favorites[category] || [];
  const categoryRecent = recent[category] || [];

  const isFavorite = (name: string) => categoryFavorites.includes(name);

  const toggleFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = { ...favorites };
    if (!newFavorites[category]) newFavorites[category] = [];

    if (isFavorite(name)) {
      newFavorites[category] = newFavorites[category].filter((f) => f !== name);
    } else {
      newFavorites[category] = [...newFavorites[category], name];
    }
    saveFavorites(newFavorites);
  };

  const addToRecent = (name: string) => {
    const newRecent = { ...recent };
    if (!newRecent[category]) newRecent[category] = [];

    // Remove if already exists, then add to front
    newRecent[category] = [name, ...newRecent[category].filter((r) => r !== name)].slice(
      0,
      MAX_RECENT
    );

    saveRecent(newRecent);
  };

  const handleSelect = (name: string) => {
    onChange(name);
    addToRecent(name);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleAddCustom = () => {
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
    addToRecent(fullName);

    setCustomBrand('');
    setCustomModelLine('');
    setCustomModel('');
    setShowAddForm(false);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onChange(val);
    if (!isOpen && val) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Render component item
  const renderItem = (comp: ComponentEntry | { fullName: string; brand?: string }) => {
    const name = comp.fullName;
    const isSelected = value === name;
    const isFav = isFavorite(name);

    return (
      <div
        key={name}
        onClick={() => handleSelect(name)}
        className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 ${
          isSelected ? 'bg-blue-100' : ''
        }`}
      >
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm truncate ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-800'}`}
          >
            {name}
          </p>
        </div>
        <button
          onClick={(e) => toggleFavorite(name, e)}
          className={`ml-2 p-1 rounded hover:bg-gray-200 ${isFav ? 'text-yellow-500' : 'text-gray-300'}`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg
            className="w-4 h-4"
            fill={isFav ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="mb-3 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {COMPONENT_LABELS[category]}
        </label>
        <button
          type="button"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setIsOpen(true);
          }}
          className="w-5 h-5 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-sm font-bold"
          title="Add new component"
        >
          +
        </button>
      </div>

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery || value : value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={`Search or select ${COMPONENT_LABELS[category].toLowerCase()}...`}
          className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden"
          style={{ maxWidth: 'calc(100% - 2rem)' }}
        >
          {/* Add Form */}
          {showAddForm && (
            <div className="p-3 bg-green-50 border-b border-green-200">
              <p className="text-xs font-medium text-green-800 mb-2">
                Add New {COMPONENT_LABELS[category]}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="text"
                  value={customBrand}
                  onChange={(e) => setCustomBrand(e.target.value)}
                  placeholder="Brand"
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  list={`add-brands-${category}`}
                />
                <datalist id={`add-brands-${category}`}>
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                <input
                  type="text"
                  value={customModelLine}
                  onChange={(e) => setCustomModelLine(e.target.value)}
                  placeholder="Series/Line"
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                  list={`add-lines-${category}`}
                />
                <datalist id={`add-lines-${category}`}>
                  {customBrand &&
                    getModelLinesForBrand(library, category, customBrand).map((ml) => (
                      <option key={ml} value={ml} />
                    ))}
                </datalist>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Model *"
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 truncate">
                  {buildFullName(customBrand, customModelLine, customModel) || '(enter model)'}
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
                    onClick={handleAddCustom}
                    disabled={!customModel.trim()}
                    className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Brand filter */}
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Brands ({allComponents.length})</option>
              {brands.map((brand) => {
                const count = getComponents(library, category, brand).length;
                return (
                  <option key={brand} value={brand}>
                    {brand} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Scrollable list */}
          <div className="overflow-y-auto max-h-52">
            {/* Favorites section */}
            {categoryFavorites.length > 0 && !searchQuery && (
              <div>
                <div className="px-3 py-1.5 bg-yellow-50 text-xs font-medium text-yellow-700 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Favorites
                </div>
                {categoryFavorites.map((name) => renderItem({ fullName: name }))}
              </div>
            )}

            {/* Recent section */}
            {categoryRecent.length > 0 && !searchQuery && !selectedBrand && (
              <div>
                <div className="px-3 py-1.5 bg-gray-100 text-xs font-medium text-gray-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recently Used
                </div>
                {categoryRecent
                  .filter((name) => !categoryFavorites.includes(name))
                  .map((name) => renderItem({ fullName: name }))}
              </div>
            )}

            {/* All components */}
            <div>
              {(searchQuery ||
                selectedBrand ||
                (categoryFavorites.length === 0 && categoryRecent.length === 0)) && (
                <div className="px-3 py-1.5 bg-gray-100 text-xs font-medium text-gray-600">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : selectedBrand
                      ? selectedBrand
                      : 'All Components'}
                  <span className="ml-1 text-gray-400">({filteredComponents.length})</span>
                </div>
              )}
              {filteredComponents.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  {searchQuery ? 'No matches found' : 'No components available'}
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="block mx-auto mt-2 text-xs text-green-600 hover:text-green-700"
                  >
                    + Add new component
                  </button>
                </div>
              ) : (
                filteredComponents
                  .filter((comp) => !categoryFavorites.includes(comp.fullName))
                  .map((comp) => renderItem(comp))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Price input */}
      {showPrice && onPriceChange && (
        <div className="relative mt-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input
            type="text"
            value={formatPriceForInput(priceValue ?? 0)}
            onChange={(e) => onPriceChange(parsePrice(e.target.value))}
            placeholder={`${COMPONENT_LABELS[category]} price`}
            className="w-full pl-5 pr-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
});
