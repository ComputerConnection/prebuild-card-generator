import { useState } from 'react';
import { importFromGoogleSheet, downloadCSV } from '../utils/googleSheets';
import { PrebuildConfig } from '../types';

interface GoogleSheetsImportProps {
  onImport: (builds: Partial<PrebuildConfig>[]) => void;
  currentBuilds?: PrebuildConfig[];
}

export function GoogleSheetsImport({ onImport, currentBuilds }: GoogleSheetsImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const handleImport = async () => {
    if (!sheetUrl.trim()) {
      setError('Please enter a Google Sheet URL');
      return;
    }

    setLoading(true);
    setError('');
    setImportedCount(null);

    const result = await importFromGoogleSheet(sheetUrl);

    setLoading(false);

    if (result.success && result.builds) {
      setImportedCount(result.builds.length);
      onImport(result.builds);
      setTimeout(() => {
        setIsOpen(false);
        setSheetUrl('');
        setImportedCount(null);
      }, 1500);
    } else {
      setError(result.error || 'Import failed');
    }
  };

  const handleExport = () => {
    if (currentBuilds && currentBuilds.length > 0) {
      downloadCSV(currentBuilds);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
        title="Import from Google Sheets"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.5 3H4.5C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zm-7 4h5v2h-5V7zm0 4h5v2h-5v-2zm0 4h5v2h-5v-2zm-6-8h4v6h-4V7zm0 8h4v2h-4v-2z"/>
        </svg>
        Sheets
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Google Sheets Sync</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Import Section */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Import from Google Sheet</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Paste the URL of a public Google Sheet. The sheet must be shared as &quot;Anyone with the link can view&quot;.
                </p>

                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}

                {importedCount !== null && (
                  <p className="mt-2 text-sm text-green-600">
                    Successfully imported {importedCount} build(s)!
                  </p>
                )}

                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Importing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Import Builds
                    </>
                  )}
                </button>
              </div>

              <hr className="border-gray-200" />

              {/* Export Section */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Export to CSV</h4>
                <p className="text-sm text-gray-500 mb-3">
                  Download your presets as a CSV file that can be opened in Google Sheets or Excel.
                </p>

                <button
                  onClick={handleExport}
                  disabled={!currentBuilds || currentBuilds.length === 0}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download CSV ({currentBuilds?.length || 0} builds)
                </button>
              </div>

              <hr className="border-gray-200" />

              {/* Column Format Info */}
              <div className="bg-gray-50 rounded-md p-3">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Expected Column Headers</h4>
                <p className="text-xs text-gray-500 mb-2">
                  Your sheet should have a header row with these column names (case-insensitive):
                </p>
                <div className="flex flex-wrap gap-1">
                  {['Model Name', 'Price', 'SKU', 'CPU', 'GPU', 'RAM', 'Storage', 'Motherboard', 'PSU', 'Case', 'Cooling', 'OS', 'Warranty', 'WiFi', 'Build Tier', 'Condition'].map(col => (
                    <span key={col} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
