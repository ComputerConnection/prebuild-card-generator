import { useState, useRef, useEffect, useCallback } from 'react';
import { PresetManager } from './components/PresetManager';
import { CardPreview } from './components/CardPreview';
import { PDFExporter } from './components/PDFExporter';
import { BrandIconManager } from './components/BrandIconManager';
import { EnhancedComponentSelector } from './components/EnhancedComponentSelector';
import { VisualSettingsComponent } from './components/VisualSettings';
import { GoogleSheetsImport } from './components/GoogleSheetsImport';
import {
  componentOptions,
  defaultConfig,
  osOptions,
  warrantyOptions,
  wifiOptions,
  buildTierOptions,
  featureOptions,
  saleBadgeOptions,
  financingTermOptions,
  defaultComponentPrices,
} from './data/componentOptions';
import {
  ComponentLibrary,
  loadComponentLibrary,
  saveComponentLibrary,
  createInitialLibrary,
  addComponent,
  exportLibrary,
  importLibrary,
} from './utils/componentLibrary';
import {
  PrebuildConfig,
  CardSize,
  ComponentCategory,
  ColorTheme,
  THEME_PRESETS,
  BrandIcon,
  StockStatus,
  STOCK_STATUS_CONFIG,
  StoreProfile,
  calculateMonthlyPayment,
  calculateComponentTotal,
  calculateDiscountPercent,
  Preset,
  VisualSettings,
  ConditionType,
  CONDITION_CONFIG,
} from './types';
import { useKeyboardShortcuts, SHORTCUT_LABELS } from './hooks/useKeyboardShortcuts';
import { useHistory } from './hooks/useHistory';

const COMPONENT_ORDER: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

const THEME_OPTIONS: { value: ColorTheme; label: string; colors: { primary: string; accent: string } }[] = [
  { value: 'minimal', label: 'Minimal', colors: THEME_PRESETS.minimal },
  { value: 'gaming', label: 'Gaming', colors: THEME_PRESETS.gaming },
  { value: 'workstation', label: 'Workstation', colors: THEME_PRESETS.workstation },
  { value: 'budget', label: 'Budget', colors: THEME_PRESETS.budget },
  { value: 'custom', label: 'Custom', colors: { primary: '#6366f1', accent: '#1e1b4b' } },
];

const BRAND_ICONS_STORAGE_KEY = 'prebuild-card-brand-icons';
const STORE_PROFILES_STORAGE_KEY = 'prebuild-card-store-profiles';

