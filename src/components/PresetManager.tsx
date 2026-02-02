import { useState, useEffect } from 'react';
import { Preset, PrebuildConfig, PresetFolder, DEFAULT_FOLDERS, formatPrice } from '../types';

interface PresetManagerProps {
  currentConfig: PrebuildConfig;
  onLoadPreset: (config: PrebuildConfig) => void;
  onPrintQueue?: (presets: Preset[]) => void;
}

const STORAGE_KEY = 'prebuild-card-presets';
const FOLDERS_STORAGE_KEY = 'prebuild-card-preset-folders';

export function PresetManager({ currentConfig, onLoadPreset, onPrintQueue }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [folders, setFolders] = useState<PresetFolder[]>(DEFAULT_FOLDERS);
  const [presetName, setPresetName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch {
        console.error('Failed to load presets');
      }
    }

    const storedFolders = localStorage.getItem(FOLDERS_STORAGE_KEY);
    if (storedFolders) {
      try {
        setFolders(JSON.parse(storedFolders));
      } catch {
        console.error('Failed to load folders');
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
      folder: selectedFolder || undefined,
    };

    savePresets([...presets, newPreset]);
    setPresetName('');
    setSelectedFolder('');
    setShowSaveInput(false);
  };

  const handleLoadPreset = (preset: Preset) => {
    onLoadPreset(preset.config);
  };

  const handleDuplicatePreset = (preset: Preset) => {
    const newPreset: Preset = {
      id: Date.now().toString(),
      name: `${preset.name} (Copy)`,
      config: { ...preset.config },
      createdAt: Date.now(),
      folder: preset.folder,
    };
    savePresets([...presets, newPreset]);
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('Delete this preset?')) {
      savePresets(presets.filter((p) => p.id !== id));
      setSelectedForPrint((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMoveToFolder = (presetId: string, folderId: string) => {
    savePresets(
      presets.map((p) => (p.id === presetId ? { ...p, folder: folderId || undefined } : p))
    );
  };

  const togglePrintSelection = (id: string) => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrintSelected = () => {
    const selectedPresets = presets.filter((p) => selectedForPrint.has(p.id));
    if (selectedPresets.length > 0 && onPrintQueue) {
      onPrintQueue(selectedPresets);
    }
  };

  // Filter presets by search and folder
  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      !searchQuery ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.config.modelName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preset.config.price > 0 &&
        formatPrice(preset.config.price).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFolder = activeFolder === null || preset.folder === activeFolder;

    return matchesSearch && matchesFolder;
  });

  // Group presets by folder
  const presetsByFolder: Record<string, Preset[]> = {};
  const unfolderedPresets: Preset[] = [];

  filteredPresets.forEach((preset) => {
    if (preset.folder) {
      if (!presetsByFolder[preset.folder]) {
        presetsByFolder[preset.folder] = [];
      }
      presetsByFolder[preset.folder].push(preset);
    } else {
      unfolderedPresets.push(preset);
    }
  });

  const renderPresetItem = (preset: Preset) => (
    <div
      key={preset.id}
      className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors group"
    >
      {/* Print checkbox */}
      <input
        type="checkbox"
        checked={selectedForPrint.has(preset.id)}
        onChange={() => togglePrintSelection(preset.id)}
        className="w-4 h-4 text-blue-600 rounded"
      />

      {/* Preset name */}
      <button
        onClick={() => handleLoadPreset(preset)}
        className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 truncate"
        title={`${preset.name} - ${preset.config.price > 0 ? formatPrice(preset.config.price) : 'No price'}`}
      >
        {preset.name}
        {preset.config.price > 0 && (
          <span className="ml-2 text-xs text-gray-400">{formatPrice(preset.config.price)}</span>
        )}
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Duplicate */}
        <button
          onClick={() => handleDuplicatePreset(preset)}
          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Duplicate"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Move to folder */}
        <select
          value={preset.folder || ''}
          onChange={(e) => handleMoveToFolder(preset.id, e.target.value)}
          className="w-20 text-xs p-1 border border-gray-200 rounded bg-white"
          title="Move to folder"
        >
          <option value="">No folder</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        {/* Delete */}
        <button
          onClick={() => handleDeletePreset(preset.id)}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4" data-preset-manager>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Presets</h2>
        {selectedForPrint.size > 0 && onPrintQueue && (
          <button
            onClick={handlePrintSelected}
            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Print {selectedForPrint.size} selected
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search presets..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Folder filter tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => setActiveFolder(null)}
          className={`px-2 py-1 text-xs rounded-md ${
            activeFolder === null
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All ({presets.length})
        </button>
        {folders.map((folder) => {
          const count = presets.filter((p) => p.folder === folder.id).length;
          return (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`px-2 py-1 text-xs rounded-md ${
                activeFolder === folder.id ? 'text-white' : 'text-gray-600 hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeFolder === folder.id ? folder.color : `${folder.color}20`,
              }}
            >
              {folder.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Save Preset */}
      <div className="mb-4">
        {showSaveInput ? (
          <div className="space-y-2">
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
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="px-2 py-2 text-sm border border-gray-300 rounded-md bg-white"
              >
                <option value="">No folder</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveInput(false);
                  setPresetName('');
                  setSelectedFolder('');
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
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
      {filteredPresets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          {searchQuery ? 'No presets match your search' : 'No saved presets yet'}
        </p>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {/* Show folder sections when not filtering by folder */}
          {activeFolder === null ? (
            <>
              {/* Unfoldered presets first */}
              {unfolderedPresets.length > 0 && (
                <div className="mb-2">{unfolderedPresets.map(renderPresetItem)}</div>
              )}

              {/* Then folder groups */}
              {folders.map((folder) => {
                const folderPresets = presetsByFolder[folder.id];
                if (!folderPresets || folderPresets.length === 0) return null;

                return (
                  <div key={folder.id} className="mb-3">
                    <div
                      className="flex items-center gap-2 px-2 py-1 mb-1 rounded text-sm font-medium"
                      style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </div>
                    <div className="space-y-1 pl-2">{folderPresets.map(renderPresetItem)}</div>
                  </div>
                );
              })}
            </>
          ) : (
            /* When filtering by folder, show flat list */
            filteredPresets.map(renderPresetItem)
          )}
        </div>
      )}
    </div>
  );
}
