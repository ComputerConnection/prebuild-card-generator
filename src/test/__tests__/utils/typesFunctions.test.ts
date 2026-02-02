/**
 * Tests for utility functions in src/types/index.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getThemeColors,
  formatPrice,
  parsePrice,
  formatPriceForInput,
  calculateMonthlyPayment,
  calculateDiscountPercent,
  calculateComponentTotal,
  THEME_PRESETS,
  type PrebuildConfig,
  type ThemeColors,
  type ComponentPrices,
} from '../../../types';

// Helper to create a minimal config for testing
function createTestConfig(overrides: Partial<PrebuildConfig> = {}): PrebuildConfig {
  return {
    modelName: 'Test PC',
    price: 1000,
    components: {
      cpu: 'Intel Core i5',
      gpu: 'NVIDIA RTX 3060',
      ram: '16GB DDR4',
      storage: '512GB SSD',
      motherboard: 'ASUS B550',
      psu: '650W Bronze',
      case: 'NZXT H510',
      cooling: 'Stock Cooler',
    },
    storeName: 'Test Store',
    storeLogo: null,
    sku: '',
    os: '',
    warranty: '',
    wifi: '',
    buildTier: '',
    features: [],
    description: '',
    colorTheme: 'gaming',
    customColors: { primary: '#ff0000', accent: '#000000', priceColor: '#ff0000' },
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

describe('getThemeColors', () => {
  it('should return gaming theme colors', () => {
    const config = createTestConfig({ colorTheme: 'gaming' });
    const colors = getThemeColors(config);
    expect(colors).toEqual(THEME_PRESETS.gaming);
  });

  it('should return workstation theme colors', () => {
    const config = createTestConfig({ colorTheme: 'workstation' });
    const colors = getThemeColors(config);
    expect(colors).toEqual(THEME_PRESETS.workstation);
  });

  it('should return budget theme colors', () => {
    const config = createTestConfig({ colorTheme: 'budget' });
    const colors = getThemeColors(config);
    expect(colors).toEqual(THEME_PRESETS.budget);
  });

  it('should return minimal theme colors', () => {
    const config = createTestConfig({ colorTheme: 'minimal' });
    const colors = getThemeColors(config);
    expect(colors).toEqual(THEME_PRESETS.minimal);
  });

  it('should return custom colors when theme is custom', () => {
    const customColors: ThemeColors = {
      primary: '#123456',
      accent: '#654321',
      priceColor: '#abcdef',
    };
    const config = createTestConfig({
      colorTheme: 'custom',
      customColors,
    });
    const colors = getThemeColors(config);
    expect(colors).toEqual(customColors);
  });
});

describe('formatPrice', () => {
  describe('with cents (default)', () => {
    it('should format zero correctly', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('should format whole numbers with cents', () => {
      expect(formatPrice(100)).toBe('$100.00');
      expect(formatPrice(1000)).toBe('$1,000.00');
    });

    it('should format prices with decimals', () => {
      expect(formatPrice(99.99)).toBe('$99.99');
      expect(formatPrice(1499.5)).toBe('$1,499.50');
    });

    it('should add commas for thousands', () => {
      expect(formatPrice(1000)).toBe('$1,000.00');
      expect(formatPrice(10000)).toBe('$10,000.00');
      expect(formatPrice(1000000)).toBe('$1,000,000.00');
    });

    it('should handle NaN', () => {
      expect(formatPrice(NaN)).toBe('$0.00');
    });
  });

  describe('without cents', () => {
    it('should format zero correctly', () => {
      expect(formatPrice(0, false)).toBe('$0');
    });

    it('should format without cents', () => {
      expect(formatPrice(100, false)).toBe('$100');
      expect(formatPrice(1499, false)).toBe('$1,499');
    });

    it('should handle NaN', () => {
      expect(formatPrice(NaN, false)).toBe('$0');
    });
  });
});

describe('parsePrice', () => {
  it('should parse simple numbers', () => {
    expect(parsePrice('100')).toBe(100);
    expect(parsePrice('1499.99')).toBe(1499.99);
  });

  it('should parse prices with dollar sign', () => {
    expect(parsePrice('$100')).toBe(100);
    expect(parsePrice('$1,499.99')).toBe(1499.99);
  });

  it('should parse prices with commas', () => {
    expect(parsePrice('1,000')).toBe(1000);
    expect(parsePrice('10,000.50')).toBe(10000.5);
    expect(parsePrice('$1,000,000')).toBe(1000000);
  });

  it('should handle whitespace', () => {
    expect(parsePrice('  $100  ')).toBe(100);
    expect(parsePrice(' 1,499 ')).toBe(1499);
  });

  it('should return 0 for empty string', () => {
    expect(parsePrice('')).toBe(0);
  });

  it('should return 0 for invalid input', () => {
    expect(parsePrice('not a number')).toBe(0);
    expect(parsePrice('abc123')).toBe(0);
  });
});

describe('formatPriceForInput', () => {
  it('should return empty string for zero', () => {
    expect(formatPriceForInput(0)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(formatPriceForInput(NaN)).toBe('');
  });

  it('should format without dollar sign', () => {
    expect(formatPriceForInput(100)).toBe('100');
    expect(formatPriceForInput(1499)).toBe('1,499');
  });

  it('should include decimals when present', () => {
    expect(formatPriceForInput(99.99)).toBe('99.99');
    expect(formatPriceForInput(1499.5)).toBe('1,499.5');
  });

  it('should not force two decimal places', () => {
    expect(formatPriceForInput(100.1)).toBe('100.1');
    expect(formatPriceForInput(100.0)).toBe('100');
  });
});

describe('calculateMonthlyPayment', () => {
  describe('0% APR (no interest)', () => {
    it('should calculate simple division', () => {
      expect(calculateMonthlyPayment(1200, 12, 0)).toBe('100.00');
      expect(calculateMonthlyPayment(2400, 24, 0)).toBe('100.00');
    });

    it('should handle fractional results', () => {
      expect(calculateMonthlyPayment(1000, 12, 0)).toBe('83.33');
    });
  });

  describe('with APR', () => {
    it('should calculate monthly payment with interest', () => {
      // $1200 at 12% APR for 12 months ≈ $106.62/mo
      const result = parseFloat(calculateMonthlyPayment(1200, 12, 12));
      expect(result).toBeCloseTo(106.62, 1);
    });

    it('should handle high APR', () => {
      // Higher APR should result in higher payment
      const lowApr = parseFloat(calculateMonthlyPayment(1000, 12, 5));
      const highApr = parseFloat(calculateMonthlyPayment(1000, 12, 20));
      expect(highApr).toBeGreaterThan(lowApr);
    });
  });

  describe('invalid inputs', () => {
    it('should return empty string for zero or negative price', () => {
      expect(calculateMonthlyPayment(0, 12, 10)).toBe('');
      expect(calculateMonthlyPayment(-100, 12, 10)).toBe('');
    });

    it('should return empty string for zero or negative months', () => {
      expect(calculateMonthlyPayment(1000, 0, 10)).toBe('');
      expect(calculateMonthlyPayment(1000, -12, 10)).toBe('');
    });
  });
});

describe('calculateDiscountPercent', () => {
  it('should calculate correct discount percentage', () => {
    expect(calculateDiscountPercent(100, 80)).toBe(20);
    expect(calculateDiscountPercent(1000, 750)).toBe(25);
    expect(calculateDiscountPercent(200, 100)).toBe(50);
  });

  it('should round to nearest whole number', () => {
    expect(calculateDiscountPercent(100, 67)).toBe(33);
    expect(calculateDiscountPercent(1000, 777)).toBe(22);
  });

  it('should return 0 for invalid original price', () => {
    expect(calculateDiscountPercent(0, 50)).toBe(0);
    expect(calculateDiscountPercent(-100, 50)).toBe(0);
  });

  it('should return 0 for negative sale price', () => {
    expect(calculateDiscountPercent(100, -10)).toBe(0);
  });

  it('should return 0 when sale price >= original price', () => {
    expect(calculateDiscountPercent(100, 100)).toBe(0);
    expect(calculateDiscountPercent(100, 150)).toBe(0);
  });

  it('should handle 100% discount (free)', () => {
    expect(calculateDiscountPercent(100, 0)).toBe(100);
  });
});

describe('calculateComponentTotal', () => {
  it('should sum all component prices', () => {
    const prices: ComponentPrices = {
      cpu: 300,
      gpu: 500,
      ram: 100,
      storage: 100,
      motherboard: 150,
      psu: 80,
      case: 70,
      cooling: 50,
    };
    expect(calculateComponentTotal(prices)).toBe(1350);
  });

  it('should handle zero prices', () => {
    const prices: ComponentPrices = {
      cpu: 0,
      gpu: 0,
      ram: 0,
      storage: 0,
      motherboard: 0,
      psu: 0,
      case: 0,
      cooling: 0,
    };
    expect(calculateComponentTotal(prices)).toBe(0);
  });

  it('should handle partial pricing', () => {
    const prices: ComponentPrices = {
      cpu: 300,
      gpu: 500,
      ram: 0,
      storage: 0,
      motherboard: 0,
      psu: 0,
      case: 0,
      cooling: 0,
    };
    expect(calculateComponentTotal(prices)).toBe(800);
  });

  it('should handle decimal prices', () => {
    const prices: ComponentPrices = {
      cpu: 299.99,
      gpu: 499.99,
      ram: 99.99,
      storage: 89.99,
      motherboard: 149.99,
      psu: 79.99,
      case: 69.99,
      cooling: 49.99,
    };
    expect(calculateComponentTotal(prices)).toBeCloseTo(1339.92, 2);
  });
});
