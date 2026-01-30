/**
 * UI Store - Manages UI state like card size, loading states, and panels
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardSize } from '../types';
import { env } from '../config/env';

interface CollapsiblePanels {
  storeBranding: boolean;
  colorTheme: boolean;
  buildInfo: boolean;
  pricingSales: boolean;
  inventoryStatus: boolean;
  components: boolean;
  additionalDetails: boolean;
}

interface LoadingState {
  pdf: boolean;
  email: boolean;
  import: boolean;
  export: boolean;
}

interface UIState {
  // Card preview
  cardSize: CardSize;
  setCardSize: (size: CardSize) => void;

  // Loading states
  loading: LoadingState;
  setLoading: (key: keyof LoadingState, value: boolean) => void;

  // PDF generation progress
  pdfProgress: number;
  pdfStatus: string;
  setPdfProgress: (progress: number, status?: string) => void;

  // Collapsible panels
  panels: CollapsiblePanels;
  togglePanel: (panel: keyof CollapsiblePanels) => void;
  expandAllPanels: () => void;
  collapseAllPanels: () => void;

  // Modals
  showEmailDialog: boolean;
  showSheetsImport: boolean;
  showBrandManager: boolean;
  showVisualSettings: boolean;
  setShowEmailDialog: (show: boolean) => void;
  setShowSheetsImport: (show: boolean) => void;
  setShowBrandManager: (show: boolean) => void;
  setShowVisualSettings: (show: boolean) => void;

  // Keyboard shortcuts visibility
  showShortcutsHelp: boolean;
  setShowShortcutsHelp: (show: boolean) => void;
}

const defaultPanels: CollapsiblePanels = {
  storeBranding: true,
  colorTheme: true,
  buildInfo: true,
  pricingSales: true,
  inventoryStatus: true,
  components: true,
  additionalDetails: true,
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Card size
      cardSize: env.defaultCardSize,
      setCardSize: (size) => set({ cardSize: size }),

      // Loading states
      loading: {
        pdf: false,
        email: false,
        import: false,
        export: false,
      },
      setLoading: (key, value) =>
        set((state) => ({
          loading: { ...state.loading, [key]: value },
        })),

      // PDF progress
      pdfProgress: 0,
      pdfStatus: '',
      setPdfProgress: (progress, status = '') =>
        set({ pdfProgress: progress, pdfStatus: status }),

      // Collapsible panels
      panels: defaultPanels,
      togglePanel: (panel) =>
        set((state) => ({
          panels: { ...state.panels, [panel]: !state.panels[panel] },
        })),
      expandAllPanels: () => set({ panels: defaultPanels }),
      collapseAllPanels: () =>
        set({
          panels: {
            storeBranding: false,
            colorTheme: false,
            buildInfo: false,
            pricingSales: false,
            inventoryStatus: false,
            components: false,
            additionalDetails: false,
          },
        }),

      // Modals
      showEmailDialog: false,
      showSheetsImport: false,
      showBrandManager: false,
      showVisualSettings: false,
      setShowEmailDialog: (show) => set({ showEmailDialog: show }),
      setShowSheetsImport: (show) => set({ showSheetsImport: show }),
      setShowBrandManager: (show) => set({ showBrandManager: show }),
      setShowVisualSettings: (show) => set({ showVisualSettings: show }),

      // Keyboard shortcuts
      showShortcutsHelp: false,
      setShowShortcutsHelp: (show) => set({ showShortcutsHelp: show }),
    }),
    {
      name: 'prebuild-ui-store',
      partialize: (state) => ({
        cardSize: state.cardSize,
        panels: state.panels,
      }),
    }
  )
);
