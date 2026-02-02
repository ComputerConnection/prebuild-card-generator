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
      return { queue: [...state.queue, preset] };
    });
  },

  addMultipleToQueue: (presets) => {
    set((state) => {
      const newPresets = presets.filter(
        (p) => !state.queue.some((q) => q.id === p.id)
      );
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

      // Generate individual PDFs with a delay between downloads
      for (let i = 0; i < queue.length; i++) {
        if (processingCancelled) throw new Error('Cancelled');

        const preset = queue[i];
        set({
          progress: {
            current: i + 1,
            total: queue.length,
            currentPresetName: preset.name,
          },
        });

        const doc = await generatePDF(preset.config, cardSize, brandIcons);
        const safeName = preset.name.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        const sizeName = CARD_SIZES[cardSize].name.replace(/\s+/g, '-');
        const filename = `${safeName}-${sizeName}.pdf`;
        downloadPDF(doc, filename);

        // Delay between downloads to prevent browser blocking
        if (i < queue.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
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
