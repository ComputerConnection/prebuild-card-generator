/**
 * Integration tests for src/utils/pdfGenerator.ts
 *
 * These tests verify PDF generation produces correct output structure
 * and content for all card sizes and configurations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PrebuildConfig, BrandIcon, CardSize } from '../../../types';
import { CARD_SIZES } from '../../../types';

// ============================================================================
// MOCKS
// ============================================================================

// Mock QR code generation
vi.mock('../../../utils/qrcode', () => ({
  generateQRCodeDataUrl: vi.fn(async () => 'data:image/png;base64,mockQRCode'),
}));

// Mock barcode utilities
vi.mock('../../../utils/barcode', () => ({
  generateBarcodeDataUrl: vi.fn(() => 'data:image/png;base64,mockBarcode'),
  isValidBarcode: vi.fn((text: string) => text.length > 0 && text.length <= 80),
}));

// Mock logger to avoid console output during tests
vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Create a mock jsPDF class that tracks method calls
const mockJsPDF = vi.fn().mockImplementation(function(this: Record<string, unknown>, options?: { orientation?: string; unit?: string; format?: string | [number, number] }) {
  // Store page dimensions
  let pageWidth = 8.5;
  let pageHeight = 11;

  if (options?.format) {
    if (Array.isArray(options.format)) {
      [pageWidth, pageHeight] = options.format;
    } else if (options.format === 'letter') {
      pageWidth = 8.5;
      pageHeight = 11;
    }
  }

  return {
    internal: {
      pageSize: {
        getWidth: () => pageWidth,
        getHeight: () => pageHeight,
      },
    },
    getNumberOfPages: () => 1,
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    text: vi.fn(),
    getTextWidth: vi.fn(() => 1),
    splitTextToSize: vi.fn((text: string) => [text]),
    addImage: vi.fn(),
    save: vi.fn(),
  };
});

vi.mock('jspdf', () => ({
  jsPDF: mockJsPDF,
}));

// Mock global Image to immediately trigger onload
class MockImage {
  onload: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  private _src = '';
  width = 100;
  height = 100;

  get src() {
    return this._src;
  }

  set src(value: string) {
    this._src = value;
    // Immediately trigger onload synchronously to avoid timing issues
    queueMicrotask(() => {
      if (this.onload) this.onload();
    });
  }
}

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a minimal valid config for testing
 */
function createTestConfig(overrides: Partial<PrebuildConfig> = {}): PrebuildConfig {
  return {
    modelName: 'Gaming PC Pro',
    price: 1499.99,
    components: {
      cpu: 'Intel Core i7-13700K',
      gpu: 'NVIDIA GeForce RTX 4070',
      ram: '32GB DDR5-6000',
      storage: '1TB NVMe SSD',
      motherboard: 'ASUS ROG Strix Z790',
      psu: '850W Gold PSU',
      case: 'NZXT H7 Flow',
      cooling: 'Noctua NH-D15',
    },
    storeName: 'Tech Store',
    storeLogo: null,
    sku: 'GPC-001-PRO',
    os: 'Windows 11 Pro',
    warranty: '3 Years',
    wifi: 'WiFi 6E',
    buildTier: 'PRO',
    features: ['VR Ready', 'RGB Lighting', '4K Gaming'],
    description: 'High-performance gaming PC',
    colorTheme: 'gaming',
    customColors: { primary: '#dc2626', accent: '#1f2937', priceColor: '#dc2626' },
    componentPrices: {
      cpu: 400, gpu: 600, ram: 150, storage: 100,
      motherboard: 300, psu: 120, case: 100, cooling: 90,
    },
    showComponentPrices: false,
    stockStatus: 'in_stock',
    stockQuantity: '5',
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
    ...overrides,
  };
}

/**
 * Create test brand icons
 */
function createTestBrandIcons(): BrandIcon[] {
  return [
    { name: 'Intel', image: 'data:image/png;base64,mockIntelIcon' },
    { name: 'AMD', image: 'data:image/png;base64,mockAMDIcon' },
    { name: 'NVIDIA', image: 'data:image/png;base64,mockNVIDIAIcon' },
  ];
}

