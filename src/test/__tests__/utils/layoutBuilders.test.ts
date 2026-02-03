/**
 * Tests for src/utils/layoutBuilders.ts
 * Tests the core layout building functions used for preview and PDF rendering
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildShelfTagLayout,
  buildPriceCardLayout,
  buildPosterLayout,
  buildCardLayout,
} from '../../../utils/layoutBuilders';
import {
  LayoutBuilderContext,
  resetElementIdCounter,
  lightenColor,
  darkenColor,
  hexToRgb,
} from '../../../utils/layoutSchema';
import { defaultConfig } from '../../../data/componentOptions';
import { getThemeColors, THEME_PRESETS } from '../../../types';
import type { PrebuildConfig, BrandIcon } from '../../../types';

// Helper to create a test context
function createTestContext(
  overrides: Partial<PrebuildConfig> = {},
  cardSize: 'shelf' | 'price' | 'poster' = 'price',
  brandIcons: BrandIcon[] = []
): LayoutBuilderContext {
  const config: PrebuildConfig = {
    ...defaultConfig,
    ...overrides,
  } as PrebuildConfig;

  return {
    config,
    cardSize,
    colors: getThemeColors(config),
    brandIcons,
    asyncData: {},
  };
}

describe('layoutBuilders', () => {
  beforeEach(() => {
    resetElementIdCounter();
  });

  describe('Color utility functions', () => {
    describe('hexToRgb', () => {
      it('should convert hex to RGB correctly', () => {
        expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
        expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
        expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
        expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
        expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      });

      it('should handle hex without # prefix', () => {
        expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
      });

      it('should return [0,0,0] for invalid hex', () => {
        expect(hexToRgb('invalid')).toEqual([0, 0, 0]);
        expect(hexToRgb('')).toEqual([0, 0, 0]);
      });
    });

    describe('lightenColor', () => {
      it('should lighten black to gray', () => {
        const lightened = lightenColor('#000000', 0.5);
        expect(lightened).toBe('#808080');
      });

      it('should lighten color by percentage', () => {
        const lightened = lightenColor('#800000', 0.5);
        // 128 + (255-128)*0.5 = 128 + 63.5 = ~192
        // R: 128, G: 0, B: 0
        // newR = 128 + (255-128)*0.5 = 192
        // newG = 0 + (255-0)*0.5 = 128
        // newB = 0 + (255-0)*0.5 = 128
        expect(lightened).toBe('#c08080');
      });

      it('should return white when lightening by 100%', () => {
        const lightened = lightenColor('#000000', 1);
        expect(lightened).toBe('#ffffff');
      });

      it('should return same color when lightening by 0%', () => {
        const lightened = lightenColor('#ff0000', 0);
        expect(lightened).toBe('#ff0000');
      });
    });

    describe('darkenColor', () => {
      it('should darken white to gray', () => {
        const darkened = darkenColor('#ffffff', 0.5);
        expect(darkened).toBe('#808080');
      });

      it('should return black when darkening by 100%', () => {
        const darkened = darkenColor('#ffffff', 1);
        expect(darkened).toBe('#000000');
      });

      it('should return same color when darkening by 0%', () => {
        const darkened = darkenColor('#ff0000', 0);
        expect(darkened).toBe('#ff0000');
      });

      it('should darken red correctly', () => {
        const darkened = darkenColor('#ff0000', 0.5);
        // 255 * 0.5 = 127.5 -> 128
        expect(darkened).toBe('#800000');
      });
    });
  });

  describe('buildCardLayout', () => {
    it('should route to shelf layout for shelf size', () => {
      const ctx = createTestContext({}, 'shelf');
      const layout = buildCardLayout(ctx);
      expect(layout.cardSize).toBe('shelf');
    });

    it('should route to price layout for price size', () => {
      const ctx = createTestContext({}, 'price');
      const layout = buildCardLayout(ctx);
      expect(layout.cardSize).toBe('price');
    });

    it('should route to poster layout for poster size', () => {
      const ctx = createTestContext({}, 'poster');
      const layout = buildCardLayout(ctx);
      expect(layout.cardSize).toBe('poster');
    });

    it('should default to price layout for unknown size', () => {
      const ctx = createTestContext({}, 'unknown' as 'price');
      const layout = buildCardLayout(ctx);
      expect(layout.cardSize).toBe('price');
    });
  });

  describe('buildShelfTagLayout', () => {
    it('should create basic shelf layout with model name', () => {
      const ctx = createTestContext({ modelName: 'Gaming PC Pro' }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      expect(layout.cardSize).toBe('shelf');
      expect(layout.dimensions.width).toBe(2);
      expect(layout.dimensions.height).toBe(3);

      const modelElement = layout.elements.find(
        (e) => e.type === 'text' && 'text' in e && e.text === 'Gaming PC Pro'
      );
      expect(modelElement).toBeDefined();
    });

    it('should use default model name when empty', () => {
      const ctx = createTestContext({ modelName: '' }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      const modelElement = layout.elements.find(
        (e) => e.type === 'text' && 'text' in e && e.text === 'PC Build'
      );
      expect(modelElement).toBeDefined();
    });

    it('should include header when store name is set', () => {
      const ctx = createTestContext({ storeName: 'Tech Store' }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      const headerElement = layout.elements.find((e) => e.type === 'header');
      expect(headerElement).toBeDefined();
      if (headerElement?.type === 'header') {
        expect(headerElement.text).toBe('Tech Store');
      }
    });

    it('should not include header when store name is empty', () => {
      const ctx = createTestContext({ storeName: '' }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      const headerElement = layout.elements.find((e) => e.type === 'header');
      expect(headerElement).toBeUndefined();
    });

    it('should include price element', () => {
      const ctx = createTestContext({ price: 1499 }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      const priceElement = layout.elements.find((e) => e.type === 'price');
      expect(priceElement).toBeDefined();
      if (priceElement?.type === 'price') {
        expect(priceElement.currentPrice).toBe(1499);
      }
    });

    it('should include spec items for filled components', () => {
      const ctx = createTestContext(
        {
          components: {
            ...defaultConfig.components,
            cpu: 'Intel Core i9-14900K',
            gpu: 'NVIDIA RTX 4090',
            ram: '32GB DDR5',
            storage: '2TB NVMe',
            motherboard: '',
            psu: '',
            case: '',
            cooling: '',
          },
        },
        'shelf'
      );
      const layout = buildShelfTagLayout(ctx);

      const specsElement = layout.elements.find((e) => e.type === 'specs');
      expect(specsElement).toBeDefined();
      if (specsElement?.type === 'specs') {
        expect(specsElement.specs.length).toBe(4);
        expect(specsElement.specs[0].value).toBe('Intel Core i9-14900K');
      }
    });

    it('should include barcode when async data has barcode image', () => {
      const ctx = createTestContext({ sku: 'SKU-001' }, 'shelf');
      ctx.asyncData = { barcodeImage: 'data:image/png;base64,barcode' };
      const layout = buildShelfTagLayout(ctx);

      const barcodeElement = layout.elements.find((e) => e.type === 'barcode');
      expect(barcodeElement).toBeDefined();
    });

    it('should not include barcode without async data', () => {
      const ctx = createTestContext({ sku: 'SKU-001' }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      const barcodeElement = layout.elements.find((e) => e.type === 'barcode');
      expect(barcodeElement).toBeUndefined();
    });

    it('should include SKU element when set', () => {
      const ctx = createTestContext({ sku: 'PC-GAM-001' }, 'shelf');
      const layout = buildShelfTagLayout(ctx);

      const skuElement = layout.elements.find((e) => e.type === 'sku');
      expect(skuElement).toBeDefined();
      if (skuElement?.type === 'sku') {
        expect(skuElement.value).toBe('PC-GAM-001');
      }
    });
  });

  describe('buildPriceCardLayout', () => {
    it('should create price card layout with correct dimensions', () => {
      const ctx = createTestContext({}, 'price');
      const layout = buildPriceCardLayout(ctx);

      expect(layout.cardSize).toBe('price');
      expect(layout.dimensions.width).toBe(4);
      expect(layout.dimensions.height).toBe(6);
    });

    it('should include all 8 spec categories when filled', () => {
      const ctx = createTestContext(
        {
          components: {
            cpu: 'Intel Core i9',
            gpu: 'NVIDIA RTX 4090',
            ram: '32GB DDR5',
            storage: '2TB NVMe',
            motherboard: 'ASUS ROG',
            psu: '850W Gold',
            case: 'NZXT H7',
            cooling: '360mm AIO',
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const specsElement = layout.elements.find((e) => e.type === 'specs');
      expect(specsElement).toBeDefined();
      if (specsElement?.type === 'specs') {
        expect(specsElement.specs.length).toBe(8);
        expect(specsElement.layout).toBe('two-column');
      }
    });

    it('should include financing info when enabled', () => {
      const ctx = createTestContext(
        {
          price: 1500,
          financingInfo: {
            enabled: true,
            months: 24,
            apr: 0,
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const financingElement = layout.elements.find((e) => e.type === 'financing');
      expect(financingElement).toBeDefined();
      if (financingElement?.type === 'financing') {
        expect(financingElement.months).toBe(24);
      }
    });

    it('should not include financing info when disabled', () => {
      const ctx = createTestContext(
        {
          price: 1500,
          financingInfo: {
            enabled: false,
            months: 24,
            apr: 0,
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const financingElement = layout.elements.find((e) => e.type === 'financing');
      expect(financingElement).toBeUndefined();
    });

    it('should include feature badges when set', () => {
      const ctx = createTestContext(
        {
          features: ['VR Ready', '4K Gaming', 'RGB Lighting'],
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const badgeRows = layout.elements.filter((e) => e.type === 'badge-row');
      const featureBadgeRow = badgeRows.find(
        (row) => row.type === 'badge-row' && row.badges.some((b) => b.text === 'VR Ready')
      );
      expect(featureBadgeRow).toBeDefined();
    });

    it('should include QR code when enabled and data available', () => {
      const ctx = createTestContext(
        {
          visualSettings: {
            ...defaultConfig.visualSettings,
            showQrCode: true,
            qrCodeUrl: 'https://example.com',
          },
        },
        'price'
      );
      ctx.asyncData = { qrCodeImage: 'data:image/png;base64,qrcode' };
      const layout = buildPriceCardLayout(ctx);

      const qrElement = layout.elements.find((e) => e.type === 'qrcode');
      expect(qrElement).toBeDefined();
    });

    it('should include info bar with OS, warranty, and connectivity', () => {
      const ctx = createTestContext(
        {
          os: 'Windows 11 Pro',
          warranty: '3 Year',
          wifi: 'WiFi 6E',
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const infoBarElement = layout.elements.find((e) => e.type === 'info-bar');
      expect(infoBarElement).toBeDefined();
      if (infoBarElement?.type === 'info-bar') {
        expect(infoBarElement.items.length).toBe(3);
        expect(infoBarElement.items[0].value).toBe('Windows 11 Pro');
      }
    });

    it('should include product image when set', () => {
      const ctx = createTestContext(
        {
          visualSettings: {
            ...defaultConfig.visualSettings,
            productImage: 'data:image/png;base64,product',
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const imageElements = layout.elements.filter((e) => e.type === 'image');
      const productImage = imageElements.find((e) => e.type === 'image' && e.alt === 'Product');
      expect(productImage).toBeDefined();
    });
  });

  describe('buildPosterLayout', () => {
    it('should create poster layout with correct dimensions', () => {
      const ctx = createTestContext({}, 'poster');
      const layout = buildPosterLayout(ctx);

      expect(layout.cardSize).toBe('poster');
      expect(layout.dimensions.width).toBe(8.5);
      expect(layout.dimensions.height).toBe(11);
    });

    it('should include SPECIFICATIONS header', () => {
      const ctx = createTestContext({}, 'poster');
      const layout = buildPosterLayout(ctx);

      const specsHeader = layout.elements.find(
        (e) => e.type === 'text' && 'text' in e && e.text === 'SPECIFICATIONS'
      );
      expect(specsHeader).toBeDefined();
    });

    it('should include description when set', () => {
      const ctx = createTestContext(
        {
          description: 'Ultimate gaming experience',
        },
        'poster'
      );
      const layout = buildPosterLayout(ctx);

      const descriptionElement = layout.elements.find(
        (e) => e.type === 'text' && 'text' in e && e.text === 'Ultimate gaming experience'
      );
      expect(descriptionElement).toBeDefined();
    });

    it('should show APR in financing when non-zero', () => {
      const ctx = createTestContext(
        {
          price: 2000,
          financingInfo: {
            enabled: true,
            months: 24,
            apr: 9.99,
          },
        },
        'poster'
      );
      const layout = buildPosterLayout(ctx);

      const financingElement = layout.elements.find((e) => e.type === 'financing');
      expect(financingElement).toBeDefined();
      if (financingElement?.type === 'financing') {
        expect(financingElement.showApr).toBe(true);
        expect(financingElement.apr).toBe(9.99);
      }
    });
  });

  describe('Badge generation', () => {
    it('should include condition badge when set', () => {
      const ctx = createTestContext(
        {
          condition: 'new',
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const badgeRow = layout.elements.find((e) => e.type === 'badge-row');
      expect(badgeRow).toBeDefined();
      if (badgeRow?.type === 'badge-row') {
        const conditionBadge = badgeRow.badges.find((b) => b.text === 'NEW');
        expect(conditionBadge).toBeDefined();
      }
    });

    it('should include build tier badge when set', () => {
      const ctx = createTestContext(
        {
          buildTier: 'High-End Gaming',
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const badgeRow = layout.elements.find((e) => e.type === 'badge-row');
      expect(badgeRow).toBeDefined();
      if (badgeRow?.type === 'badge-row') {
        const tierBadge = badgeRow.badges.find((b) => b.text === 'High-End Gaming');
        expect(tierBadge).toBeDefined();
      }
    });

    it('should include sale badge with discount percentage', () => {
      const ctx = createTestContext(
        {
          price: 800,
          saleInfo: {
            enabled: true,
            originalPrice: 1000,
            badgeText: 'SALE',
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const badgeRow = layout.elements.find((e) => e.type === 'badge-row');
      expect(badgeRow).toBeDefined();
      if (badgeRow?.type === 'badge-row') {
        const saleBadge = badgeRow.badges.find((b) => b.text.includes('SALE'));
        expect(saleBadge).toBeDefined();
        expect(saleBadge?.text).toContain('20% OFF');
      }
    });

    it('should include stock badge on layouts that support it', () => {
      const ctx = createTestContext(
        {
          stockStatus: 'low_stock',
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const badgeRow = layout.elements.find((e) => e.type === 'badge-row');
      expect(badgeRow).toBeDefined();
      if (badgeRow?.type === 'badge-row') {
        const stockBadge = badgeRow.badges.find((b) => b.text === 'Low Stock');
        expect(stockBadge).toBeDefined();
      }
    });
  });

  describe('Brand icons in specs', () => {
    it('should include brand icon when matched', () => {
      const brandIcons: BrandIcon[] = [
        { name: 'Intel', image: 'data:image/png;base64,intel' },
        { name: 'NVIDIA', image: 'data:image/png;base64,nvidia' },
      ];

      const ctx = createTestContext(
        {
          components: {
            ...defaultConfig.components,
            cpu: 'Intel Core i9-14900K',
            gpu: 'NVIDIA RTX 4090',
            ram: '',
            storage: '',
            motherboard: '',
            psu: '',
            case: '',
            cooling: '',
          },
        },
        'price',
        brandIcons
      );

      const layout = buildPriceCardLayout(ctx);
      const specsElement = layout.elements.find((e) => e.type === 'specs');

      expect(specsElement).toBeDefined();
      if (specsElement?.type === 'specs') {
        const cpuSpec = specsElement.specs.find((s) => s.key === 'cpu');
        expect(cpuSpec?.brandIcon).toBeDefined();
        expect(cpuSpec?.brandIcon?.name).toBe('Intel');

        const gpuSpec = specsElement.specs.find((s) => s.key === 'gpu');
        expect(gpuSpec?.brandIcon).toBeDefined();
        expect(gpuSpec?.brandIcon?.name).toBe('NVIDIA');
      }
    });

    it('should not include brand icon when not matched', () => {
      const brandIcons: BrandIcon[] = [{ name: 'Intel', image: 'data:image/png;base64,intel' }];

      const ctx = createTestContext(
        {
          components: {
            ...defaultConfig.components,
            cpu: 'AMD Ryzen 9 7950X',
            gpu: '',
            ram: '',
            storage: '',
            motherboard: '',
            psu: '',
            case: '',
            cooling: '',
          },
        },
        'price',
        brandIcons
      );

      const layout = buildPriceCardLayout(ctx);
      const specsElement = layout.elements.find((e) => e.type === 'specs');

      if (specsElement?.type === 'specs') {
        const cpuSpec = specsElement.specs.find((s) => s.key === 'cpu');
        expect(cpuSpec?.brandIcon).toBeUndefined();
      }
    });
  });

  describe('Theme colors', () => {
    it('should use gaming theme colors', () => {
      const ctx = createTestContext({ colorTheme: 'gaming' }, 'price');
      const layout = buildPriceCardLayout(ctx);

      expect(layout.colors).toEqual(THEME_PRESETS.gaming);
    });

    it('should use workstation theme colors', () => {
      const ctx = createTestContext({ colorTheme: 'workstation' }, 'price');
      const layout = buildPriceCardLayout(ctx);

      expect(layout.colors).toEqual(THEME_PRESETS.workstation);
    });

    it('should use custom colors when custom theme selected', () => {
      const customColors = {
        primary: '#ff00ff',
        accent: '#00ffff',
        priceColor: '#ffff00',
      };
      const ctx = createTestContext(
        {
          colorTheme: 'custom',
          customColors,
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      expect(layout.colors).toEqual(customColors);
    });
  });

  describe('Visual settings', () => {
    it('should apply font family from settings', () => {
      const ctx = createTestContext(
        {
          visualSettings: {
            ...defaultConfig.visualSettings,
            fontFamily: 'georgia',
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      expect(layout.fontFamily).toContain('Georgia');
    });

    it('should apply background pattern from settings', () => {
      const ctx = createTestContext(
        {
          visualSettings: {
            ...defaultConfig.visualSettings,
            backgroundPattern: 'gradient',
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      expect(layout.background.pattern).toContain('linear-gradient');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty config gracefully', () => {
      const ctx = createTestContext({}, 'price');
      const layout = buildPriceCardLayout(ctx);

      expect(layout).toBeDefined();
      expect(layout.elements.length).toBeGreaterThan(0);
    });

    it('should handle missing components', () => {
      const ctx = createTestContext(
        {
          components: {
            cpu: '',
            gpu: '',
            ram: '',
            storage: '',
            motherboard: '',
            psu: '',
            case: '',
            cooling: '',
          },
        },
        'price'
      );
      const layout = buildPriceCardLayout(ctx);

      const specsElement = layout.elements.find((e) => e.type === 'specs');
      // Should either be undefined or have no specs
      if (specsElement?.type === 'specs') {
        expect(specsElement.specs.length).toBe(0);
      }
    });

    it('should handle zero price', () => {
      const ctx = createTestContext({ price: 0 }, 'price');
      const layout = buildPriceCardLayout(ctx);

      const priceElement = layout.elements.find((e) => e.type === 'price');
      expect(priceElement).toBeDefined();
      if (priceElement?.type === 'price') {
        expect(priceElement.currentPrice).toBe(0);
      }
    });

    it('should reset element IDs between builds', () => {
      const ctx1 = createTestContext({}, 'price');
      resetElementIdCounter();
      const layout1 = buildPriceCardLayout(ctx1);

      resetElementIdCounter();
      const ctx2 = createTestContext({}, 'price');
      const layout2 = buildPriceCardLayout(ctx2);

      // Element IDs should be the same after reset
      expect(layout1.elements[0]?.id).toBe(layout2.elements[0]?.id);
    });
  });
});
