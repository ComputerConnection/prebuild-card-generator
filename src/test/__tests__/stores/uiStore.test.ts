/**
 * Tests for uiStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../../../stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    // Reset the store
    useUIStore.setState({
      cardSize: 'price',
      loading: {
        pdf: false,
        email: false,
        import: false,
        export: false,
      },
      pdfProgress: 0,
      pdfStatus: '',
      panels: {
        storeBranding: true,
        colorTheme: true,
        buildInfo: true,
        pricingSales: true,
        inventoryStatus: true,
        components: true,
        additionalDetails: true,
      },
      showEmailDialog: false,
      showSheetsImport: false,
      showBrandManager: false,
      showVisualSettings: false,
      showShortcutsHelp: false,
    });
  });

  describe('cardSize', () => {
    it('should have default card size', () => {
      expect(useUIStore.getState().cardSize).toBe('price');
    });

    it('should update card size', () => {
      useUIStore.getState().setCardSize('poster');
      expect(useUIStore.getState().cardSize).toBe('poster');
    });
  });

  describe('loading states', () => {
    it('should update loading state', () => {
      useUIStore.getState().setLoading('pdf', true);
      expect(useUIStore.getState().loading.pdf).toBe(true);

      useUIStore.getState().setLoading('pdf', false);
      expect(useUIStore.getState().loading.pdf).toBe(false);
    });

    it('should not affect other loading states', () => {
      useUIStore.getState().setLoading('pdf', true);
      expect(useUIStore.getState().loading.email).toBe(false);
    });
  });

  describe('pdf progress', () => {
    it('should update pdf progress', () => {
      useUIStore.getState().setPdfProgress(50, 'Generating...');
      expect(useUIStore.getState().pdfProgress).toBe(50);
      expect(useUIStore.getState().pdfStatus).toBe('Generating...');
    });

    it('should use empty status if not provided', () => {
      useUIStore.getState().setPdfProgress(100);
      expect(useUIStore.getState().pdfProgress).toBe(100);
      expect(useUIStore.getState().pdfStatus).toBe('');
    });
  });

  describe('panels', () => {
    it('should toggle panel state', () => {
      expect(useUIStore.getState().panels.storeBranding).toBe(true);

      useUIStore.getState().togglePanel('storeBranding');
      expect(useUIStore.getState().panels.storeBranding).toBe(false);

      useUIStore.getState().togglePanel('storeBranding');
      expect(useUIStore.getState().panels.storeBranding).toBe(true);
    });

    it('should collapse all panels', () => {
      useUIStore.getState().collapseAllPanels();
      const { panels } = useUIStore.getState();

      Object.values(panels).forEach((value) => {
        expect(value).toBe(false);
      });
    });

    it('should expand all panels', () => {
      useUIStore.getState().collapseAllPanels();
      useUIStore.getState().expandAllPanels();
      const { panels } = useUIStore.getState();

      Object.values(panels).forEach((value) => {
        expect(value).toBe(true);
      });
    });
  });

  describe('modals', () => {
    it('should toggle email dialog', () => {
      useUIStore.getState().setShowEmailDialog(true);
      expect(useUIStore.getState().showEmailDialog).toBe(true);

      useUIStore.getState().setShowEmailDialog(false);
      expect(useUIStore.getState().showEmailDialog).toBe(false);
    });

    it('should toggle sheets import', () => {
      useUIStore.getState().setShowSheetsImport(true);
      expect(useUIStore.getState().showSheetsImport).toBe(true);
    });

    it('should toggle brand manager', () => {
      useUIStore.getState().setShowBrandManager(true);
      expect(useUIStore.getState().showBrandManager).toBe(true);
    });

    it('should toggle visual settings', () => {
      useUIStore.getState().setShowVisualSettings(true);
      expect(useUIStore.getState().showVisualSettings).toBe(true);
    });

    it('should toggle shortcuts help', () => {
      useUIStore.getState().setShowShortcutsHelp(true);
      expect(useUIStore.getState().showShortcutsHelp).toBe(true);
    });
  });
});
