/**
 * Layout Builders - Create CardLayout from PrebuildConfig
 *
 * These functions build declarative layout descriptions that can be
 * rendered to HTML or PDF.
 */

import {
  CardLayout,
  LayoutElement,
  LayoutBuilderContext,
  BadgeRowElement,
  SpecItem,
  InfoBarElement,
  generateElementId,
  lightenColor,
  darkenColor,
} from './layoutSchema';
import {
  CARD_SIZES,
  COMPONENT_LABELS,
  ComponentCategory,
  STOCK_STATUS_CONFIG,
  CONDITION_CONFIG,
  calculateMonthlyPayment,
  calculateDiscountPercent,
  BACKGROUND_PATTERNS,
  FONT_FAMILIES,
} from '../types';
import { findBrandIcon } from './brandDetection';
import { getLayoutConfig } from './pdfLayouts';

// ============================================================================
// BADGE BUILDERS
// ============================================================================

/** Build badges from config (condition, tier, sale, stock) */
function buildBadges(
  ctx: LayoutBuilderContext,
  includeStock: boolean = false
): BadgeRowElement['badges'] {
  const { config, colors } = ctx;
  const badges: BadgeRowElement['badges'] = [];

  if (config.condition) {
    const cc = CONDITION_CONFIG[config.condition];
    badges.push({
      text: cc.shortLabel,
      backgroundColor: cc.bgColor,
      textColor: cc.color,
    });
  }

  if (config.buildTier) {
    badges.push({
      text: config.buildTier,
      backgroundColor: colors.primary,
      textColor: '#ffffff',
    });
  }

  if (config.saleInfo?.enabled) {
    const saleText =
      config.saleInfo.originalPrice > 0 && config.price > 0
        ? `${config.saleInfo.badgeText} ${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF`
        : config.saleInfo.badgeText;
    badges.push({
      text: saleText,
      backgroundColor: '#dc2626', // red-600
      textColor: '#ffffff',
    });
  }

  if (includeStock && config.stockStatus) {
    const sc = STOCK_STATUS_CONFIG[config.stockStatus];
    badges.push({
      text: sc.label,
      backgroundColor: sc.bgColor,
      textColor: sc.color,
    });
  }

  return badges;
}

/** Build spec items from config */
function buildSpecItems(ctx: LayoutBuilderContext, specKeys: ComponentCategory[]): SpecItem[] {
  const { config, brandIcons } = ctx;
  const items: SpecItem[] = [];

  for (const key of specKeys) {
    const value = config.components[key];
    if (!value) continue;

    const brandIcon = findBrandIcon(value, brandIcons);
    items.push({
      key,
      label: COMPONENT_LABELS[key],
      value,
      brandIcon: brandIcon ? { src: brandIcon.image, name: brandIcon.name } : undefined,
    });
  }

  return items;
}

/** Build info bar items from config */
function buildInfoItems(ctx: LayoutBuilderContext): InfoBarElement['items'] {
  const { config } = ctx;
  const items: InfoBarElement['items'] = [];

  if (config.os) items.push({ label: 'OS', value: config.os });
  if (config.warranty) items.push({ label: 'WARRANTY', value: config.warranty });
  if (config.wifi) items.push({ label: 'CONNECTIVITY', value: config.wifi });

  return items;
}

// ============================================================================
// SHELF TAG LAYOUT (2" × 3")
// ============================================================================

