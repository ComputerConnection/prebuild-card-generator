/**
 * Tests for src/utils/pdfLayouts.ts
 *
 * Verifies layout configurations for all card sizes and multi-up configs.
 */

import { describe, it, expect } from 'vitest';
import {
  getLayoutConfig,
  getMultiUpConfig,
  SHELF_TAG_LAYOUT,
  PRICE_CARD_LAYOUT,
  POSTER_LAYOUT,
  SHELF_TAG_MULTI_UP,
  PRICE_CARD_MULTI_UP,
  POSTER_SPEC_CARD,
  POSTER_SPEC_HEADER,
} from '../../../utils/pdfLayouts';
import type { CardSize } from '../../../types';

// ============================================================================
// getLayoutConfig
// ============================================================================

describe('getLayoutConfig', () => {
  it('should return shelf tag layout for "shelf"', () => {
    expect(getLayoutConfig('shelf')).toBe(SHELF_TAG_LAYOUT);
  });

  it('should return price card layout for "price"', () => {
    expect(getLayoutConfig('price')).toBe(PRICE_CARD_LAYOUT);
  });

  it('should return poster layout for "poster"', () => {
    expect(getLayoutConfig('poster')).toBe(POSTER_LAYOUT);
  });

  it('should return price card layout as default for unknown size', () => {
    expect(getLayoutConfig('unknown' as CardSize)).toBe(PRICE_CARD_LAYOUT);
  });
});

// ============================================================================
// getMultiUpConfig
// ============================================================================

describe('getMultiUpConfig', () => {
  it('should return multi-up config for shelf', () => {
    expect(getMultiUpConfig('shelf')).toBe(SHELF_TAG_MULTI_UP);
  });

  it('should return multi-up config for price', () => {
    expect(getMultiUpConfig('price')).toBe(PRICE_CARD_MULTI_UP);
  });

  it('should return null for poster (no multi-up)', () => {
    expect(getMultiUpConfig('poster')).toBeNull();
  });
});

// ============================================================================
// Layout configuration structure validation
// ============================================================================

describe('layout configurations', () => {
  const layouts = [
    { name: 'SHELF_TAG_LAYOUT', layout: SHELF_TAG_LAYOUT },
    { name: 'PRICE_CARD_LAYOUT', layout: PRICE_CARD_LAYOUT },
    { name: 'POSTER_LAYOUT', layout: POSTER_LAYOUT },
  ];

  for (const { name, layout } of layouts) {
    describe(name, () => {
      it('should have positive margin', () => {
        expect(layout.margin).toBeGreaterThan(0);
      });

      it('should have all required fontSize properties', () => {
        expect(layout.fontSize.storeName).toBeGreaterThan(0);
        expect(layout.fontSize.modelName).toBeGreaterThan(0);
        expect(layout.fontSize.price).toBeGreaterThan(0);
        expect(layout.fontSize.specLabel).toBeGreaterThan(0);
        expect(layout.fontSize.specValue).toBeGreaterThan(0);
      });

      it('should have all required spacing properties', () => {
        expect(layout.spacing.sectionGap).toBeGreaterThan(0);
        expect(layout.spacing.lineHeight).toBeGreaterThan(0);
      });

      it('should have valid header config', () => {
        expect(layout.header.height).toBeGreaterThan(0);
        expect(layout.header.fontSize).toBeGreaterThan(0);
      });

      it('should have valid price config', () => {
        expect(layout.price.mainFontSize).toBeGreaterThan(0);
      });

      it('should have valid specs config', () => {
        expect(layout.specs.lineHeight).toBeGreaterThan(0);
      });

      it('should have non-negative maxFeatures', () => {
        expect(layout.maxFeatures).toBeGreaterThanOrEqual(0);
      });
    });
  }
});

// ============================================================================
// Multi-up configurations
// ============================================================================

describe('multi-up configurations', () => {
  it('shelf multi-up should define grid layout', () => {
    expect(SHELF_TAG_MULTI_UP.cols).toBeGreaterThan(0);
    expect(SHELF_TAG_MULTI_UP.rows).toBeGreaterThan(0);
  });

  it('price card multi-up should define grid layout', () => {
    expect(PRICE_CARD_MULTI_UP.cols).toBeGreaterThan(0);
    expect(PRICE_CARD_MULTI_UP.rows).toBeGreaterThan(0);
  });
});

// ============================================================================
// Poster spec configs
// ============================================================================

describe('poster spec configs', () => {
  it('POSTER_SPEC_CARD should have valid config', () => {
    expect(POSTER_SPEC_CARD.height).toBeGreaterThan(0);
    expect(POSTER_SPEC_CARD.gap).toBeGreaterThan(0);
    expect(POSTER_SPEC_CARD.radius).toBeGreaterThan(0);
  });

  it('POSTER_SPEC_HEADER should have valid height', () => {
    expect(POSTER_SPEC_HEADER.height).toBeGreaterThan(0);
    expect(POSTER_SPEC_HEADER.fontSize).toBeGreaterThan(0);
  });
});

// ============================================================================
// Scale verification (shelf < price < poster)
// ============================================================================

describe('layout scale ordering', () => {
  it('font sizes should scale up from shelf to price to poster', () => {
    expect(SHELF_TAG_LAYOUT.fontSize.price).toBeLessThan(PRICE_CARD_LAYOUT.fontSize.price);
    expect(PRICE_CARD_LAYOUT.fontSize.price).toBeLessThan(POSTER_LAYOUT.fontSize.price);
  });

  it('header heights should scale up from shelf to price to poster', () => {
    expect(SHELF_TAG_LAYOUT.header.height).toBeLessThan(PRICE_CARD_LAYOUT.header.height);
    expect(PRICE_CARD_LAYOUT.header.height).toBeLessThan(POSTER_LAYOUT.header.height);
  });
});