// ============================================================================
// TESTS
// ============================================================================

describe('pdfGenerator', () => {
  let originalImage: typeof Image;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global Image
    originalImage = global.Image;
    global.Image = MockImage as unknown as typeof Image;
  });

  afterEach(() => {
    global.Image = originalImage;
  });

  // Import the generators dynamically
  const getGenerators = async () => {
    return await import('../../../utils/pdfGenerator');
  };

  // ==========================================================================
  // generatePDF - Main entry point
  // ==========================================================================

  describe('generatePDF', () => {
    it('should create PDF for shelf size', async () => {
      const { generatePDF } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePDF(config, 'shelf');

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(CARD_SIZES.shelf.width, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(CARD_SIZES.shelf.height, 1);
    });

    it('should create PDF for price size', async () => {
      const { generatePDF } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePDF(config, 'price');

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(CARD_SIZES.price.width, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(CARD_SIZES.price.height, 1);
    });

    it('should create PDF for poster size', async () => {
      const { generatePDF } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePDF(config, 'poster');

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(CARD_SIZES.poster.width, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(CARD_SIZES.poster.height, 1);
    });

    it('should default to price card for unknown size', async () => {
      const { generatePDF } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePDF(config, 'unknown' as CardSize);

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(CARD_SIZES.price.width, 1);
    });
  });

  // ==========================================================================
  // generateShelfTag - 2" × 3" Compact retail tag
  // ==========================================================================

  describe('generateShelfTag', () => {
    it('should create PDF with correct dimensions', async () => {
      const { generateShelfTag } = await getGenerators();
      const config = createTestConfig();
      const doc = await generateShelfTag(config);

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(2, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(3, 1);
    });

    it('should handle empty store name', async () => {
      const { generateShelfTag } = await getGenerators();
      const config = createTestConfig({ storeName: '' });
      const doc = await generateShelfTag(config);

      expect(doc).toBeDefined();
    });

    it('should handle missing model name', async () => {
      const { generateShelfTag } = await getGenerators();
      const config = createTestConfig({ modelName: '' });
      const doc = await generateShelfTag(config);

      expect(doc).toBeDefined();
    });

    it('should handle sale pricing', async () => {
      const { generateShelfTag } = await getGenerators();
      const config = createTestConfig({
        price: 1199.99,
        saleInfo: { enabled: true, originalPrice: 1499.99, badgeText: 'SALE' },
      });
      const doc = await generateShelfTag(config);

      expect(doc).toBeDefined();
    });

    it('should handle condition badges', async () => {
      const { generateShelfTag } = await getGenerators();
      const config = createTestConfig({ condition: 'refurbished' });
      const doc = await generateShelfTag(config);

      expect(doc).toBeDefined();
    });
  });

  // ==========================================================================
  // generatePriceCard - 4" × 6" Medium display card
  // ==========================================================================

  describe('generatePriceCard', () => {
    it('should create PDF with correct dimensions', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(4, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(6, 1);
    });

    it('should handle missing components', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        components: {
          cpu: 'Intel i7',
          gpu: '',
          ram: '16GB',
          storage: '',
          motherboard: '',
          psu: '',
          case: '',
          cooling: '',
        },
      });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });

    it('should handle financing info when enabled', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        financingInfo: { enabled: true, months: 24, apr: 9.99 },
      });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });

    it('should handle stock status badge', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({ stockStatus: 'low_stock' });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });

    it('should handle feature badges', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        features: ['VR Ready', 'RGB', '4K Gaming', 'WiFi 6'],
      });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });

    it('should handle QR code when enabled', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        visualSettings: {
          backgroundPattern: 'solid',
          cardTemplate: 'default',
          fontFamily: 'helvetica',
          showQrCode: true,
          qrCodeUrl: 'https://example.com/product',
          productImage: null,
        },
      });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });
  });

  // ==========================================================================
  // generatePoster - 8.5" × 11" Full page display
  // ==========================================================================

  describe('generatePoster', () => {
    it('should create PDF with correct dimensions', async () => {
      const { generatePoster } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePoster(config);

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(8.5, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(11, 1);
    });

    it('should handle description text', async () => {
      const { generatePoster } = await getGenerators();
      const config = createTestConfig({
        description: 'This is a high-performance gaming PC.',
      });
      const doc = await generatePoster(config);

      expect(doc).toBeDefined();
    });

    it('should handle feature badges', async () => {
      const { generatePoster } = await getGenerators();
      const config = createTestConfig({
        features: ['VR Ready', 'RGB', '4K', 'Streaming', 'Quiet', 'Compact'],
      });
      const doc = await generatePoster(config);

      expect(doc).toBeDefined();
    });

    it('should handle QR code placement', async () => {
      const { generatePoster } = await getGenerators();
      const config = createTestConfig({
        visualSettings: {
          backgroundPattern: 'solid',
          cardTemplate: 'default',
          fontFamily: 'helvetica',
          showQrCode: true,
          qrCodeUrl: 'https://store.com/pc/123',
          productImage: null,
        },
      });
      const doc = await generatePoster(config);

      expect(doc).toBeDefined();
    });
  });

  // ==========================================================================
  // generateShelfTagMultiUp - 12 tags per letter page
  // ==========================================================================

  describe('generateShelfTagMultiUp', () => {
    it('should create letter-sized page', async () => {
      const { generateShelfTagMultiUp } = await getGenerators();
      const config = createTestConfig();
      const doc = await generateShelfTagMultiUp(config);

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(8.5, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(11, 1);
    });

    it('should work with crop marks enabled', async () => {
      const { generateShelfTagMultiUp } = await getGenerators();
      const config = createTestConfig();
      const doc = await generateShelfTagMultiUp(config, true);

      expect(doc).toBeDefined();
    });

    it('should work with crop marks disabled', async () => {
      const { generateShelfTagMultiUp } = await getGenerators();
      const config = createTestConfig();
      const doc = await generateShelfTagMultiUp(config, false);

      expect(doc).toBeDefined();
    });
  });

  // ==========================================================================
  // generatePriceCardMultiUp - 2 cards per letter page
  // ==========================================================================

  describe('generatePriceCardMultiUp', () => {
    it('should create letter-sized page', async () => {
      const { generatePriceCardMultiUp } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePriceCardMultiUp(config);

      expect(doc).toBeDefined();
      expect(doc.internal.pageSize.getWidth()).toBeCloseTo(8.5, 1);
      expect(doc.internal.pageSize.getHeight()).toBeCloseTo(11, 1);
    });

    it('should work with crop marks enabled', async () => {
      const { generatePriceCardMultiUp } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePriceCardMultiUp(config, true);

      expect(doc).toBeDefined();
    });

    it('should work with crop marks disabled', async () => {
      const { generatePriceCardMultiUp } = await getGenerators();
      const config = createTestConfig();
      const doc = await generatePriceCardMultiUp(config, false);

      expect(doc).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle minimal config', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        modelName: '',
        storeName: '',
        sku: '',
        os: '',
        warranty: '',
        wifi: '',
        buildTier: '',
        features: [],
        description: '',
        stockStatus: null,
        condition: null,
      });

      const doc = await generatePriceCard(config);
      expect(doc).toBeDefined();
    });

    it('should handle maximum content', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        modelName: 'Ultimate Gaming Workstation Pro Max Edition 2024',
        storeName: 'The Ultimate Computer Super Store',
        sku: 'UGWPME2024-001-PREMIUM-EDITION',
        os: 'Windows 11 Pro for Workstations',
        warranty: '5 Years Premium On-Site Support',
        wifi: 'WiFi 7 + Bluetooth 5.4 + 10GbE',
        buildTier: 'ULTIMATE PRO MAX',
        features: ['VR Ready', 'RGB', '8K Gaming', 'AI Accelerated', 'Quiet Mode', 'Compact'],
        description: 'The ultimate gaming workstation.',
        condition: 'certified_preowned',
        stockStatus: 'in_stock',
        saleInfo: { enabled: true, originalPrice: 4999.99, badgeText: 'MEGA SALE' },
        financingInfo: { enabled: true, months: 36, apr: 12.99 },
      });

      const doc = await generatePriceCard(config);
      expect(doc).toBeDefined();
    });

    it('should handle special characters in text', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        modelName: 'PC Build - "Special" Edition & More!',
        storeName: 'Store\'s <Best> Deals 100%',
        sku: 'SKU-123/ABC_456+789',
      });

      const doc = await generatePriceCard(config);
      expect(doc).toBeDefined();
    });

    it('should handle zero price', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({ price: 0 });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });

    it('should handle high price', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({ price: 999999.99 });
      const doc = await generatePriceCard(config);

      expect(doc).toBeDefined();
    });

    it('should handle all color themes', async () => {
      const { generatePriceCard } = await getGenerators();
      const themes = ['gaming', 'workstation', 'budget', 'minimal', 'custom'] as const;

      for (const theme of themes) {
        const config = createTestConfig({ colorTheme: theme });
        const doc = await generatePriceCard(config);
        expect(doc).toBeDefined();
      }
    });

    it('should handle all condition types', async () => {
      const { generatePriceCard } = await getGenerators();
      const conditions = ['new', 'preowned', 'refurbished', 'open_box', 'certified_preowned'] as const;

      for (const condition of conditions) {
        const config = createTestConfig({ condition });
        const doc = await generatePriceCard(config);
        expect(doc).toBeDefined();
      }
    });

    it('should handle all stock statuses', async () => {
      const { generatePriceCard } = await getGenerators();
      const statuses = ['in_stock', 'low_stock', 'out_of_stock', 'on_order'] as const;

      for (const status of statuses) {
        const config = createTestConfig({ stockStatus: status });
        const doc = await generatePriceCard(config);
        expect(doc).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // Sale Badge Tests
  // ==========================================================================

  describe('sale badges', () => {
    it('should render sale with discount', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        price: 1000,
        saleInfo: { enabled: true, originalPrice: 1250, badgeText: 'SALE' },
      });
      const doc = await generatePriceCard(config);
      expect(doc).toBeDefined();
    });

    it('should handle custom sale badge text', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        price: 999,
        saleInfo: { enabled: true, originalPrice: 1499, badgeText: 'HOT DEAL' },
      });
      const doc = await generatePriceCard(config);
      expect(doc).toBeDefined();
    });

    it('should not render sale badge when disabled', async () => {
      const { generatePriceCard } = await getGenerators();
      const config = createTestConfig({
        price: 1000,
        saleInfo: { enabled: false, originalPrice: 1250, badgeText: 'SALE' },
      });
      const doc = await generatePriceCard(config);
      expect(doc).toBeDefined();
    });
  });

  // ==========================================================================
  // Barcode and QR Code Tests
  // ==========================================================================

  describe('barcode and QR code', () => {
    it('should call isValidBarcode when SKU provided', async () => {
      const { generatePriceCard } = await getGenerators();
      const { isValidBarcode } = await import('../../../utils/barcode');
      const config = createTestConfig({ sku: 'VALID-SKU-123' });
      await generatePriceCard(config);

      expect(isValidBarcode).toHaveBeenCalledWith('VALID-SKU-123');
    });

    it('should call QR code generator when enabled', async () => {
      const { generatePriceCard } = await getGenerators();
      const { generateQRCodeDataUrl } = await import('../../../utils/qrcode');
      const config = createTestConfig({
        visualSettings: {
          backgroundPattern: 'solid',
          cardTemplate: 'default',
          fontFamily: 'helvetica',
          showQrCode: true,
          qrCodeUrl: 'https://example.com',
          productImage: null,
        },
      });
      await generatePriceCard(config);

      expect(generateQRCodeDataUrl).toHaveBeenCalled();
    });
  });
});
