/**
 * Tests for src/hooks/useCardLayout.ts
 * Tests the card layout generation hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCardLayout } from '../../../hooks/useCardLayout';
import { defaultConfig } from '../../../data/componentOptions';
import { resetElementIdCounter } from '../../../utils/layoutSchema';
import type { PrebuildConfig, BrandIcon } from '../../../types';

describe('useCardLayout', () => {
  beforeEach(() => {
    resetElementIdCounter();
  });

  const createConfig = (overrides: Partial<PrebuildConfig> = {}): PrebuildConfig =>
    ({
      ...defaultConfig,
      ...overrides,
    }) as PrebuildConfig;

  describe('basic layout generation', () => {
    it('should generate layout for price card size', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ modelName: 'Test PC' }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.layout).toBeDefined();
      expect(result.current.layout.cardSize).toBe('price');
      expect(result.current.layout.dimensions.width).toBe(4);
      expect(result.current.layout.dimensions.height).toBe(6);
    });

    it('should generate layout for shelf card size', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'shelf',
          brandIcons: [],
        })
      );

      expect(result.current.layout.cardSize).toBe('shelf');
      expect(result.current.layout.dimensions.width).toBe(2);
      expect(result.current.layout.dimensions.height).toBe(3);
    });

    it('should generate layout for poster card size', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'poster',
          brandIcons: [],
        })
      );

      expect(result.current.layout.cardSize).toBe('poster');
      expect(result.current.layout.dimensions.width).toBe(8.5);
      expect(result.current.layout.dimensions.height).toBe(11);
    });
  });

  describe('context generation', () => {
    it('should include config in context', () => {
      const config = createConfig({ modelName: 'Context Test PC', price: 999 });
      const { result } = renderHook(() =>
        useCardLayout({
          config,
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.context.config).toEqual(config);
    });

    it('should include card size in context', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'poster',
          brandIcons: [],
        })
      );

      expect(result.current.context.cardSize).toBe('poster');
    });

    it('should include brand icons in context', () => {
      const brandIcons: BrandIcon[] = [
        { name: 'Intel', image: 'data:image/png;base64,intel' },
        { name: 'AMD', image: 'data:image/png;base64,amd' },
      ];

      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'price',
          brandIcons,
        })
      );

      expect(result.current.context.brandIcons).toEqual(brandIcons);
    });

    it('should include async data in context', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'price',
          brandIcons: [],
          qrCodeImage: 'data:image/png;base64,qr',
          barcodeImage: 'data:image/png;base64,barcode',
        })
      );

      expect(result.current.context.asyncData?.qrCodeImage).toBe('data:image/png;base64,qr');
      expect(result.current.context.asyncData?.barcodeImage).toBe('data:image/png;base64,barcode');
    });
  });

  describe('theme colors', () => {
    it('should compute colors from gaming theme', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ colorTheme: 'gaming' }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.context.colors.primary).toBe('#dc2626');
      expect(result.current.layout.colors.primary).toBe('#dc2626');
    });

    it('should compute colors from workstation theme', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ colorTheme: 'workstation' }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.context.colors.primary).toBe('#2563eb');
    });

    it('should compute colors from custom theme', () => {
      const customColors = {
        primary: '#ff00ff',
        accent: '#00ffff',
        priceColor: '#ffff00',
      };

      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ colorTheme: 'custom', customColors }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.context.colors).toEqual(customColors);
    });
  });

  describe('memoization', () => {
    it('should return same layout reference for unchanged inputs', () => {
      const config = createConfig();
      const brandIcons: BrandIcon[] = [];

      const { result, rerender } = renderHook(
        ({ config, cardSize, brandIcons }) => useCardLayout({ config, cardSize, brandIcons }),
        { initialProps: { config, cardSize: 'price' as const, brandIcons } }
      );

      const firstLayout = result.current.layout;

      // Rerender with same props
      rerender({ config, cardSize: 'price' as const, brandIcons });

      expect(result.current.layout).toBe(firstLayout);
    });

    it('should return new layout when config changes', () => {
      const config1 = createConfig({ modelName: 'First' });
      const config2 = createConfig({ modelName: 'Second' });

      const { result, rerender } = renderHook(
        ({ config }) => useCardLayout({ config, cardSize: 'price', brandIcons: [] }),
        { initialProps: { config: config1 } }
      );

      const firstLayout = result.current.layout;

      rerender({ config: config2 });

      expect(result.current.layout).not.toBe(firstLayout);
    });

    it('should return new layout when card size changes', () => {
      const config = createConfig();

      const { result, rerender } = renderHook(
        ({ cardSize }) => useCardLayout({ config, cardSize, brandIcons: [] }),
        { initialProps: { cardSize: 'price' as const } }
      );

      const firstLayout = result.current.layout;
      resetElementIdCounter();

      rerender({ cardSize: 'poster' as const });

      expect(result.current.layout).not.toBe(firstLayout);
      expect(result.current.layout.cardSize).toBe('poster');
    });

    it('should return new layout when brand icons change', () => {
      const config = createConfig();
      const icons1: BrandIcon[] = [];
      const icons2: BrandIcon[] = [{ name: 'Intel', image: 'data:image' }];

      const { result, rerender } = renderHook(
        ({ brandIcons }) => useCardLayout({ config, cardSize: 'price', brandIcons }),
        { initialProps: { brandIcons: icons1 } }
      );

      const firstLayout = result.current.layout;

      rerender({ brandIcons: icons2 });

      expect(result.current.layout).not.toBe(firstLayout);
    });

    it('should return new context when inputs change', () => {
      const config1 = createConfig({ modelName: 'First' });
      const config2 = createConfig({ modelName: 'Second' });

      const { result, rerender } = renderHook(
        ({ config }) => useCardLayout({ config, cardSize: 'price', brandIcons: [] }),
        { initialProps: { config: config1 } }
      );

      const firstContext = result.current.context;

      rerender({ config: config2 });

      expect(result.current.context).not.toBe(firstContext);
    });
  });

  describe('layout elements', () => {
    it('should include model name element', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ modelName: 'Gaming Beast' }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      const textElements = result.current.layout.elements.filter((e) => e.type === 'text');
      const modelElement = textElements.find((e) => 'text' in e && e.text === 'Gaming Beast');
      expect(modelElement).toBeDefined();
    });

    it('should include price element', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ price: 1499 }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      const priceElement = result.current.layout.elements.find((e) => e.type === 'price');
      expect(priceElement).toBeDefined();
      if (priceElement?.type === 'price') {
        expect(priceElement.currentPrice).toBe(1499);
      }
    });

    it('should include specs with brand icons', () => {
      const brandIcons: BrandIcon[] = [{ name: 'Intel', image: 'data:image/png;base64,intel' }];

      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({
            components: {
              ...defaultConfig.components,
              cpu: 'Intel Core i9-14900K',
            },
          }),
          cardSize: 'price',
          brandIcons,
        })
      );

      const specsElement = result.current.layout.elements.find((e) => e.type === 'specs');
      expect(specsElement).toBeDefined();
      if (specsElement?.type === 'specs') {
        const cpuSpec = specsElement.specs.find((s) => s.key === 'cpu');
        expect(cpuSpec?.brandIcon).toBeDefined();
        expect(cpuSpec?.brandIcon?.name).toBe('Intel');
      }
    });

    it('should include QR code when enabled with async data', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({
            visualSettings: {
              ...defaultConfig.visualSettings,
              showQrCode: true,
              qrCodeUrl: 'https://example.com',
            },
          }),
          cardSize: 'price',
          brandIcons: [],
          qrCodeImage: 'data:image/png;base64,qr',
        })
      );

      const qrElement = result.current.layout.elements.find((e) => e.type === 'qrcode');
      expect(qrElement).toBeDefined();
    });

    it('should include barcode when async data available', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({ sku: 'TEST-SKU-001' }),
          cardSize: 'price',
          brandIcons: [],
          barcodeImage: 'data:image/png;base64,barcode',
        })
      );

      const barcodeElement = result.current.layout.elements.find((e) => e.type === 'barcode');
      expect(barcodeElement).toBeDefined();
    });
  });

  describe('visual settings', () => {
    it('should apply font family from config', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({
            visualSettings: {
              ...defaultConfig.visualSettings,
              fontFamily: 'georgia',
            },
          }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.layout.fontFamily).toContain('Georgia');
    });

    it('should apply background pattern from config', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({
            visualSettings: {
              ...defaultConfig.visualSettings,
              backgroundPattern: 'gradient',
            },
          }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.layout.background.pattern).toContain('linear-gradient');
    });
  });

  describe('element ID consistency', () => {
    it('should generate consistent element IDs after counter reset', () => {
      const config = createConfig();

      resetElementIdCounter();
      const { result: result1 } = renderHook(() =>
        useCardLayout({ config, cardSize: 'price', brandIcons: [] })
      );

      resetElementIdCounter();
      const { result: result2 } = renderHook(() =>
        useCardLayout({ config, cardSize: 'price', brandIcons: [] })
      );

      // First elements should have same IDs
      expect(result1.current.layout.elements[0]?.id).toBe(result2.current.layout.elements[0]?.id);
    });
  });

  describe('edge cases', () => {
    it('should handle empty config gracefully', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      expect(result.current.layout).toBeDefined();
      expect(result.current.layout.elements.length).toBeGreaterThan(0);
    });

    it('should handle undefined async data', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig(),
          cardSize: 'price',
          brandIcons: [],
          qrCodeImage: undefined,
          barcodeImage: undefined,
        })
      );

      expect(result.current.context.asyncData?.qrCodeImage).toBeUndefined();
      expect(result.current.context.asyncData?.barcodeImage).toBeUndefined();
    });

    it('should handle empty brand icons array', () => {
      const { result } = renderHook(() =>
        useCardLayout({
          config: createConfig({
            components: {
              ...defaultConfig.components,
              cpu: 'Intel Core i9',
            },
          }),
          cardSize: 'price',
          brandIcons: [],
        })
      );

      const specsElement = result.current.layout.elements.find((e) => e.type === 'specs');
      if (specsElement?.type === 'specs') {
        const cpuSpec = specsElement.specs.find((s) => s.key === 'cpu');
        expect(cpuSpec?.brandIcon).toBeUndefined();
      }
    });
  });
});
