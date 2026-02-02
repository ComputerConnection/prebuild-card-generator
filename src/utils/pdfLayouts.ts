/**
 * PDF Layout Configuration System
 *
 * This file contains all layout configurations for PDF generation.
 * All measurements are in inches unless otherwise noted.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Font size configuration for various text elements */
export interface FontSizeConfig {
  /** Store name in header */
  storeName: number;
  /** Model/product name */
  modelName: number;
  /** Main price display */
  price: number;
  /** Strike-through price (sale) */
  strikePrice: number;
  /** Specification labels (CPU, GPU, etc.) */
  specLabel: number;
  /** Specification values */
  specValue: number;
  /** SKU/barcode text */
  sku: number;
  /** Financing info text */
  financing: number;
  /** Feature badge text */
  featureBadge: number;
  /** Description text */
  description: number;
  /** Info bar labels (OS, Warranty) */
  infoBarLabel: number;
  /** Info bar values */
  infoBarValue: number;
}

/** Spacing configuration for layout elements */
export interface SpacingConfig {
  /** Gap between major sections */
  sectionGap: number;
  /** Line height multiplier for text */
  lineHeight: number;
  /** Gap between badges */
  badgeGap: number;
  /** Padding after logo */
  afterLogo: number;
  /** Padding after model name */
  afterModelName: number;
  /** Padding after badges row */
  afterBadges: number;
  /** Padding after price section */
  afterPrice: number;
}

/** Badge styling configuration */
export interface BadgeConfig {
  /** Font size for badge text */
  fontSize: number;
  /** Horizontal padding inside badge */
  paddingX: number;
  /** Vertical padding inside badge */
  paddingY: number;
  /** Corner radius */
  radius: number;
  /** Gap between badges */
  spacing: number;
}

/** Header bar configuration */
export interface HeaderConfig {
  /** Total header height */
  height: number;
  /** Font size for store name */
  fontSize: number;
  /** Height of accent stripe at bottom (0 for none) */
  accentHeight: number;
}

/** Price section configuration */
export interface PriceConfig {
  /** Main price font size */
  mainFontSize: number;
  /** Strike-through price font size */
  strikeFontSize: number;
  /** Whether to show background box */
  showBox: boolean;
  /** Height of price box (if showBox is true) */
  boxHeight: number;
  /** Corner radius of price box */
  boxRadius: number;
}

/** Specifications section configuration */
export interface SpecsConfig {
  /** Brand icon size */
  iconSize: number;
  /** Gap between columns */
  columnGap: number;
  /** Height per spec line */
  lineHeight: number;
  /** Total section height (for boxed specs) */
  sectionHeight: number;
  /** Left accent bar width */
  accentWidth: number;
  /** Inner padding */
  padding: number;
}

/** Info bar configuration (OS, Warranty, etc.) */
export interface InfoBarConfig {
  /** Bar height */
  height: number;
  /** Label font size */
  labelFontSize: number;
  /** Value font size */
  valueFontSize: number;
  /** Corner radius */
  radius: number;
}

/** Footer configuration */
export interface FooterConfig {
  /** Barcode width */
  barcodeWidth: number;
  /** Barcode height */
  barcodeHeight: number;
  /** SKU text font size */
  skuFontSize: number;
  /** Footer Y offset from bottom */
  offsetFromBottom: number;
  /** Bottom accent bar height */
  accentHeight: number;
  /** Primary stripe height within accent */
  primaryStripeHeight: number;
}

/** QR code and product image configuration */
export interface MediaConfig {
  /** QR code size */
  qrSize: number;
  /** Product image max size */
  imageSize: number;
}

/** Complete layout configuration for a card type */
export interface LayoutConfig {
  /** Card margin */
  margin: number;
  /** Font sizes for all text elements */
  fontSize: FontSizeConfig;
  /** Spacing between elements */
  spacing: SpacingConfig;
  /** Main badge styling */
  badge: BadgeConfig;
  /** Feature badge styling (may differ from main badges) */
  featureBadge: BadgeConfig;
  /** Header bar configuration */
  header: HeaderConfig;
  /** Price section configuration */
  price: PriceConfig;
  /** Specifications section configuration */
  specs: SpecsConfig;
  /** Info bar configuration */
  infoBar: InfoBarConfig;
  /** Footer configuration */
  footer: FooterConfig;
  /** Media (QR/images) configuration */
  media: MediaConfig;
  /** Logo max height */
  logoMaxHeight: number;
  /** Whether to include stock status in badges */
  includeStockBadge: boolean;
  /** Maximum number of features to display */
  maxFeatures: number;
  /** Border/line width */
  borderWidth: number;
}

// ============================================================================
// SHELF TAG LAYOUT (2" × 3")
// Compact retail tag for shelf display
// ============================================================================

