/**
 * Header - Application header with title and controls
 */

import { useRef, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '../../stores';
import { GoogleSheetsImport } from '../GoogleSheetsImport';
import type { PrebuildConfig } from '../../types';
import { parseCSV, parseSheetData } from '../../utils/googleSheets';
import { SHORTCUT_LABELS } from '../../hooks/useKeyboardShortcuts';
import { env } from '../../config/env';

export function Header() {
  const { config, setConfig, resetConfig, undo, redo, canUndo, canRedo } = useConfigStore(
    useShallow((state) => ({
      config: state.config,
      setConfig: state.setConfig,
      resetConfig: state.resetConfig,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
    }))
  );
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Handle Google Sheets import
  const handleSheetsImport = useCallback(
    (builds: Partial<PrebuildConfig>[]) => {
      if (builds.length === 0) return;

      // Load first build into current config
      const firstBuild = builds[0];
      setConfig({
        modelName: firstBuild.modelName || config.modelName,
        price: firstBuild.price || config.price,
        sku: firstBuild.sku || config.sku,
        os: firstBuild.os || config.os,
        warranty: firstBuild.warranty || config.warranty,
        wifi: firstBuild.wifi || config.wifi,
        buildTier: firstBuild.buildTier || config.buildTier,
        description: firstBuild.description || config.description,
        condition: (firstBuild.condition as typeof config.condition) || config.condition,
        stockStatus: (firstBuild.stockStatus as typeof config.stockStatus) || config.stockStatus,
        stockQuantity: firstBuild.stockQuantity || config.stockQuantity,
        components: {
          ...config.components,
          ...firstBuild.components,
        },
      });

      if (builds.length > 1) {
        alert(
          `Imported ${builds.length} builds. First build loaded. Save as presets to keep the others.`
        );
      }
    },
    [config, setConfig]
  );

  // Handle CSV import — uses the proper CSV parser that handles quoted fields
  const handleCSVImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSV(text);

          if (rows.length < 2) {
            alert('CSV must have a header row and at least one data row');
            return;
          }

          const builds = parseSheetData(rows);

          if (builds.length === 0) {
            alert('No valid builds found in CSV');
            return;
          }

          // Load first build into current config
          setConfig({
            ...builds[0],
            components: { ...config.components, ...builds[0].components },
          });

          alert(
            `Imported ${builds.length} build(s). First build loaded. Save as presets to keep others.`
          );
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
    },
    [config, setConfig]
  );

  const handleClearAll = useCallback(() => {
    if (confirm('Clear all fields?')) {
      resetConfig();
    }
  }, [resetConfig]);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{env.appName}</h1>
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title={`Redo (${SHORTCUT_LABELS.redo})`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                  />
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
            <GoogleSheetsImport onImport={handleSheetsImport} currentBuilds={[config]} />
            <button
              onClick={() => csvInputRef.current?.click()}
              className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors flex items-center gap-1"
              title="Import builds from CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
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
  );
}
