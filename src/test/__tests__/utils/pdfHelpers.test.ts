/**
 * Tests for pure utility functions in src/utils/pdfHelpers.ts
 * Covers: hexToRgb, lightenColor, darkenColor, buildBadgesFromConfig
 */

import { describe, it, expect, vi } from 'vitest';
import {
  hexToRgb,
  lightenColor,
  darkenColor,
  buildBadgesFromConfig,
} from '../../../utils/pdfHelpers';
import {
  PrebuildConfig,
  ThemeColors,
  CONDITION_CONFIG,
  STOCK_STATUS_CONFIG,
} from '../../../types';

vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// hexToRgb
// ---------------------------------------------------------------------------

describe('hexToRgb', () => {
  it('should convert #ff0000 to [255, 0, 0]', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('should convert #00ff00 to [0, 255, 0]', () => {
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
  });

  it('should convert #0000ff to [0, 0, 255]', () => {
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('should handle hex strings without hash prefix', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });

  it('should return [0, 0, 0] for invalid hex strings', () => {
    expect(hexToRgb('invalid')).toEqual([0, 0, 0]);
  });
});

// ---------------------------------------------------------------------------
// lightenColor
// ---------------------------------------------------------------------------

describe('lightenColor', () => {
  it('should return an RGB tuple', () => {
    const result = lightenColor('#000000', 0.5);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    result.forEach((channel) => {
      expect(typeof channel).toBe('number');
    });
  });

  it('should lighten #000000 by 50% to [128, 128, 128]', () => {
    expect(lightenColor('#000000', 0.5)).toEqual([128, 128, 128]);
  });

  it('should lighten #000000 by 100% to [255, 255, 255]', () => {
    expect(lightenColor('#000000', 1.0)).toEqual([255, 255, 255]);
  });

  it('should return the original color when lightened by 0%', () => {
    expect(lightenColor('#ff0000', 0)).toEqual([255, 0, 0]);
  });
});

// ---------------------------------------------------------------------------
// darkenColor
// ---------------------------------------------------------------------------

describe('darkenColor', () => {
  it('should return an RGB tuple', () => {
    const result = darkenColor('#ffffff', 0.5);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    result.forEach((channel) => {
      expect(typeof channel).toBe('number');
    });
  });

  it('should darken #ffffff by 50% to [128, 128, 128]', () => {
    expect(darkenColor('#ffffff', 0.5)).toEqual([128, 128, 128]);
  });

  it('should darken #ffffff by 100% to [0, 0, 0]', () => {
    expect(darkenColor('#ffffff', 1.0)).toEqual([0, 0, 0]);
  });

  it('should return the original color when darkened by 0%', () => {
    expect(darkenColor('#ff0000', 0)).toEqual([255, 0, 0]);
  });
});

// ---------------------------------------------------------------------------
// buildBadgesFromConfig
// ---------------------------------------------------------------------------

function makeConfig(overrides: Partial<PrebuildConfig> = {}): PrebuildConfig {
  return {
    modelName: 'Test PC',
    price: 1499,
    components: {
      cpu: 'Intel i9-14900K',
      gpu: 'NVIDIA RTX 4090',
      ram: '32GB DDR5',
      storage: '2TB NVMe SSD',
      motherboard: 'ASUS ROG Z790',
      psu: '1000W Gold',
      case: 'NZXT H7 Flow',
      cooling: 'Kraken X63',
    },
    storeName: 'Test Store',
    storeLogo: null,
    sku: 'TEST-001',
    os: 'Windows 11 Pro',
    warranty: '3 Years',
    wifi: 'WiFi 6E',
    buildTier: '',
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
    ...overrides,
  };
}

const defaultColors: ThemeColors = {
  primary: '#dc2626',
  accent: '#1f2937',
  priceColor: '#dc2626',
};

describe('buildBadgesFromConfig', () => {
  it('should return badges for condition, buildTier, sale, and stock status', () => {
    const config = makeConfig({
      condition: 'new',
      buildTier: 'Pro',
      saleInfo: { enabled: true, originalPrice: 1999, badgeText: 'SALE' },
      stockStatus: 'in_stock',
    });

    const badges = buildBadgesFromConfig(config, defaultColors, true);

    // condition badge
    const conditionBadge = badges.find(
      (b) => b.text === CONDITION_CONFIG['new'].shortLabel
    );
    expect(conditionBadge).toBeDefined();
    expect(conditionBadge!.bg).toEqual(hexToRgb(CONDITION_CONFIG['new'].bgColor));
    expect(conditionBadge!.fg).toEqual(hexToRgb(CONDITION_CONFIG['new'].color));

    // buildTier badge
    const tierBadge = badges.find((b) => b.text === 'Pro');
    expect(tierBadge).toBeDefined();
    expect(tierBadge!.bg).toEqual(hexToRgb(defaultColors.primary));
    expect(tierBadge!.fg).toEqual([255, 255, 255]);

    // sale badge
    const saleBadge = badges.find((b) => b.text.includes('SALE'));
    expect(saleBadge).toBeDefined();
    expect(saleBadge!.bg).toEqual([220, 38, 38]);
    expect(saleBadge!.fg).toEqual([255, 255, 255]);

    // stock badge
    const stockBadge = badges.find(
      (b) => b.text === STOCK_STATUS_CONFIG['in_stock'].label
    );
    expect(stockBadge).toBeDefined();
    expect(stockBadge!.bg).toEqual(hexToRgb(STOCK_STATUS_CONFIG['in_stock'].bgColor));
    expect(stockBadge!.fg).toEqual(hexToRgb(STOCK_STATUS_CONFIG['in_stock'].color));
  });

  it('should return an empty array for a minimal config with no badge-producing fields', () => {
    const config = makeConfig();
    const badges = buildBadgesFromConfig(config, defaultColors);
    expect(badges).toEqual([]);
  });

  it('should return Badge objects with correct structure (text, bg as RGB, fg as RGB)', () => {
    const config = makeConfig({ condition: 'refurbished' });
    const badges = buildBadgesFromConfig(config, defaultColors);

    expect(badges.length).toBeGreaterThanOrEqual(1);
    for (const badge of badges) {
      expect(badge).toHaveProperty('text');
      expect(typeof badge.text).toBe('string');

      expect(badge).toHaveProperty('bg');
      expect(Array.isArray(badge.bg)).toBe(true);
      expect(badge.bg).toHaveLength(3);

      expect(badge).toHaveProperty('fg');
      expect(Array.isArray(badge.fg)).toBe(true);
      expect(badge.fg).toHaveLength(3);
    }
  });

  it('should not include stock badge when includeStock is false', () => {
    const config = makeConfig({ stockStatus: 'low_stock' });
    const badges = buildBadgesFromConfig(config, defaultColors, false);
    const stockBadge = badges.find(
      (b) => b.text === STOCK_STATUS_CONFIG['low_stock'].label
    );
    expect(stockBadge).toBeUndefined();
  });

  it('should include stock badge when includeStock is true', () => {
    const config = makeConfig({ stockStatus: 'low_stock' });
    const badges = buildBadgesFromConfig(config, defaultColors, true);
    const stockBadge = badges.find(
      (b) => b.text === STOCK_STATUS_CONFIG['low_stock'].label
    );
    expect(stockBadge).toBeDefined();
  });

  it('should include discount percentage in sale badge text when prices are available', () => {
    const config = makeConfig({
      price: 1000,
      saleInfo: { enabled: true, originalPrice: 2000, badgeText: 'DEAL' },
    });
    const badges = buildBadgesFromConfig(config, defaultColors);
    const saleBadge = badges.find((b) => b.text.includes('DEAL'));
    expect(saleBadge).toBeDefined();
    expect(saleBadge!.text).toContain('50% OFF');
  });
});