export const SHELF_TAG_LAYOUT: LayoutConfig = {
  margin: 0.08,

  fontSize: {
    storeName: 7,
    modelName: 9,
    price: 18,
    strikePrice: 9,
    specLabel: 5.5,
    specValue: 5.5,
    sku: 4.5,
    financing: 6,
    featureBadge: 5,
    description: 5,
    infoBarLabel: 4,
    infoBarValue: 5,
  },

  spacing: {
    sectionGap: 0.08,
    lineHeight: 0.12,
    badgeGap: 0.04,
    afterLogo: 0.06,
    afterModelName: 0.06,
    afterBadges: 0.06,
    afterPrice: 0.04,
  },

  badge: {
    fontSize: 5,
    paddingX: 0.05,
    paddingY: 0.03,
    radius: 0.03,
    spacing: 0.04,
  },

  featureBadge: {
    fontSize: 5,
    paddingX: 0.04,
    paddingY: 0.02,
    radius: 0.02,
    spacing: 0.03,
  },

  header: {
    height: 0.35,
    fontSize: 7,
    accentHeight: 0,
  },

  price: {
    mainFontSize: 18,
    strikeFontSize: 9,
    showBox: false,
    boxHeight: 0,
    boxRadius: 0.04,
  },

  specs: {
    iconSize: 0.12,
    columnGap: 0.06,
    lineHeight: 0.12,
    sectionHeight: 0,
    accentWidth: 0,
    padding: 0,
  },

  infoBar: {
    height: 0,
    labelFontSize: 4,
    valueFontSize: 5,
    radius: 0.03,
  },

  footer: {
    barcodeWidth: 1.5, // width - 0.5
    barcodeHeight: 0.1,
    skuFontSize: 4.5,
    offsetFromBottom: 0.17,
    accentHeight: 0,
    primaryStripeHeight: 0,
  },

  media: {
    qrSize: 0.4,
    imageSize: 0.4,
  },

  logoMaxHeight: 0.3,
  includeStockBadge: false,
  maxFeatures: 0,
  borderWidth: 0.01,
};

// ============================================================================
// PRICE CARD LAYOUT (4" × 6")
// Medium display card for product stands
// ============================================================================

export const PRICE_CARD_LAYOUT: LayoutConfig = {
  margin: 0.15,

  fontSize: {
    storeName: 11,
    modelName: 14,
    price: 32,
    strikePrice: 14,
    specLabel: 7,
    specValue: 7,
    sku: 6,
    financing: 8,
    featureBadge: 6,
    description: 7,
    infoBarLabel: 5,
    infoBarValue: 6,
  },

  spacing: {
    sectionGap: 0.12,
    lineHeight: 0.18,
    badgeGap: 0.06,
    afterLogo: 0.08,
    afterModelName: 0.06,
    afterBadges: 0.06,
    afterPrice: 0.08,
  },

  badge: {
    fontSize: 7,
    paddingX: 0.08,
    paddingY: 0.04,
    radius: 0.04,
    spacing: 0.06,
  },

  featureBadge: {
    fontSize: 6,
    paddingX: 0.06,
    paddingY: 0.03,
    radius: 0.03,
    spacing: 0.04,
  },

  header: {
    height: 0.45,
    fontSize: 11,
    accentHeight: 0.04,
  },

  price: {
    mainFontSize: 32,
    strikeFontSize: 14,
    showBox: true,
    boxHeight: 0.5,
    boxRadius: 0.06,
  },

  specs: {
    iconSize: 0.14,
    columnGap: 0.06,
    lineHeight: 0.36,
    sectionHeight: 1.6,
    accentWidth: 0.05,
    padding: 0.08,
  },

  infoBar: {
    height: 0.35,
    labelFontSize: 5,
    valueFontSize: 6,
    radius: 0.05,
  },

  footer: {
    barcodeWidth: 2.8, // width - 1.2
    barcodeHeight: 0.12,
    skuFontSize: 6,
    offsetFromBottom: 0.18,
    accentHeight: 0.04,
    primaryStripeHeight: 0.04,
  },

  media: {
    qrSize: 0.55,
    imageSize: 0.55,
  },

  logoMaxHeight: 0.45,
  includeStockBadge: true,
  maxFeatures: 4,
  borderWidth: 0.01,
};

// ============================================================================
// POSTER LAYOUT (8.5" × 11")
// Full page display for prominent product showcasing
// ============================================================================