function App() {
  // Use history hook for undo/redo
  const {
    state: config,
    setState: setConfig,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetConfig,
  } = useHistory<PrebuildConfig>({ ...defaultConfig });

  const [cardSize, setCardSize] = useState<CardSize>('price');
  const [brandIcons, setBrandIcons] = useState<BrandIcon[]>([]);
  const [storeProfiles, setStoreProfiles] = useState<StoreProfile[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [componentLibrary, setComponentLibrary] = useState<ComponentLibrary>(() => {
    const stored = loadComponentLibrary();
    return stored || createInitialLibrary(componentOptions);
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const libraryImportRef = useRef<HTMLInputElement>(null);
  const pdfExporterRef = useRef<{ handleExport: () => void } | null>(null);

  // Load brand icons from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(BRAND_ICONS_STORAGE_KEY);
    if (stored) {
      try {
        setBrandIcons(JSON.parse(stored));
      } catch {
        console.error('Failed to load brand icons');
      }
    }
  }, []);

  // Save brand icons to localStorage when changed
  const handleBrandIconsUpdate = (icons: BrandIcon[]) => {
    setBrandIcons(icons);
    localStorage.setItem(BRAND_ICONS_STORAGE_KEY, JSON.stringify(icons));
  };

  // Load store profiles from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORE_PROFILES_STORAGE_KEY);
    if (stored) {
      try {
        setStoreProfiles(JSON.parse(stored));
      } catch {
        console.error('Failed to load store profiles');
      }
    }
  }, []);

  // Save component library when it changes
  useEffect(() => {
    saveComponentLibrary(componentLibrary);
  }, [componentLibrary]);

  // Keyboard shortcut handlers
  const handleKeyboardSave = useCallback(() => {
    // Focus on the save preset area - scroll to preset manager
    const presetSection = document.querySelector('[data-preset-manager]');
    presetSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleKeyboardPrint = useCallback(() => {
    pdfExporterRef.current?.handleExport();
  }, []);

  const handleKeyboardNew = useCallback(() => {
    if (confirm('Clear all fields and start fresh?')) {
      resetConfig({ ...defaultConfig });
    }
  }, [resetConfig]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onSave: handleKeyboardSave,
    onPrint: handleKeyboardPrint,
    onNew: handleKeyboardNew,
    onUndo: undo,
    onRedo: redo,
  });

  // Handle print queue from preset manager
  const handlePrintQueue = useCallback((presets: Preset[]) => {
    alert(`Print queue with ${presets.length} presets. This would batch generate PDFs for: ${presets.map(p => p.name).join(', ')}`);
    // TODO: Implement actual batch PDF generation
  }, []);

  // Handle Google Sheets import
  const handleSheetsImport = useCallback((builds: Partial<PrebuildConfig>[]) => {
    if (builds.length === 0) return;

    // Load first build into current config
    const firstBuild = builds[0];
    setConfig(prev => ({
      ...prev,
      modelName: firstBuild.modelName || prev.modelName,
      price: firstBuild.price || prev.price,
      sku: firstBuild.sku || prev.sku,
      os: firstBuild.os || prev.os,
      warranty: firstBuild.warranty || prev.warranty,
      wifi: firstBuild.wifi || prev.wifi,
      buildTier: firstBuild.buildTier || prev.buildTier,
      description: firstBuild.description || prev.description,
      condition: (firstBuild.condition as typeof prev.condition) || prev.condition,
      stockStatus: (firstBuild.stockStatus as typeof prev.stockStatus) || prev.stockStatus,
      stockQuantity: firstBuild.stockQuantity || prev.stockQuantity,
      components: {
        ...prev.components,
        ...firstBuild.components,
      },
    }));

    if (builds.length > 1) {
      alert(`Imported ${builds.length} builds. First build loaded. Save as presets to keep the others.`);
    }
  }, [setConfig]);

  // Handle visual settings change
  const handleVisualSettingsChange = useCallback((settings: VisualSettings) => {
    setConfig(prev => ({ ...prev, visualSettings: settings }));
  }, [setConfig]);

  // Handle component price change
  const handleComponentPriceChange = (category: ComponentCategory, value: string) => {
    setConfig((prev) => ({
      ...prev,
      componentPrices: {
        ...prev.componentPrices,
        [category]: value,
      },
    }));
  };

  // Handle store profile save
  const handleSaveStoreProfile = () => {
    if (!config.storeName.trim()) {
      alert('Please enter a store name first');
      return;
    }
    const newProfile: StoreProfile = {
      id: Date.now().toString(),
      name: config.storeName,
      logo: config.storeLogo,
      defaultTheme: config.colorTheme,
    };
    const updated = [...storeProfiles, newProfile];
    setStoreProfiles(updated);
    localStorage.setItem(STORE_PROFILES_STORAGE_KEY, JSON.stringify(updated));
    setActiveStoreId(newProfile.id);
  };

  // Handle store profile load
  const handleLoadStoreProfile = (profileId: string) => {
    const profile = storeProfiles.find((p) => p.id === profileId);
    if (profile) {
      setConfig((prev) => ({
        ...prev,
        storeName: profile.name,
        storeLogo: profile.logo,
        colorTheme: profile.defaultTheme,
        customColors: profile.defaultTheme === 'custom' ? prev.customColors : THEME_PRESETS[profile.defaultTheme],
      }));
      setActiveStoreId(profileId);
    }
  };

  // Handle store profile delete
  const handleDeleteStoreProfile = (profileId: string) => {
    const updated = storeProfiles.filter((p) => p.id !== profileId);
    setStoreProfiles(updated);
    localStorage.setItem(STORE_PROFILES_STORAGE_KEY, JSON.stringify(updated));
    if (activeStoreId === profileId) {
      setActiveStoreId(null);
    }
  };

  // Handle adding new component to library
  const handleAddComponent = (category: ComponentCategory, brand: string, modelLine: string, model: string) => {
    setComponentLibrary(prev => addComponent(prev, category, brand, modelLine, model));
  };

  // Handle export component library
  const handleExportLibrary = () => {
    const json = exportLibrary(componentLibrary);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-library.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle import component library
  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle CSV import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        if (lines.length < 2) {
          alert('CSV must have a header row and at least one data row');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const builds: Partial<PrebuildConfig>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const build: Partial<PrebuildConfig> = {
            components: { ...defaultConfig.components },
            componentPrices: { ...defaultComponentPrices },
          };

          headers.forEach((header, idx) => {
            const value = values[idx] || '';
            switch (header) {
              case 'model':
              case 'modelname':
              case 'name':
                build.modelName = value;
                break;
              case 'price':
                build.price = value;
                break;
              case 'sku':
                build.sku = value;
                break;
              case 'cpu':
              case 'gpu':
              case 'ram':
              case 'storage':
              case 'motherboard':
              case 'psu':
              case 'case':
              case 'cooling':
                if (build.components) build.components[header as ComponentCategory] = value;
                break;
              case 'os':
                build.os = value;
                break;
              case 'warranty':
                build.warranty = value;
                break;
              case 'tier':
              case 'buildtier':
                build.buildTier = value;
                break;
            }
          });

          if (build.modelName || build.price) {
            builds.push(build);
          }
        }

        if (builds.length === 0) {
          alert('No valid builds found in CSV');
          return;
        }

        // Load first build into current config
        setConfig((prev) => ({
          ...prev,
          ...builds[0],
          components: { ...prev.components, ...builds[0].components },
        }));

        alert(`Imported ${builds.length} build(s). First build loaded. Save as presets to keep others.`);
      } catch (err) {
        console.error('CSV import error:', err);
        alert('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const handleComponentChange = (category: ComponentCategory, value: string) => {
    setConfig((prev) => ({
      ...prev,
      components: {
        ...prev.components,
        [category]: value,
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig((prev) => ({
          ...prev,
          storeLogo: event.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setConfig((prev) => ({
      ...prev,
      storeLogo: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadPreset = (presetConfig: PrebuildConfig) => {
    setConfig(presetConfig);
  };

  const handleClearAll = () => {
    if (confirm('Clear all fields?')) {
      resetConfig({ ...defaultConfig });
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setConfig((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleThemeChange = (theme: ColorTheme) => {
    setConfig((prev) => ({
      ...prev,
      colorTheme: theme,
      customColors: theme === 'custom' ? prev.customColors : THEME_PRESETS[theme],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              PC Prebuild Spec Card Generator
            </h1>
            <div className="flex items-center gap-2">
              {/* Undo/Redo buttons */}
              <div className="flex items-center border-r pr-2 mr-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title={`Undo (${SHORTCUT_LABELS.undo})`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title={`Redo (${SHORTCUT_LABELS.redo})`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
              />
              <GoogleSheetsImport
                onImport={handleSheetsImport}
                currentBuilds={[config]}
              />
              <button
                onClick={() => csvInputRef.current?.click()}
                className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors flex items-center gap-1"
                title="Import builds from CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                CSV
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                title={`Clear all (${SHORTCUT_LABELS.new})`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Branding */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Store Branding</h2>

              {/* Store Profiles */}
              {storeProfiles.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saved Store Profiles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {storeProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md border-2 ${
                          activeStoreId === profile.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <button
                          onClick={() => handleLoadStoreProfile(profile.id)}
                          className="text-sm font-medium"
                        >
                          {profile.name}
                        </button>
                        <button
                          onClick={() => handleDeleteStoreProfile(profile.id)}
                          className="text-gray-400 hover:text-red-500 ml-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.storeName}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, storeName: e.target.value }))
                      }
                      placeholder="Your Store Name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSaveStoreProfile}
                      className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                      title="Save as store profile"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Logo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {config.storeLogo ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={config.storeLogo}
                          alt="Store logo"
                          className="h-10 w-auto object-contain"
                        />
                        <button
                          onClick={handleRemoveLogo}
                          className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
                      >
                        Upload Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Theme */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Color Theme</h2>
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleThemeChange(theme.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-colors ${
                      config.colorTheme === theme.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium">{theme.label}</span>
                  </button>
                ))}
              </div>

              {/* Custom color pickers */}
              {config.colorTheme === 'custom' && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary
                    </label>
                    <input
                      type="color"
                      value={config.customColors.primary}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customColors: { ...prev.customColors, primary: e.target.value },
                        }))
                      }
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Accent
                    </label>
                    <input
                      type="color"
                      value={config.customColors.accent}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customColors: { ...prev.customColors, accent: e.target.value },
                        }))
                      }
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Color
                    </label>
                    <input
                      type="color"
                      value={config.customColors.priceColor}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          customColors: { ...prev.customColors, priceColor: e.target.value },
                        }))
                      }
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Build Info */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Build Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={config.modelName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, modelName: e.target.value }))
                    }
                    placeholder="e.g., Gaming Pro X"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="text"
                    value={config.price}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, price: e.target.value }))
                    }
                    placeholder="e.g., $1,499"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU / Product Code
                  </label>
                  <input
                    type="text"
                    value={config.sku}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="e.g., PC-GAM-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Build Tier
                  </label>
                  <select
                    value={config.buildTier}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, buildTier: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Build Tier...</option>
                    {buildTierOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pricing & Sales */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Pricing & Sales</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Sale Toggle */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.saleInfo.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          saleInfo: { ...prev.saleInfo, enabled: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">This item is on sale</span>
                  </label>
                </div>

                {config.saleInfo.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Price
                      </label>
                      <input
                        type="text"
                        value={config.saleInfo.originalPrice}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            saleInfo: { ...prev.saleInfo, originalPrice: e.target.value },
                          }))
                        }
                        placeholder="e.g., $1,799"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {config.saleInfo.originalPrice && config.price && (
                        <p className="text-sm text-green-600 mt-1">
                          {calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% off
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sale Badge Text
                      </label>
                      <select
                        value={config.saleInfo.badgeText}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            saleInfo: { ...prev.saleInfo, badgeText: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {saleBadgeOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Financing Toggle */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={config.financingInfo.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        financingInfo: { ...prev.financingInfo, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Show financing option</span>
                </label>

                {config.financingInfo.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Term (Months)
                      </label>
                      <select
                        value={config.financingInfo.months}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            financingInfo: { ...prev.financingInfo, months: parseInt(e.target.value) },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {financingTermOptions.map((term) => (
                          <option key={term} value={term}>{term} months</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        APR %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.1"
                        value={config.financingInfo.apr}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            financingInfo: { ...prev.financingInfo, apr: parseFloat(e.target.value) || 0 },
                          }))
                        }
                        placeholder="0 for 0% APR"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Payment
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-800 font-medium">
                        ${calculateMonthlyPayment(config.price, config.financingInfo.months, config.financingInfo.apr) || '0.00'}/mo
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Status */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Inventory Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    value={config.condition}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, condition: e.target.value as ConditionType }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Not specified</option>
                    <option value="new">Brand New</option>
                    <option value="certified_preowned">Certified Pre-Owned</option>
                    <option value="open_box">Open Box</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="preowned">Pre-Owned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Status
                  </label>
                  <select
                    value={config.stockStatus}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, stockStatus: e.target.value as StockStatus }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">No status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="on_order">On Order</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity (optional)
                  </label>
                  <input
                    type="text"
                    value={config.stockQuantity}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, stockQuantity: e.target.value }))
                    }
                    placeholder="e.g., 5 units"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* Status badges preview */}
              {(config.condition || config.stockStatus) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.condition && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: CONDITION_CONFIG[config.condition].bgColor,
                        color: CONDITION_CONFIG[config.condition].color,
                      }}
                    >
                      {CONDITION_CONFIG[config.condition].label}
                    </span>
                  )}
                  {config.stockStatus && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: STOCK_STATUS_CONFIG[config.stockStatus].bgColor,
                        color: STOCK_STATUS_CONFIG[config.stockStatus].color,
                      }}
                    >
                      {STOCK_STATUS_CONFIG[config.stockStatus].label}
                      {config.stockQuantity && ` - ${config.stockQuantity}`}
                    </span>
                  )}
                </div>
              )}
              {config.condition && (
                <p className="mt-2 text-xs text-gray-500">
                  {CONDITION_CONFIG[config.condition].description}
                </p>
              )}
            </div>

            {/* Component Selection */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Components</h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={config.showComponentPrices}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showComponentPrices: e.target.checked }))
                      }
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
                    onChange={(value) => handleComponentChange(category, value)}
                    onAddNew={handleAddComponent}
                    showPrice={config.showComponentPrices}
                    priceValue={config.componentPrices[category]}
                    onPriceChange={(value) => handleComponentPriceChange(category, value)}
                  />
                ))}
              </div>
            </div>

            {/* Additional Details (Poster fields) */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Additional Details</h2>
              <p className="text-sm text-gray-500 mb-3">
                These fields appear on Price Cards and Posters
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operating System
                  </label>
                  <select
                    value={config.os}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, os: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select OS...</option>
                    {osOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty
                  </label>
                  <select
                    value={config.warranty}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, warranty: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Warranty...</option>
                    {warrantyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connectivity
                  </label>
                  <select
                    value={config.wifi}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, wifi: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select Connectivity...</option>
                    {wifiOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Poster only)
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description or selling points..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Feature Badges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feature Badges (Poster only)
                </label>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => handleFeatureToggle(feature)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        config.features.includes(feature)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
                {config.features.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {config.features.length} selected (up to 6 shown on poster)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview & Export */}
          <div className="space-y-6">
            <PresetManager
              currentConfig={config}
              onLoadPreset={handleLoadPreset}
              onPrintQueue={handlePrintQueue}
            />
            <VisualSettingsComponent
              settings={config.visualSettings}
              sku={config.sku}
              onChange={handleVisualSettingsChange}
            />
            <BrandIconManager brandIcons={brandIcons} onUpdate={handleBrandIconsUpdate} />
            <CardPreview config={config} cardSize={cardSize} brandIcons={brandIcons} />
            <PDFExporter
              config={config}
              cardSize={cardSize}
              onCardSizeChange={setCardSize}
              brandIcons={brandIcons}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            PC Prebuild Spec Card Generator - Print-ready PDF spec cards for prebuilt computers
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
