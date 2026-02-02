/**
 * ColorThemeSelector - Theme selection and custom color configuration
 * With WCAG 2.1 color contrast validation
 */

import { useId } from 'react';
import { useConfigStore } from '../../stores';
import { ColorTheme, THEME_PRESETS } from '../../types';
import {
  getContrastRatio,
  getContrastLevel,
  formatContrastRatio,
  getAccessibleTextColor,
} from '../../utils/colorContrast';

const THEME_OPTIONS: {
  value: ColorTheme;
  label: string;
  colors: { primary: string; accent: string };
}[] = [
  { value: 'minimal', label: 'Minimal', colors: THEME_PRESETS.minimal },
  { value: 'gaming', label: 'Gaming', colors: THEME_PRESETS.gaming },
  { value: 'workstation', label: 'Workstation', colors: THEME_PRESETS.workstation },
  { value: 'budget', label: 'Budget', colors: THEME_PRESETS.budget },
  { value: 'custom', label: 'Custom', colors: { primary: '#6366f1', accent: '#1e1b4b' } },
];

interface ContrastInfo {
  ratio: number;
  level: 'fail' | 'aa-large' | 'aa' | 'aaa';
  label: string;
  description: string;
}

function ContrastWarning({
  color,
  label,
  backgroundColors,
}: {
  color: string;
  label: string;
  backgroundColors: { name: string; hex: string }[];
}) {
  const warnings: { background: string; info: ContrastInfo }[] = [];

  backgroundColors.forEach(({ name, hex }) => {
    const ratio = getContrastRatio(color, hex);
    const levelInfo = getContrastLevel(ratio);
    if (levelInfo.level === 'fail' || levelInfo.level === 'aa-large') {
      warnings.push({
        background: name,
        info: { ratio, ...levelInfo },
      });
    }
  });

  if (warnings.length === 0) return null;

  return (
    <div className="mt-1 space-y-1" role="alert" aria-live="polite">
      {warnings.map((warning) => (
        <p
          key={warning.background}
          className={`text-xs flex items-center gap-1 ${
            warning.info.level === 'fail' ? 'text-red-600' : 'text-amber-600'
          }`}
        >
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {label} on {warning.background}: {formatContrastRatio(warning.info.ratio)} (
            {warning.info.label})
          </span>
        </p>
      ))}
    </div>
  );
}

function ContrastBadge({ ratio }: { ratio: number }) {
  const { level, label } = getContrastLevel(ratio);
  const colors = {
    aaa: 'bg-green-100 text-green-800',
    aa: 'bg-blue-100 text-blue-800',
    'aa-large': 'bg-amber-100 text-amber-800',
    fail: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[level]}`}
      title={`Contrast ratio: ${formatContrastRatio(ratio)}`}
    >
      {label}
    </span>
  );
}

export function ColorThemeSelector() {
  const { config, setConfig } = useConfigStore();
  const baseId = useId();

  const handleThemeChange = (theme: ColorTheme) => {
    setConfig({
      colorTheme: theme,
      customColors: theme === 'custom' ? config.customColors : THEME_PRESETS[theme],
    });
  };

  // Check contrast ratios for custom colors
  const checkContrast = (color: string, background: string) => {
    return getContrastRatio(color, background);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3" id={`${baseId}-heading`}>
        Color Theme
      </h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`${baseId}-heading`}>
        {THEME_OPTIONS.map((theme) => (
          <button
            key={theme.value}
            onClick={() => handleThemeChange(theme.value)}
            role="radio"
            aria-checked={config.colorTheme === theme.value}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-colors ${
              config.colorTheme === theme.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex gap-1" aria-hidden="true">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.primary }} />
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.accent }} />
            </div>
            <span className="text-sm font-medium">{theme.label}</span>
          </button>
        ))}
      </div>

      {/* Custom color pickers */}
      {config.colorTheme === 'custom' && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor={`${baseId}-primary`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Primary
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${baseId}-primary`}
                  type="color"
                  value={config.customColors.primary}
                  onChange={(e) =>
                    setConfig({
                      customColors: { ...config.customColors, primary: e.target.value },
                    })
                  }
                  className="w-full h-10 rounded cursor-pointer"
                  aria-describedby={`${baseId}-primary-contrast`}
                />
              </div>
              <div className="mt-1 flex items-center gap-2" id={`${baseId}-primary-contrast`}>
                <span className="text-xs text-gray-500">vs white:</span>
                <ContrastBadge ratio={checkContrast(config.customColors.primary, '#ffffff')} />
              </div>
              <ContrastWarning
                color={config.customColors.primary}
                label="Primary"
                backgroundColors={[{ name: 'white', hex: '#ffffff' }]}
              />
            </div>
            <div>
              <label
                htmlFor={`${baseId}-accent`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Accent
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${baseId}-accent`}
                  type="color"
                  value={config.customColors.accent}
                  onChange={(e) =>
                    setConfig({
                      customColors: { ...config.customColors, accent: e.target.value },
                    })
                  }
                  className="w-full h-10 rounded cursor-pointer"
                  aria-describedby={`${baseId}-accent-contrast`}
                />
              </div>
              <div className="mt-1 flex items-center gap-2" id={`${baseId}-accent-contrast`}>
                <span className="text-xs text-gray-500">vs white:</span>
                <ContrastBadge ratio={checkContrast(config.customColors.accent, '#ffffff')} />
              </div>
              <ContrastWarning
                color={config.customColors.accent}
                label="Accent"
                backgroundColors={[{ name: 'white', hex: '#ffffff' }]}
              />
            </div>
            <div>
              <label
                htmlFor={`${baseId}-price`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`${baseId}-price`}
                  type="color"
                  value={config.customColors.priceColor}
                  onChange={(e) =>
                    setConfig({
                      customColors: { ...config.customColors, priceColor: e.target.value },
                    })
                  }
                  className="w-full h-10 rounded cursor-pointer"
                  aria-describedby={`${baseId}-price-contrast`}
                />
              </div>
              <div className="mt-1 flex items-center gap-2" id={`${baseId}-price-contrast`}>
                <span className="text-xs text-gray-500">vs white:</span>
                <ContrastBadge ratio={checkContrast(config.customColors.priceColor, '#ffffff')} />
              </div>
              <ContrastWarning
                color={config.customColors.priceColor}
                label="Price"
                backgroundColors={[{ name: 'white', hex: '#ffffff' }]}
              />
            </div>
          </div>

          {/* Color preview */}
          <div className="p-3 rounded-md border border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="flex items-center gap-4">
              <div
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: config.customColors.primary,
                  color: getAccessibleTextColor(config.customColors.primary),
                }}
              >
                Primary Badge
              </div>
              <div
                className="px-3 py-1 rounded text-sm font-medium"
                style={{
                  backgroundColor: config.customColors.accent,
                  color: getAccessibleTextColor(config.customColors.accent),
                }}
              >
                Accent Text
              </div>
              <span className="text-lg font-bold" style={{ color: config.customColors.priceColor }}>
                $1,299
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
