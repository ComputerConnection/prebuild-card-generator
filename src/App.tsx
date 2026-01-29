import { useState, useRef } from 'react';
import { ComponentSelector } from './components/ComponentSelector';
import { PresetManager } from './components/PresetManager';
import { CardPreview } from './components/CardPreview';
import { PDFExporter } from './components/PDFExporter';
import {
  componentOptions,
  defaultConfig,
  osOptions,
  warrantyOptions,
  wifiOptions,
  buildTierOptions,
  featureOptions,
} from './data/componentOptions';
import {
  PrebuildConfig,
  CardSize,
  ComponentCategory,
  COMPONENT_LABELS,
  ColorTheme,
  THEME_PRESETS,
} from './types';

const COMPONENT_ORDER: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

const THEME_OPTIONS: { value: ColorTheme; label: string; colors: { primary: string; accent: string } }[] = [
  { value: 'minimal', label: 'Minimal', colors: THEME_PRESETS.minimal },
  { value: 'gaming', label: 'Gaming', colors: THEME_PRESETS.gaming },
  { value: 'workstation', label: 'Workstation', colors: THEME_PRESETS.workstation },
  { value: 'budget', label: 'Budget', colors: THEME_PRESETS.budget },
  { value: 'custom', label: 'Custom', colors: { primary: '#6366f1', accent: '#1e1b4b' } },
];

function App() {
  const [config, setConfig] = useState<PrebuildConfig>({ ...defaultConfig });
  const [cardSize, setCardSize] = useState<CardSize>('price');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setConfig({ ...defaultConfig });
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
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Clear All
            </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={config.storeName}
                    onChange={(e) =>
                      setConfig((prev) => ({ ...prev, storeName: e.target.value }))
                    }
                    placeholder="Your Store Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
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

            {/* Component Selection */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Components</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                {COMPONENT_ORDER.map((category) => (
                  <ComponentSelector
                    key={category}
                    label={COMPONENT_LABELS[category]}
                    value={config.components[category]}
                    options={componentOptions[category]}
                    onChange={(value) => handleComponentChange(category, value)}
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
            <PresetManager currentConfig={config} onLoadPreset={handleLoadPreset} />
            <CardPreview config={config} cardSize={cardSize} />
            <PDFExporter
              config={config}
              cardSize={cardSize}
              onCardSizeChange={setCardSize}
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