export function buildShelfTagLayout(ctx: LayoutBuilderContext): CardLayout {
  const { config, colors, asyncData } = ctx;
  const layout = getLayoutConfig('shelf');
  const size = CARD_SIZES.shelf;
  const elements: LayoutElement[] = [];

  // Header bar
  if (config.storeName) {
    elements.push({
      id: generateElementId('header'),
      type: 'header',
      visible: true,
      text: config.storeName,
      style: {
        height: layout.header.height,
        backgroundColor: colors.accent,
        textColor: '#ffffff',
        fontSize: layout.header.fontSize,
      },
    });
  }

  // Store logo
  if (config.storeLogo) {
    elements.push({
      id: generateElementId('logo'),
      type: 'image',
      visible: true,
      src: config.storeLogo,
      alt: 'Store logo',
      size: { width: size.width - layout.margin * 2, height: layout.logoMaxHeight },
      objectFit: 'contain',
    });
  }

  // Model name
  elements.push({
    id: generateElementId('model'),
    type: 'text',
    visible: true,
    text: config.modelName || 'PC Build',
    style: {
      fontSize: layout.fontSize.modelName,
      fontWeight: 'bold',
      color: '#000000',
      align: 'center',
    },
    maxLines: 2,
  });

  // Badges
  const badges = buildBadges(ctx, layout.includeStockBadge);
  if (badges.length > 0) {
    elements.push({
      id: generateElementId('badges'),
      type: 'badge-row',
      visible: true,
      badges,
      style: {
        fontSize: layout.badge.fontSize,
        paddingX: layout.badge.paddingX,
        paddingY: layout.badge.paddingY,
        borderRadius: layout.badge.radius,
        spacing: layout.badge.spacing,
      },
      align: 'center',
    });
  }

  // Price section
  elements.push({
    id: generateElementId('price'),
    type: 'price',
    visible: true,
    currentPrice: config.price,
    originalPrice: config.saleInfo?.enabled ? config.saleInfo.originalPrice : undefined,
    showStrikethrough: config.saleInfo?.enabled && config.saleInfo.originalPrice > 0,
    style: {
      mainFontSize: layout.price.mainFontSize,
      strikeFontSize: layout.price.strikeFontSize,
      priceColor: colors.priceColor,
      strikeColor: '#9ca3af',
      showBox: layout.price.showBox,
    },
  });

  // Key specs
  const specKeys: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  const specs = buildSpecItems(ctx, specKeys);
  if (specs.length > 0) {
    elements.push({
      id: generateElementId('specs'),
      type: 'specs',
      visible: true,
      specs,
      layout: 'single-column',
      style: {
        labelFontSize: layout.fontSize.specLabel,
        valueFontSize: layout.fontSize.specValue,
        labelColor: colors.primary,
        valueColor: '#3c3c3c',
        iconSize: layout.specs.iconSize,
        lineHeight: layout.specs.lineHeight,
      },
    });
  }

  // Barcode
  if (asyncData?.barcodeImage) {
    elements.push({
      id: generateElementId('barcode'),
      type: 'barcode',
      visible: true,
      value: config.sku,
      size: { width: layout.footer.barcodeWidth, height: layout.footer.barcodeHeight },
    });
  }

  // SKU
  if (config.sku) {
    elements.push({
      id: generateElementId('sku'),
      type: 'sku',
      visible: true,
      value: config.sku,
      style: {
        fontSize: layout.footer.skuFontSize,
        fontWeight: 'normal',
        color: '#9ca3af',
        align: 'center',
      },
    });
  }

  return {
    cardSize: 'shelf',
    dimensions: { width: size.width, height: size.height },
    colors,
    background: {
      color: '#ffffff',
      pattern: BACKGROUND_PATTERNS[config.visualSettings.backgroundPattern].value,
    },
    fontFamily: FONT_FAMILIES[config.visualSettings.fontFamily].value,
    elements,
  };
}

// ============================================================================
// PRICE CARD LAYOUT (4" × 6")
// ============================================================================

