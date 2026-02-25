/**
 * Print Queue Store - Manages batch printing of presets
 * Uses lazy loading for PDF generation to reduce initial bundle size
 */

import { create } from 'zustand';
import { Preset, CardSize, BrandIcon, CARD_SIZES } from '../types';

export interface PrintQueueProgress {
  current: number;
  total: number;
  currentPresetName: string;
}

interface PrintQueueState {
  // Queue state
  queue: Preset[];
  isProcessing: boolean;
  progress: PrintQueueProgress | null;
  error: string | null;

  // Actions
  addToQueue: (preset: Preset) => void;
  addMultipleToQueue: (presets: Preset[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  isInQueue: (id: string) => boolean;

  // Processing
  processQueue: (cardSize: CardSize, brandIcons: BrandIcon[]) => Promise<void>;
  cancelProcessing: () => void;
  clearError: () => void;
}

// Internal flag for cancellation
let processingCancelled = false;

// Module cache for lazy-loaded PDF functions
let pdfModule: typeof import('../utils/pdfGenerator') | null = null;

// Lazy load the PDF generator module
const loadPDFModule = async () => {
  if (!pdfModule) {
    pdfModule = await import('../utils/pdfGenerator');
  }
  return pdfModule;
};

export const usePrintQueueStore = create<PrintQueueState>((set, get) => ({
  queue: [],
  isProcessing: false,
  progress: null,
  error: null,

  addToQueue: (preset) => {
    set((state) => {
      // Don't add duplicates
      if (state.queue.some((p) => p.id === preset.id)) {
        return state;
      }
      // Sanitize name at insertion time for fail-fast behavior (strip dangerous chars, keep spaces)
      const sanitized = {
        ...preset,
        name: preset.name.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'preset',
      };
      return { queue: [...state.queue, sanitized] };
    });
  },

  addMultipleToQueue: (presets) => {
    set((state) => {
      const newPresets = presets
        .filter((p) => !state.queue.some((q) => q.id === p.id))
        .map((p) => ({
          ...p,
          name: p.name.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'preset',
        }));
      return { queue: [...state.queue, ...newPresets] };
    });
  },

  removeFromQueue: (id) => {
    set((state) => ({
      queue: state.queue.filter((p) => p.id !== id),
    }));
  },

  clearQueue: () => {
    set({ queue: [], error: null });
  },

  reorderQueue: (fromIndex, toIndex) => {
    set((state) => {
      const newQueue = [...state.queue];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return { queue: newQueue };
    });
  },

  isInQueue: (id) => {
    return get().queue.some((p) => p.id === id);
  },

  processQueue: async (cardSize, brandIcons) => {
    const { queue } = get();
    if (queue.length === 0) return;

    processingCancelled = false;
    set({
      isProcessing: true,
      progress: { current: 0, total: queue.length, currentPresetName: '' },
      error: null,
    });

    try {
      // Lazy load PDF module
      const { generatePDF, downloadPDF } = await loadPDFModule();

      // Process PDFs in batches of 3 to balance speed and browser stability
      const BATCH_SIZE = 3;
      const sizeName = CARD_SIZES[cardSize].name.replace(/\s+/g, '-');

      for (let i = 0; i < queue.length; i += BATCH_SIZE) {
        if (processingCancelled) throw new Error('Cancelled');

        const batch = queue.slice(i, i + BATCH_SIZE);

        // Generate batch in parallel
        const results = await Promise.all(
          batch.map(async (preset) => {
            if (!preset.config) throw new Error(`Invalid config for preset: ${preset.name}`);
            const doc = await generatePDF(preset.config, cardSize, brandIcons);
            return { doc, name: preset.name };
          })
        );

        // Download sequentially to avoid browser blocking
        for (const { doc, name } of results) {
          if (processingCancelled) throw new Error('Cancelled');
          downloadPDF(doc, `${name}-${sizeName}.pdf`);
        }

        set({
          progress: {
            current: Math.min(i + BATCH_SIZE, queue.length),
            total: queue.length,
            currentPresetName: batch[batch.length - 1].name,
          },
        });

        // Brief delay between batches
        if (i + BATCH_SIZE < queue.length) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      // Clear queue after successful processing
      set({ queue: [], isProcessing: false, progress: null });
    } catch (error) {
      if ((error as Error).message === 'Cancelled') {
        set({ isProcessing: false, progress: null });
      } else {
        console.error('Print queue error:', error);
        set({
          isProcessing: false,
          progress: null,
          error: `Failed to generate PDFs: ${(error as Error).message}`,
        });
      }
    }
  },

  cancelProcessing: () => {
    processingCancelled = true;
  },

  clearError: () => {
    set({ error: null });
  },
}));

// ============================================================================
// STANDALONE SELECTORS
// ============================================================================

/** Select the print queue */
export const selectQueue = (state: PrintQueueState) => state.queue;

/** Select queue count */
export const selectQueueCount = (state: PrintQueueState) => state.queue.length;

/** Select whether processing is active */
export const selectIsProcessing = (state: PrintQueueState) => state.isProcessing;

/** Select current progress */
export const selectProgress = (state: PrintQueueState) => state.progress;