export const POSTER_LAYOUT: LayoutConfig = {
  margin: 0.35,

  fontSize: {
    storeName: 20,
    modelName: 32,
    price: 56,
    strikePrice: 20,
    specLabel: 11,
    specValue: 13,
    sku: 10,
    financing: 12,
    featureBadge: 9,
    description: 11,
    infoBarLabel: 10,
    infoBarValue: 12,
  },

  spacing: {
    sectionGap: 0.2,
    lineHeight: 0.4,
    badgeGap: 0.1,
    afterLogo: 0.15,
    afterModelName: 0.15,
    afterBadges: 0.1,
    afterPrice: 0.1,
  },

  badge: {
    fontSize: 12,
    paddingX: 0.12,
    paddingY: 0.06,
    radius: 0.06,
    spacing: 0.1,
  },

  featureBadge: {
    fontSize: 9,
    paddingX: 0.08,
    paddingY: 0.04,
    radius: 0.04,
    spacing: 0.06,
  },

  header: {
    height: 0.7,
    fontSize: 20,
    accentHeight: 0.05,
  },

  price: {
    mainFontSize: 56,
    strikeFontSize: 20,
    showBox: true,
    boxHeight: 0.75,
    boxRadius: 0.08,
  },

  specs: {
    iconSize: 0.28,
    columnGap: 0.2,
    lineHeight: 0.7,
    sectionHeight: 3.4, // 4 rows × (0.7 + 0.15)
    accentWidth: 0.05,
    padding: 0.15,
  },

  infoBar: {
    height: 0.6,
    labelFontSize: 10,
    valueFontSize: 12,
    radius: 0.06,
  },

  footer: {
    barcodeWidth: 1.8,
    barcodeHeight: 0.3,
    skuFontSize: 10,
    offsetFromBottom: 0.55,
    accentHeight: 0.1,
    primaryStripeHeight: 0.03,
  },

  media: {
    qrSize: 0.6,
    imageSize: 0.8,
  },

  logoMaxHeight: 0.6,
  includeStockBadge: true,
  maxFeatures: 6,
  borderWidth: 0.01,
};

// ============================================================================
// POSTER SPEC CARD LAYOUT (for spec cards within poster)
// ============================================================================

export interface SpecCardConfig {
  /** Card height */
  height: number;
  /** Gap between cards */
  gap: number;
  /** Corner radius */
  radius: number;
  /** Left accent width */
  accentWidth: number;
  /** Content padding from left edge */
  contentPadding: number;
  /** Label Y offset within card */
  labelY: number;
  /** Icon Y offset within card */
  iconY: number;
  /** Value Y offset within card */
  valueY: number;
}

export const POSTER_SPEC_CARD: SpecCardConfig = {
  height: 0.7,
  gap: 0.15,
  radius: 0.06,
  accentWidth: 0.05,
  contentPadding: 0.15,
  labelY: 0.22,
  iconY: 0.32,
  valueY: 0.5,
};

// ============================================================================
// SPEC SECTION HEADER (for poster)
// ============================================================================

export interface SpecHeaderConfig {
  /** Header height */
  height: number;
  /** Font size for "SPECIFICATIONS" title */
  fontSize: number;
  /** Accent stripe height */
  accentHeight: number;
  /** Title Y offset */
  titleY: number;
}

export const POSTER_SPEC_HEADER: SpecHeaderConfig = {
  height: 0.4,
  fontSize: 18,
  accentHeight: 0.04,
  titleY: 0.26,
};

// ============================================================================
// MULTI-UP PRINTING CONFIGURATION
// ============================================================================

export interface MultiUpConfig {
  /** Page width */
  pageWidth: number;
  /** Page height */
  pageHeight: number;
  /** Number of columns */
  cols: number;
  /** Number of rows */
  rows: number;
  /** Crop mark length */
  cropMarkLength: number;
  /** Crop mark gap from edge */
  cropMarkGap: number;
  /** Crop mark line width */
  cropMarkWidth: number;
  /** Footer text font size */
  footerFontSize: number;
  /** Footer Y position from bottom */
  footerY: number;
}

export const SHELF_TAG_MULTI_UP: MultiUpConfig = {
  pageWidth: 8.5,
  pageHeight: 11,
  cols: 4,
  rows: 3,
  cropMarkLength: 0.1,
  cropMarkGap: 0.02,
  cropMarkWidth: 0.005,
  footerFontSize: 6,
  footerY: 0.15,
};

export const PRICE_CARD_MULTI_UP: MultiUpConfig = {
  pageWidth: 8.5,
  pageHeight: 11,
  cols: 2,
  rows: 1,
  cropMarkLength: 0.15,
  cropMarkGap: 0.03,
  cropMarkWidth: 0.005,
  footerFontSize: 6,
  footerY: 0.15,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

import type { CardSize } from '../types';

/**
 * Get layout configuration for a given card size
 */
export function getLayoutConfig(cardSize: CardSize): LayoutConfig {
  switch (cardSize) {
    case 'shelf':
      return SHELF_TAG_LAYOUT;
    case 'price':
      return PRICE_CARD_LAYOUT;
    case 'poster':
      return POSTER_LAYOUT;
    default:
      return PRICE_CARD_LAYOUT;
  }
}

/**
 * Get multi-up configuration for a given card size
 */
export function getMultiUpConfig(cardSize: CardSize): MultiUpConfig | null {
  switch (cardSize) {
    case 'shelf':
      return SHELF_TAG_MULTI_UP;
    case 'price':
      return PRICE_CARD_MULTI_UP;
    default:
      return null;
  }
}