export function buildPriceCardLayout(ctx: LayoutBuilderContext): CardLayout {
  const { config, colors, asyncData } = ctx;
  const layout = getLayoutConfig('price');
  const size = CARD_SIZES.price;
  const elements: LayoutElement[] = [];

  // Header bar with accent
  if (config.storeName) {
    elements.push({
      id: generateElementId('header'),
      type: 'header',
      visible: true,
      text: config.storeName,
      style: {
        height: layout.header.height,
        backgroundColor: colors.accent,
        textColor: '#ffffff',
        fontSize: layout.header.fontSize,
        accentHeight: layout.header.accentHeight,
        accentColor: colors.primary,
      },
    });
  }

  // Store logo
  if (config.storeLogo) {
    elements.push({
      id: generateElementId('logo'),
      type: 'image',
      visible: true,
      src: config.storeLogo,
      alt: 'Store logo',
      size: { width: size.width - layout.margin * 2, height: layout.logoMaxHeight },
      objectFit: 'contain',
    });
  }

  // Model name
  elements.push({
    id: generateElementId('model'),
    type: 'text',
    visible: true,
    text: config.modelName || 'PC Build',
    style: {
      fontSize: layout.fontSize.modelName,
      fontWeight: 'bold',
      color: darkenColor(colors.accent, 0.2),
      align: 'center',
    },
    maxLines: 2,
  });

  // Badges (include stock)
  const badges = buildBadges(ctx, layout.includeStockBadge);
  if (badges.length > 0) {
    elements.push({
      id: generateElementId('badges'),
      type: 'badge-row',
      visible: true,
      badges,
      style: {
        fontSize: layout.badge.fontSize,
        paddingX: layout.badge.paddingX,
        paddingY: layout.badge.paddingY,
        borderRadius: layout.badge.radius,
        spacing: layout.badge.spacing,
      },
      align: 'center',
    });
  }

  // Price section with box
  elements.push({
    id: generateElementId('price'),
    type: 'price',
    visible: true,
    currentPrice: config.price,
    originalPrice: config.saleInfo?.enabled ? config.saleInfo.originalPrice : undefined,
    showStrikethrough: config.saleInfo?.enabled && config.saleInfo.originalPrice > 0,
    style: {
      mainFontSize: layout.price.mainFontSize,
      strikeFontSize: layout.price.strikeFontSize,
      priceColor: colors.priceColor,
      strikeColor: '#9ca3af',
      showBox: layout.price.showBox,
      boxColor: lightenColor(colors.priceColor, 0.92),
      boxRadius: layout.price.boxRadius,
      boxHeight: layout.price.boxHeight,
    },
  });

  // Financing info
  if (config.financingInfo?.enabled && config.price > 0) {
    const monthly = calculateMonthlyPayment(
      config.price,
      config.financingInfo.months,
      config.financingInfo.apr
    );
    if (monthly) {
      elements.push({
        id: generateElementId('financing'),
        type: 'financing',
        visible: true,
        monthlyAmount: monthly,
        months: config.financingInfo.months,
        apr: config.financingInfo.apr,
        showApr: false,
        style: {
          fontSize: layout.fontSize.financing,
          fontWeight: 'normal',
          color: '#6b7280',
          align: 'center',
        },
      });
    }
  }

  // Feature badges
  if (config.features.length > 0 && layout.maxFeatures > 0) {
    const featureBadges = config.features.slice(0, layout.maxFeatures).map((f) => ({
      text: f,
      backgroundColor: lightenColor(colors.primary, 0.15),
      textColor: colors.primary,
    }));
    elements.push({
      id: generateElementId('features'),
      type: 'badge-row',
      visible: true,
      badges: featureBadges,
      style: {
        fontSize: layout.featureBadge.fontSize,
        paddingX: layout.featureBadge.paddingX,
        paddingY: layout.featureBadge.paddingY,
        borderRadius: layout.featureBadge.radius,
        spacing: layout.featureBadge.spacing,
      },
      align: 'center',
    });
  }

  // Specs section (two columns)
  const allSpecs: ComponentCategory[] = [
    'cpu',
    'gpu',
    'ram',
    'storage',
    'motherboard',
    'psu',
    'case',
    'cooling',
  ];
  const specs = buildSpecItems(ctx, allSpecs);
  if (specs.length > 0) {
    elements.push({
      id: generateElementId('specs'),
      type: 'specs',
      visible: true,
      specs,
      layout: 'two-column',
      style: {
        labelFontSize: layout.fontSize.specLabel,
        valueFontSize: layout.fontSize.specValue,
        labelColor: colors.primary,
        valueColor: '#323232',
        iconSize: layout.specs.iconSize,
        lineHeight: layout.specs.lineHeight,
        backgroundColor: '#fafafa',
        accentWidth: layout.specs.accentWidth,
        accentColor: colors.primary,
        borderRadius: 0.08,
        padding: layout.specs.padding,
      },
    });
  }

  // Info bar
  const infoItems = buildInfoItems(ctx);
  if (infoItems.length > 0) {
    elements.push({
      id: generateElementId('infobar'),
      type: 'info-bar',
      visible: true,
      items: infoItems,
      style: {
        height: layout.infoBar.height,
        backgroundColor: lightenColor(colors.primary, 0.9),
        labelFontSize: layout.infoBar.labelFontSize,
        valueFontSize: layout.infoBar.valueFontSize,
        labelColor: colors.primary,
        valueColor: '#3c3c3c',
        borderRadius: layout.infoBar.radius,
      },
    });
  }

  // Product image
  if (config.visualSettings.productImage) {
    elements.push({
      id: generateElementId('product-image'),
      type: 'image',
      visible: true,
      src: config.visualSettings.productImage,
      alt: 'Product',
      size: { width: layout.media.imageSize, height: layout.media.imageSize },
      objectFit: 'contain',
    });
  }

  // QR code
  if (asyncData?.qrCodeImage && config.visualSettings.showQrCode) {
    elements.push({
      id: generateElementId('qrcode'),
      type: 'qrcode',
      visible: true,
      url: config.visualSettings.qrCodeUrl,
      size: layout.media.qrSize,
    });
  }

  // Barcode
  if (asyncData?.barcodeImage) {
    elements.push({
      id: generateElementId('barcode'),
      type: 'barcode',
      visible: true,
      value: config.sku,
      size: { width: layout.footer.barcodeWidth, height: layout.footer.barcodeHeight },
    });
  }

  // SKU
  if (config.sku) {
    elements.push({
      id: generateElementId('sku'),
      type: 'sku',
      visible: true,
      value: config.sku,
      style: {
        fontSize: layout.footer.skuFontSize,
        fontWeight: 'normal',
        color: '#9ca3af',
        align: 'center',
      },
    });
  }

  // Footer accent
  elements.push({
    id: generateElementId('footer-accent'),
    type: 'footer-accent',
    visible: true,
    style: {
      height: layout.footer.accentHeight,
      primaryColor: colors.primary,
    },
  });

  return {
    cardSize: 'price',
    dimensions: { width: size.width, height: size.height },
    colors,
    background: {
      color: '#ffffff',
      pattern: BACKGROUND_PATTERNS[config.visualSettings.backgroundPattern].value,
    },
    fontFamily: FONT_FAMILIES[config.visualSettings.fontFamily].value,
    elements,
  };
}

