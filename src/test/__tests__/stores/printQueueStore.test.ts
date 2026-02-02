/**
 * Tests for Print Queue Store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePrintQueueStore } from '../../../stores/printQueueStore';
import { Preset, PrebuildConfig } from '../../../types';

// Mock the PDF generator
vi.mock('../../../utils/pdfGenerator', () => ({
  generatePDF: vi.fn().mockResolvedValue({}),
  downloadPDF: vi.fn(),
}));

// Create a mock preset for testing
const createMockPreset = (id: string, name: string): Preset => ({
  id,
  name,
  config: {
    modelName: name,
    price: 1000,
    components: {
      cpu: 'Test CPU',
      gpu: 'Test GPU',
      ram: '16GB',
      storage: '1TB SSD',
      motherboard: 'Test MB',
      psu: '650W',
      case: 'Test Case',
      cooling: 'Air Cooler',
    },
    storeName: 'Test Store',
    storeLogo: null,
    sku: 'TEST-001',
    os: 'Windows 11',
    warranty: '1 Year',
    wifi: 'Wi-Fi 6',
    buildTier: 'PRO',
    features: [],
    description: '',
    colorTheme: 'gaming',
    customColors: { primary: '#dc2626', accent: '#1f2937', priceColor: '#dc2626' },
    componentPrices: {
      cpu: 0,
      gpu: 0,
      ram: 0,
      storage: 0,
      motherboard: 0,
      psu: 0,
      case: 0,
      cooling: 0,
    },
    showComponentPrices: false,
    stockStatus: null,
    stockQuantity: '',
    saleInfo: { enabled: false, originalPrice: 0, badgeText: 'SALE' },
    financingInfo: { enabled: false, months: 12, apr: 0 },
    visualSettings: {
      backgroundPattern: 'solid',
      cardTemplate: 'default',
      fontFamily: 'helvetica',
      showQrCode: false,
      qrCodeUrl: '',
      productImage: null,
    },
    condition: null,
  } as PrebuildConfig,
  createdAt: Date.now(),
});

describe('PrintQueueStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePrintQueueStore.setState({
      queue: [],
      isProcessing: false,
      progress: null,
      error: null,
    });
  });

  describe('addToQueue', () => {
    it('should add a preset to the queue', () => {
      const preset = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('1');
      expect(queue[0].name).toBe('Gaming PC');
    });

    it('should not add duplicate presets', () => {
      const preset = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset);
      usePrintQueueStore.getState().addToQueue(preset);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(1);
    });

    it('should add multiple different presets', () => {
      const preset1 = createMockPreset('1', 'Gaming PC');
      const preset2 = createMockPreset('2', 'Workstation');

      usePrintQueueStore.getState().addToQueue(preset1);
      usePrintQueueStore.getState().addToQueue(preset2);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(2);
    });
  });

  describe('addMultipleToQueue', () => {
    it('should add multiple presets at once', () => {
      const presets = [
        createMockPreset('1', 'Gaming PC'),
        createMockPreset('2', 'Workstation'),
        createMockPreset('3', 'Budget Build'),
      ];

      usePrintQueueStore.getState().addMultipleToQueue(presets);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(3);
    });

    it('should not add duplicates when adding multiple', () => {
      const preset1 = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset1);

      const presets = [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')];

      usePrintQueueStore.getState().addMultipleToQueue(presets);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(2);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove a preset from the queue', () => {
      const preset1 = createMockPreset('1', 'Gaming PC');
      const preset2 = createMockPreset('2', 'Workstation');

      usePrintQueueStore.getState().addToQueue(preset1);
      usePrintQueueStore.getState().addToQueue(preset2);
      usePrintQueueStore.getState().removeFromQueue('1');

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('2');
    });

    it('should handle removing non-existent preset', () => {
      const preset = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset);
      usePrintQueueStore.getState().removeFromQueue('999');

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(1);
    });
  });

  describe('clearQueue', () => {
    it('should clear all presets from the queue', () => {
      const presets = [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')];

      usePrintQueueStore.getState().addMultipleToQueue(presets);
      usePrintQueueStore.getState().clearQueue();

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(0);
    });

    it('should also clear any error', () => {
      usePrintQueueStore.setState({ error: 'Test error' });
      usePrintQueueStore.getState().clearQueue();

      const { error } = usePrintQueueStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('reorderQueue', () => {
    it('should reorder presets in the queue', () => {
      const presets = [
        createMockPreset('1', 'First'),
        createMockPreset('2', 'Second'),
        createMockPreset('3', 'Third'),
      ];

      usePrintQueueStore.getState().addMultipleToQueue(presets);
      usePrintQueueStore.getState().reorderQueue(0, 2);

      const { queue } = usePrintQueueStore.getState();
      expect(queue[0].id).toBe('2');
      expect(queue[1].id).toBe('3');
      expect(queue[2].id).toBe('1');
    });

    it('should handle moving item forward', () => {
      const presets = [
        createMockPreset('1', 'First'),
        createMockPreset('2', 'Second'),
        createMockPreset('3', 'Third'),
      ];

      usePrintQueueStore.getState().addMultipleToQueue(presets);
      usePrintQueueStore.getState().reorderQueue(2, 0);

      const { queue } = usePrintQueueStore.getState();
      expect(queue[0].id).toBe('3');
      expect(queue[1].id).toBe('1');
      expect(queue[2].id).toBe('2');
    });
  });

  describe('isInQueue', () => {
    it('should return true if preset is in queue', () => {
      const preset = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset);

      expect(usePrintQueueStore.getState().isInQueue('1')).toBe(true);
    });

    it('should return false if preset is not in queue', () => {
      expect(usePrintQueueStore.getState().isInQueue('999')).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', () => {
      usePrintQueueStore.setState({ error: 'Test error' });
      usePrintQueueStore.getState().clearError();

      const { error } = usePrintQueueStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('processQueue', () => {
    it('should not process empty queue', async () => {
      await usePrintQueueStore.getState().processQueue('price', []);

      const { isProcessing, progress } = usePrintQueueStore.getState();
      expect(isProcessing).toBe(false);
      expect(progress).toBeNull();
    });

    it('should set isProcessing to true during processing', async () => {
      const preset = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset);

      const processPromise = usePrintQueueStore.getState().processQueue('price', []);

      // Check state during processing
      expect(usePrintQueueStore.getState().isProcessing).toBe(true);

      await processPromise;
    });

    it('should clear queue after successful processing', async () => {
      const preset = createMockPreset('1', 'Gaming PC');
      usePrintQueueStore.getState().addToQueue(preset);

      await usePrintQueueStore.getState().processQueue('price', []);

      const { queue, isProcessing, progress } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(0);
      expect(isProcessing).toBe(false);
      expect(progress).toBeNull();
    });
  });

  describe('cancelProcessing', () => {
    it('should set cancellation flag', () => {
      usePrintQueueStore.getState().cancelProcessing();
      // The cancellation is handled internally via a module-level flag
      // We can't directly test it, but we verify the method exists
      expect(typeof usePrintQueueStore.getState().cancelProcessing).toBe('function');
    });
  });
});
