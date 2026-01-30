/**
 * ColorThemeSelector - Theme selection and custom color configuration
 */

import { useConfigStore } from '../../stores';
import { ColorTheme, THEME_PRESETS } from '../../types';

const THEME_OPTIONS: { value: ColorTheme; label: string; colors: { primary: string; accent: string } }[] =
  [
    { value: 'minimal', label: 'Minimal', colors: THEME_PRESETS.minimal },
    { value: 'gaming', label: 'Gaming', colors: THEME_PRESETS.gaming },
    { value: 'workstation', label: 'Workstation', colors: THEME_PRESETS.workstation },
    { value: 'budget', label: 'Budget', colors: THEME_PRESETS.budget },
    { value: 'custom', label: 'Custom', colors: { primary: '#6366f1', accent: '#1e1b4b' } },
  ];

export function ColorThemeSelector() {
  const { config, setConfig } = useConfigStore();

  const handleThemeChange = (theme: ColorTheme) => {
    setConfig({
      colorTheme: theme,
      customColors: theme === 'custom' ? config.customColors : THEME_PRESETS[theme],
    });
  };

  return (
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
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.primary }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.accent }} />
            </div>
            <span className="text-sm font-medium">{theme.label}</span>
          </button>
        ))}
      </div>

      {/* Custom color pickers */}
      {config.colorTheme === 'custom' && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary</label>
            <input
              type="color"
              value={config.customColors.primary}
              onChange={(e) =>
                setConfig({
                  customColors: { ...config.customColors, primary: e.target.value },
                })
              }
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accent</label>
            <input
              type="color"
              value={config.customColors.accent}
              onChange={(e) =>
                setConfig({
                  customColors: { ...config.customColors, accent: e.target.value },
                })
              }
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Color</label>
            <input
              type="color"
              value={config.customColors.priceColor}
              onChange={(e) =>
                setConfig({
                  customColors: { ...config.customColors, priceColor: e.target.value },
                })
              }
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
