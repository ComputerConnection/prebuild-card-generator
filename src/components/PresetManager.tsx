import { useState, useEffect } from 'react';
import { Preset, PrebuildConfig } from '../types';

interface PresetManagerProps {
  currentConfig: PrebuildConfig;
  onLoadPreset: (config: PrebuildConfig) => void;
}

const STORAGE_KEY = 'prebuild-card-presets';

export function PresetManager({ currentConfig, onLoadPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch {
        console.error('Failed to load presets');
      }
    }
  }, []);

  const savePresets = (newPresets: Preset[]) => {
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      config: { ...currentConfig },
      createdAt: Date.now(),
    };

    savePresets([...presets, newPreset]);
    setPresetName('');
    setShowSaveInput(false);
  };

  const handleLoadPreset = (preset: Preset) => {
    onLoadPreset(preset.config);
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Delete this preset?')) {
      savePresets(presets.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Presets</h2>

      {/* Save Preset */}
      <div className="mb-4">
        {showSaveInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              autoFocus
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveInput(false);
                setPresetName('');
              }}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Save Current as Preset
          </button>
        )}
      </div>

      {/* Preset List */}
      {presets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No saved presets yet
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <button
                onClick={() => handleLoadPreset(preset)}
                className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleDeletePreset(preset.id)}
                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                title="Delete preset"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
