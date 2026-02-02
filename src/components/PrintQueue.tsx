/**
 * Print Queue Component - Manages batch printing of presets
 * With improved accessibility
 */

import { useState, useId, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePrintQueueStore, useBrandIconsStore } from '../stores';
import { CardSize, CARD_SIZES, formatPrice } from '../types';

export const PrintQueue = memo(function PrintQueue() {
  // Use shallow selectors to prevent unnecessary re-renders
  const {
    queue,
    isProcessing,
    progress,
    error,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    processQueue,
    cancelProcessing,
    clearError,
  } = usePrintQueueStore(
    useShallow((state) => ({
      queue: state.queue,
      isProcessing: state.isProcessing,
      progress: state.progress,
      error: state.error,
      removeFromQueue: state.removeFromQueue,
      clearQueue: state.clearQueue,
      reorderQueue: state.reorderQueue,
      processQueue: state.processQueue,
      cancelProcessing: state.cancelProcessing,
      clearError: state.clearError,
    }))
  );

  const brandIcons = useBrandIconsStore((state) => state.icons);
  const baseId = useId();

  const [cardSize, setCardSize] = useState<CardSize>('price');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderQueue(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleProcess = async () => {
    await processQueue(cardSize, brandIcons);
  };

  if (queue.length === 0 && !isProcessing) {
    return null;
  }

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4"
      role="region"
      aria-labelledby={`${baseId}-heading`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2
          id={`${baseId}-heading`}
          className="text-lg font-semibold text-gray-800 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print Queue ({queue.length})
        </h2>
        {queue.length > 0 && !isProcessing && (
          <button
            onClick={clearQueue}
            className="text-xs text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded px-1"
            aria-label="Clear all items from print queue"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div
          className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-center justify-between"
          role="alert"
        >
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
            aria-label="Dismiss error"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Processing progress */}
      {isProcessing && progress && (
        <div
          className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-md"
          role="status"
          aria-live="polite"
          aria-label={`Generating PDF ${progress.current} of ${progress.total}: ${progress.currentPresetName}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-700">
              Generating PDFs... ({progress.current}/{progress.total})
            </span>
            <button
              onClick={cancelProcessing}
              className="text-xs text-purple-600 hover:text-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-1"
              aria-label="Cancel PDF generation"
            >
              Cancel
            </button>
          </div>
          <div className="text-xs text-purple-600 mb-2 truncate">{progress.currentPresetName}</div>
          <div
            className="w-full bg-purple-200 rounded-full h-2"
            role="progressbar"
            aria-valuenow={progress.current}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-label="PDF generation progress"
          >
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card size selector */}
      {!isProcessing && queue.length > 0 && (
        <div className="mb-3">
          <label
            htmlFor={`${baseId}-card-size`}
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Card Size
          </label>
          <select
            id={`${baseId}-card-size`}
            value={cardSize}
            onChange={(e) => setCardSize(e.target.value as CardSize)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {Object.entries(CARD_SIZES).map(([key, size]) => (
              <option key={key} value={key}>
                {size.name} ({size.width}×{size.height} {size.unit})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Queue list */}
      {queue.length > 0 && !isProcessing && (
        <ul
          className="space-y-1 mb-3 max-h-48 overflow-y-auto"
          role="list"
          aria-label="Presets in print queue"
        >
          {queue.map((preset, index) => (
            <li
              key={preset.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 p-2 bg-gray-50 rounded-md cursor-move hover:bg-gray-100 transition-colors ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
              aria-label={`${preset.name}${preset.config.price > 0 ? `, ${formatPrice(preset.config.price)}` : ''}. Drag to reorder.`}
            >
              {/* Drag handle */}
              <div className="text-gray-400" aria-hidden="true">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h16M4 16h16"
                  />
                </svg>
              </div>

              {/* Preset info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 truncate">{preset.name}</div>
                {preset.config.price > 0 && (
                  <div className="text-xs text-gray-500">{formatPrice(preset.config.price)}</div>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeFromQueue(preset.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Remove ${preset.name} from queue`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Process button */}
      {queue.length > 0 && !isProcessing && (
        <button
          onClick={handleProcess}
          className="w-full px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          aria-describedby={`${baseId}-download-hint`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download {queue.length} PDF{queue.length > 1 ? 's' : ''}
        </button>
      )}
      <span id={`${baseId}-download-hint`} className="sr-only">
        Downloads will be generated with the selected card size
      </span>
    </div>
  );
});