// ============================================================================
// POSTER LAYOUT (8.5" × 11")
// ============================================================================

export function buildPosterLayout(ctx: LayoutBuilderContext): CardLayout {
  const { config, colors, asyncData } = ctx;
  const layout = getLayoutConfig('poster');
  const size = CARD_SIZES.poster;
  const elements: LayoutElement[] = [];

  // Header bar with accent
  if (config.storeName) {
    elements.push({
      id: generateElementId('header'),
      type: 'header',
      visible: true,
      text: config.storeName,
      style: {
        height: layout.header.height,
        backgroundColor: colors.accent,
        textColor: '#ffffff',
        fontSize: layout.header.fontSize,
        accentHeight: layout.header.accentHeight,
        accentColor: colors.primary,
      },
    });
  }

  // Store logo
  if (config.storeLogo) {
    elements.push({
      id: generateElementId('logo'),
      type: 'image',
      visible: true,
      src: config.storeLogo,
      alt: 'Store logo',
      size: { width: size.width - layout.margin * 2, height: layout.logoMaxHeight },
      objectFit: 'contain',
    });
  }

  // Badges (include stock)
  const badges = buildBadges(ctx, layout.includeStockBadge);
  if (badges.length > 0) {
    elements.push({
      id: generateElementId('badges'),
      type: 'badge-row',
      visible: true,
      badges,
      style: {
        fontSize: layout.badge.fontSize,
        paddingX: layout.badge.paddingX,
        paddingY: layout.badge.paddingY,
        borderRadius: layout.badge.radius,
        spacing: layout.badge.spacing,
      },
      align: 'center',
    });
  }

  // Model name
  elements.push({
    id: generateElementId('model'),
    type: 'text',
    visible: true,
    text: config.modelName || 'PC Build',
    style: {
      fontSize: layout.fontSize.modelName,
      fontWeight: 'bold',
      color: darkenColor(colors.accent, 0.1),
      align: 'center',
    },
    maxLines: 2,
  });

  // Price section with decorated box
  elements.push({
    id: generateElementId('price'),
    type: 'price',
    visible: true,
    currentPrice: config.price,
    originalPrice: config.saleInfo?.enabled ? config.saleInfo.originalPrice : undefined,
    showStrikethrough: config.saleInfo?.enabled && config.saleInfo.originalPrice > 0,
    style: {
      mainFontSize: layout.price.mainFontSize,
      strikeFontSize: layout.price.strikeFontSize,
      priceColor: colors.priceColor,
      strikeColor: '#9ca3af',
      showBox: layout.price.showBox,
      boxColor: lightenColor(colors.priceColor, 0.92),
      boxRadius: layout.price.boxRadius,
      boxHeight: layout.price.boxHeight,
    },
  });

  // Financing info (with APR)
  if (config.financingInfo?.enabled && config.price > 0) {
    const monthly = calculateMonthlyPayment(
      config.price,
      config.financingInfo.months,
      config.financingInfo.apr
    );
    if (monthly) {
      elements.push({
        id: generateElementId('financing'),
        type: 'financing',
        visible: true,
        monthlyAmount: monthly,
        months: config.financingInfo.months,
        apr: config.financingInfo.apr,
        showApr: config.financingInfo.apr > 0,
        style: {
          fontSize: layout.fontSize.financing,
          fontWeight: 'normal',
          color: '#6b7280',
          align: 'center',
        },
      });
    }
  }

  // Specifications header
  elements.push({
    id: generateElementId('specs-header'),
    type: 'text',
    visible: true,
    text: 'SPECIFICATIONS',
    style: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
    },
  });

  // Specs section (two columns, card style)
  const allSpecs: ComponentCategory[] = [
    'cpu',
    'gpu',
    'ram',
    'storage',
    'motherboard',
    'psu',
    'case',
    'cooling',
  ];
  const specs = buildSpecItems(ctx, allSpecs);
  if (specs.length > 0) {
    elements.push({
      id: generateElementId('specs'),
      type: 'specs',
      visible: true,
      specs,
      layout: 'two-column',
      style: {
        labelFontSize: layout.fontSize.specLabel,
        valueFontSize: layout.fontSize.specValue,
        labelColor: colors.primary,
        valueColor: '#282828',
        iconSize: layout.specs.iconSize,
        lineHeight: layout.specs.lineHeight,
        backgroundColor: '#f8f9fa',
        accentWidth: layout.specs.accentWidth,
        accentColor: colors.primary,
        borderRadius: 0.06,
        padding: layout.specs.padding,
      },
    });
  }

  // Info bar
  const infoItems = buildInfoItems(ctx);
  if (infoItems.length > 0) {
    elements.push({
      id: generateElementId('infobar'),
      type: 'info-bar',
      visible: true,
      items: infoItems,
      style: {
        height: layout.infoBar.height,
        backgroundColor: lightenColor(colors.primary, 0.9),
        labelFontSize: layout.infoBar.labelFontSize,
        valueFontSize: layout.infoBar.valueFontSize,
        labelColor: colors.primary,
        valueColor: '#3c3c3c',
        borderRadius: layout.infoBar.radius,
      },
    });
  }

  // Description
  if (config.description) {
    elements.push({
      id: generateElementId('description'),
      type: 'text',
      visible: true,
      text: config.description,
      style: {
        fontSize: layout.fontSize.description,
        fontWeight: 'normal',
        fontStyle: 'italic',
        color: '#505050',
        align: 'center',
      },
      maxLines: 2,
    });
  }

  // Feature badges
  if (config.features.length > 0 && layout.maxFeatures > 0) {
    const featureBadges = config.features.slice(0, layout.maxFeatures).map((f) => ({
      text: f,
      backgroundColor: colors.primary,
      textColor: '#ffffff',
    }));
    elements.push({
      id: generateElementId('features'),
      type: 'badge-row',
      visible: true,
      badges: featureBadges,
      style: {
        fontSize: layout.featureBadge.fontSize,
        paddingX: layout.featureBadge.paddingX,
        paddingY: layout.featureBadge.paddingY,
        borderRadius: layout.featureBadge.radius,
        spacing: layout.featureBadge.spacing,
      },
      align: 'center',
    });
  }

  // QR code
  if (asyncData?.qrCodeImage && config.visualSettings.showQrCode) {
    elements.push({
      id: generateElementId('qrcode'),
      type: 'qrcode',
      visible: true,
      url: config.visualSettings.qrCodeUrl,
      size: layout.media.qrSize,
    });
  }

  // Barcode
  if (asyncData?.barcodeImage) {
    elements.push({
      id: generateElementId('barcode'),
      type: 'barcode',
      visible: true,
      value: config.sku,
      size: { width: layout.footer.barcodeWidth, height: layout.footer.barcodeHeight },
    });
  }

  // SKU
  if (config.sku) {
    elements.push({
      id: generateElementId('sku'),
      type: 'sku',
      visible: true,
      value: config.sku,
      style: {
        fontSize: layout.footer.skuFontSize,
        fontWeight: 'normal',
        color: '#646464',
        align: 'left',
      },
    });
  }

  // Footer accent
  elements.push({
    id: generateElementId('footer-accent'),
    type: 'footer-accent',
    visible: true,
    style: {
      height: layout.footer.accentHeight,
      primaryColor: colors.accent,
      accentColor: colors.primary,
      accentHeight: layout.footer.primaryStripeHeight,
    },
  });

  return {
    cardSize: 'poster',
    dimensions: { width: size.width, height: size.height },
    colors,
    background: {
      color: '#ffffff',
      pattern: BACKGROUND_PATTERNS[config.visualSettings.backgroundPattern].value,
    },
    fontFamily: FONT_FAMILIES[config.visualSettings.fontFamily].value,
    elements,
  };
}

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/** Build layout for any card size */
export function buildCardLayout(ctx: LayoutBuilderContext): CardLayout {
  switch (ctx.cardSize) {
    case 'shelf':
      return buildShelfTagLayout(ctx);
    case 'price':
      return buildPriceCardLayout(ctx);
    case 'poster':
      return buildPosterLayout(ctx);
    default:
      return buildPriceCardLayout(ctx);
  }
}
