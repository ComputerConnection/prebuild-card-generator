import { jsPDF } from 'jspdf';
import { PrebuildConfig, CardSize, CARD_SIZES, COMPONENT_LABELS, ComponentCategory, getThemeColors, BrandIcon, STOCK_STATUS_CONFIG, CONDITION_CONFIG, calculateMonthlyPayment, calculateDiscountPercent, formatPrice, ThemeColors } from '../types';
import { findBrandIcon } from './brandDetection';
import { generateQRCodeDataUrl } from './qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from './barcode';
import { logger } from './logger';
import {
  getLayoutConfig,
  getMultiUpConfig,
  POSTER_SPEC_CARD,
  POSTER_SPEC_HEADER,
} from './pdfLayouts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RGB = [number, number, number];

interface Badge {
  text: string;
  bg: RGB;
  fg: RGB;
}

interface BadgeRowOptions {
  fontSize: number;
  paddingX: number;
  paddingY: number;
  radius: number;
  spacing: number;
}

interface PriceSectionOptions {
  mainFontSize: number;
  strikeFontSize: number;
  showBox: boolean;
  boxHeight?: number;
}

interface HeaderBarOptions {
  height: number;
  fontSize: number;
  accentHeight?: number;
}

// ============================================================================
// COLOR UTILITY FUNCTIONS
// ============================================================================

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function lightenColor(hex: string, percent: number): RGB {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r + (255 - r) * percent),
    Math.round(g + (255 - g) * percent),
    Math.round(b + (255 - b) * percent),
  ];
}

function darkenColor(hex: string, percent: number): RGB {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r * (1 - percent)),
    Math.round(g * (1 - percent)),
    Math.round(b * (1 - percent)),
  ];
}

// ============================================================================
// IMAGE HELPERS
// ============================================================================

function addImageToPdf(
  doc: jsPDF,
  src: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  center: boolean = true,
  imageType: string = 'image'
): Promise<{ width: number; height: number; success: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }

      const finalX = center ? x + (maxWidth - width) / 2 : x;
      doc.addImage(img, 'PNG', finalX, y, width, height);
      resolve({ width, height, success: true });
    };
    img.onerror = (event) => {
      logger.warn('PDFGenerator', `Failed to load ${imageType}`, { src: src.substring(0, 100), event });
      resolve({ width: 0, height: 0, success: false });
    };
    img.src = src;
  });
}

async function addQrCodeToPdf(doc: jsPDF, url: string, x: number, y: number, size: number): Promise<boolean> {
  if (!url) {
    logger.debug('PDFGenerator', 'Skipping QR code - no URL provided');
    return false;
  }
  try {
    const qrDataUrl = await generateQRCodeDataUrl(url, 200);
    if (!qrDataUrl) {
      logger.warn('PDFGenerator', 'QR code generation returned empty result', { url });
      return false;
    }
    const result = await addImageToPdf(doc, qrDataUrl, x, y, size, size, false, 'QR code');
    return result.success;
  } catch (error) {
    logger.error('PDFGenerator', 'Failed to generate QR code', error);
    return false;
  }
}

async function addBarcodeToPdf(doc: jsPDF, sku: string, x: number, y: number, width: number, height: number): Promise<boolean> {
  if (!sku) {
    logger.debug('PDFGenerator', 'Skipping barcode - no SKU provided');
    return false;
  }
  if (!isValidBarcode(sku)) {
    logger.warn('PDFGenerator', 'Invalid barcode format', { sku });
    return false;
  }
  try {
    const barcodeDataUrl = generateBarcodeDataUrl(sku, { height: 50, displayValue: false });
    if (!barcodeDataUrl) {
      logger.warn('PDFGenerator', 'Barcode generation returned empty result', { sku });
      return false;
    }
    return await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        doc.addImage(img, 'PNG', x, y, width, height);
        resolve(true);
      };
      img.onerror = (event) => {
        logger.warn('PDFGenerator', 'Failed to load barcode image', { sku, event });
        resolve(false);
      };
      img.src = barcodeDataUrl;
    });
  } catch (error) {
    logger.error('PDFGenerator', 'Failed to generate barcode', error);
    return false;
  }
}

// ============================================================================
// SHARED RENDERING HELPERS
// ============================================================================

/**
 * Draw a single badge and return its width
 */
function drawBadge(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  bgColor: RGB,
  textColor: RGB = [255, 255, 255],
  fontSize: number = 7,
  paddingX: number = 0.08,
  paddingY: number = 0.05,
  radius: number = 0.04
): number {
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(text);
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = fontSize * 0.02 + paddingY * 2;

  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y, badgeWidth, badgeHeight, radius, radius, 'F');

  doc.setTextColor(...textColor);
  doc.text(text, x + paddingX, y + badgeHeight - paddingY);

  return badgeWidth;
}

/**
 * Build badge array from config
 */
function buildBadgesFromConfig(config: PrebuildConfig, colors: ThemeColors, includeStock: boolean = false): Badge[] {
  const badges: Badge[] = [];

  if (config.condition) {
    const cc = CONDITION_CONFIG[config.condition];
    badges.push({ text: cc.shortLabel, bg: hexToRgb(cc.bgColor), fg: hexToRgb(cc.color) });
  }
  if (config.buildTier) {
    badges.push({ text: config.buildTier, bg: hexToRgb(colors.primary), fg: [255, 255, 255] });
  }
  if (config.saleInfo?.enabled) {
    const saleText = config.saleInfo.originalPrice > 0 && config.price > 0
      ? `${config.saleInfo.badgeText} ${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF`
      : config.saleInfo.badgeText;
    badges.push({ text: saleText, bg: [220, 38, 38], fg: [255, 255, 255] });
  }
  if (includeStock && config.stockStatus) {
    const sc = STOCK_STATUS_CONFIG[config.stockStatus];
    badges.push({ text: sc.label, bg: hexToRgb(sc.bgColor), fg: hexToRgb(sc.color) });
  }

  return badges;
}

/**
 * Render a row of badges centered at given position
 */
function renderBadgeRow(
  doc: jsPDF,
  badges: Badge[],
  centerX: number,
  y: number,
  options: BadgeRowOptions
): number {
  if (badges.length === 0) return y;

  const { fontSize, paddingX, paddingY, radius, spacing } = options;

  doc.setFontSize(fontSize);
  const totalWidth = badges.reduce((sum, b) => sum + doc.getTextWidth(b.text) + paddingX * 2, 0)
    + (badges.length - 1) * spacing;

  let bx = centerX - totalWidth / 2;

  for (const badge of badges) {
    const bw = drawBadge(doc, badge.text, bx, y, badge.bg, badge.fg, fontSize, paddingX, paddingY, radius);
    bx += bw + spacing;
  }

  // Return new Y position after badges
  return y + fontSize * 0.02 + paddingY * 2 + 0.06;
}

/**
 * Render header bar with store name
 */
function renderHeaderBar(
  doc: jsPDF,
  storeName: string | undefined,
  colors: ThemeColors,
  offsetX: number,
  offsetY: number,
  width: number,
  options: HeaderBarOptions
): void {
  const { height, fontSize, accentHeight = 0 } = options;

  // Main header background
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(offsetX, offsetY, width, height, 'F');

  // Accent stripe at bottom
  if (accentHeight > 0) {
    doc.setFillColor(...hexToRgb(colors.primary));
    doc.rect(offsetX, offsetY + height - accentHeight, width, accentHeight, 'F');
  }

  // Store name
  if (storeName) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const textY = offsetY + (height - accentHeight) / 2 + fontSize * 0.012;
    doc.text(storeName, offsetX + width / 2, textY, { align: 'center' });
  }
}

/**
 * Render price section with optional strikethrough and box
 */
function renderPriceSection(
  doc: jsPDF,
  config: PrebuildConfig,
  colors: ThemeColors,
  centerX: number,
  y: number,
  contentWidth: number,
  options: PriceSectionOptions
): number {
  const { mainFontSize, strikeFontSize, showBox, boxHeight = 0.5 } = options;
  let currentY = y;

  // Strike-through original price if on sale
  if (config.saleInfo?.enabled && config.saleInfo.originalPrice > 0) {
    doc.setFontSize(strikeFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const origPriceStr = formatPrice(config.saleInfo.originalPrice);
    const origW = doc.getTextWidth(origPriceStr);
    const origX = centerX - origW / 2;
    const textY = currentY + strikeFontSize * 0.01;
    doc.text(origPriceStr, origX, textY);
    doc.setLineWidth(0.015);
    doc.setDrawColor(150, 150, 150);
    doc.line(origX - 0.02, textY - strikeFontSize * 0.004, origX + origW + 0.02, textY - strikeFontSize * 0.004);
    currentY += strikeFontSize * 0.012 + 0.04;
  }

  // Price box background (optional)
  if (showBox) {
    const boxX = centerX - contentWidth / 2;
    doc.setFillColor(...lightenColor(colors.priceColor, 0.92));
    doc.roundedRect(boxX, currentY, contentWidth, boxHeight, 0.06, 0.06, 'F');
  }

  // Main price text
  doc.setFontSize(mainFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.priceColor));
  const priceY = showBox ? currentY + boxHeight * 0.75 : currentY + mainFontSize * 0.01;
  doc.text(formatPrice(config.price), centerX, priceY, { align: 'center' });

  return showBox ? currentY + boxHeight + 0.08 : currentY + mainFontSize * 0.015;
}

/**
 * Render financing info line
 */
function renderFinancingInfo(
  doc: jsPDF,
  config: PrebuildConfig,
  centerX: number,
  y: number,
  fontSize: number,
  includeApr: boolean = false
): number {
  if (!config.financingInfo?.enabled || config.price <= 0) return y;

  const monthly = calculateMonthlyPayment(config.price, config.financingInfo.months, config.financingInfo.apr);
  if (!monthly) return y;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  let finText = `Or as low as $${monthly}/mo for ${config.financingInfo.months} months`;
  if (includeApr && config.financingInfo.apr > 0) {
    finText += ` @ ${config.financingInfo.apr}% APR`;
  }

  doc.text(finText, centerX, y + fontSize * 0.01, { align: 'center' });
  return y + fontSize * 0.02;
}

/**
 * Render footer with barcode and SKU
 */
async function renderFooter(
  doc: jsPDF,
  config: PrebuildConfig,
  offsetX: number,
  footerY: number,
  width: number,
  barcodeWidth: number,
  barcodeHeight: number,
  skuFontSize: number
): Promise<void> {
  const centerX = offsetX + width / 2;
  const barcodeX = centerX - barcodeWidth / 2;

  // Barcode
  if (config.sku && isValidBarcode(config.sku)) {
    await addBarcodeToPdf(doc, config.sku, barcodeX, footerY - barcodeHeight - 0.02, barcodeWidth, barcodeHeight);
  }

  // SKU text
  if (config.sku) {
    doc.setFontSize(skuFontSize);
    doc.setTextColor(120, 120, 120);
    doc.text(`SKU: ${config.sku}`, centerX, footerY + skuFontSize * 0.01, { align: 'center' });
  }
}

/**
 * Render a single spec line with optional brand icon
 */
async function renderSpecLine(
  doc: jsPDF,
  key: ComponentCategory,
  value: string,
  brandIcons: BrandIcon[],
  x: number,
  y: number,
  maxWidth: number,
  colors: ThemeColors,
  iconSize: number,
  labelFontSize: number,
  valueFontSize: number
): Promise<number> {
  if (!value) return y;

  const brandIcon = findBrandIcon(value, brandIcons);
  let textX = x;

  if (brandIcon) {
    await addImageToPdf(doc, brandIcon.image, textX, y - iconSize * 0.15, iconSize, iconSize, false);
    textX += iconSize + 0.02;
  }

  doc.setFontSize(labelFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.primary));
  const label = COMPONENT_LABELS[key] + ':';
  doc.text(label, textX, y + labelFontSize * 0.008);

  doc.setFontSize(valueFontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const labelW = doc.getTextWidth(label);
  const valueW = maxWidth - (textX - x) - labelW - 0.02;
  const valueText = doc.splitTextToSize(value, valueW)[0];
  doc.text(valueText, textX + labelW + 0.02, y + valueFontSize * 0.008);

  return y + Math.max(labelFontSize, valueFontSize) * 0.018 + 0.02;
}

/**
 * Render additional info bar (OS, Warranty, Connectivity)
 */
function renderInfoBar(
  doc: jsPDF,
  config: PrebuildConfig,
  colors: ThemeColors,
  offsetX: number,
  y: number,
  contentWidth: number,
  height: number,
  labelFontSize: number,
  valueFontSize: number
): number {
  const footerInfo = [
    { label: 'OS', value: config.os },
    { label: 'WARRANTY', value: config.warranty },
    { label: 'CONNECTIVITY', value: config.wifi },
  ].filter(item => item.value);

  if (footerInfo.length === 0) return y;

  doc.setFillColor(...lightenColor(colors.primary, 0.9));
  doc.roundedRect(offsetX, y, contentWidth, height, 0.05, 0.05, 'F');

  const colW = contentWidth / footerInfo.length;
  footerInfo.forEach((info, i) => {
    const cx = offsetX + colW * i + colW / 2;

    doc.setFontSize(labelFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(info.label, cx, y + height * 0.35, { align: 'center' });

    doc.setFontSize(valueFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const valLines = doc.splitTextToSize(info.value!, colW - 0.1);
    doc.text(valLines[0], cx, y + height * 0.75, { align: 'center' });
  });

  return y + height + 0.08;
}

// ============================================================================
// SHELF TAG (2" × 3") - Compact retail tag
// ============================================================================

async function drawShelfTagAt(
  doc: jsPDF,
  config: PrebuildConfig,
  offsetX: number,
  offsetY: number,
  brandIcons: BrandIcon[] = []
): Promise<void> {
  const layout = getLayoutConfig('shelf');
  const width = CARD_SIZES.shelf.width;
  const height = CARD_SIZES.shelf.height;
  const colors = getThemeColors(config);
  const contentWidth = width - layout.margin * 2;
  const centerX = offsetX + width / 2;

  // Draw card border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(layout.borderWidth);
  doc.rect(offsetX, offsetY, width, height, 'S');

  // Header
  renderHeaderBar(doc, config.storeName, colors, offsetX, offsetY, width, {
    height: layout.header.height,
    fontSize: layout.header.fontSize,
    accentHeight: layout.header.accentHeight,
  });

  let y = offsetY + layout.header.height + layout.spacing.sectionGap;

  // Logo
  if (config.storeLogo) {
    const { height: logoH } = await addImageToPdf(doc, config.storeLogo, offsetX + layout.margin, y, contentWidth, layout.logoMaxHeight);
    y += logoH + layout.spacing.afterLogo;
  }

  // Model name
  doc.setFontSize(layout.fontSize.modelName);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, centerX, y + layout.spacing.sectionGap, { align: 'center' });
  y += modelLines.length * layout.spacing.lineHeight + layout.spacing.afterModelName;

  // Badges
  const badges = buildBadgesFromConfig(config, colors, layout.includeStockBadge);
  y = renderBadgeRow(doc, badges, centerX, y, {
    fontSize: layout.badge.fontSize,
    paddingX: layout.badge.paddingX,
    paddingY: layout.badge.paddingY,
    radius: layout.badge.radius,
    spacing: layout.badge.spacing,
  });

  // Price section
  y = renderPriceSection(doc, config, colors, centerX, y, contentWidth - 0.2, {
    mainFontSize: layout.price.mainFontSize,
    strikeFontSize: layout.price.strikeFontSize,
    showBox: layout.price.showBox,
    boxHeight: layout.price.boxHeight,
  });

  // Key specs
  const keySpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  for (const key of keySpecs) {
    y = await renderSpecLine(
      doc, key, config.components[key], brandIcons,
      offsetX + layout.margin, y, contentWidth,
      colors, layout.specs.iconSize, layout.fontSize.specLabel, layout.fontSize.specValue
    );
  }

  // Footer
  await renderFooter(doc, config, offsetX, offsetY + height - layout.footer.offsetFromBottom, width, layout.footer.barcodeWidth, layout.footer.barcodeHeight, layout.footer.skuFontSize);
}

export async function generateShelfTag(config: PrebuildConfig, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const size = CARD_SIZES.shelf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [size.width, size.height] });
  await drawShelfTagAt(doc, config, 0, 0, brandIcons);
  return doc;
}

export async function generateShelfTagMultiUp(config: PrebuildConfig, includeCropMarks: boolean = true, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const multiUp = getMultiUpConfig('shelf')!;
  const tagW = CARD_SIZES.shelf.width;
  const tagH = CARD_SIZES.shelf.height;

  const marginX = (multiUp.pageWidth - multiUp.cols * tagW) / 2;
  const marginY = (multiUp.pageHeight - multiUp.rows * tagH) / 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

  if (includeCropMarks) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(multiUp.cropMarkWidth);
    for (let row = 0; row <= multiUp.rows; row++) {
      for (let col = 0; col <= multiUp.cols; col++) {
        const x = marginX + col * tagW;
        const y = marginY + row * tagH;
        doc.line(x - multiUp.cropMarkLength, y, x - multiUp.cropMarkGap, y);
        doc.line(x + multiUp.cropMarkGap, y, x + multiUp.cropMarkLength, y);
        doc.line(x, y - multiUp.cropMarkLength, x, y - multiUp.cropMarkGap);
        doc.line(x, y + multiUp.cropMarkGap, x, y + multiUp.cropMarkLength);
      }
    }
  }

  for (let row = 0; row < multiUp.rows; row++) {
    for (let col = 0; col < multiUp.cols; col++) {
      await drawShelfTagAt(doc, config, marginX + col * tagW, marginY + row * tagH, brandIcons);
    }
  }

  doc.setFontSize(multiUp.footerFontSize);
  doc.setTextColor(150, 150, 150);
  const totalCards = multiUp.cols * multiUp.rows;
  doc.text(`${config.modelName || 'PC Build'} - Shelf Tags (${totalCards} per page)`, multiUp.pageWidth / 2, multiUp.pageHeight - multiUp.footerY, { align: 'center' });

  return doc;
}

// ============================================================================
// PRICE CARD (4" × 6") - Medium display card
// ============================================================================

async function drawPriceCardAt(
  doc: jsPDF,
  config: PrebuildConfig,
  offsetX: number,
  offsetY: number,
  brandIcons: BrandIcon[] = []
): Promise<void> {
  const layout = getLayoutConfig('price');
  const width = CARD_SIZES.price.width;
  const height = CARD_SIZES.price.height;
  const colors = getThemeColors(config);
  const contentWidth = width - layout.margin * 2;
  const centerX = offsetX + width / 2;

  // Card border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(layout.borderWidth);
  doc.rect(offsetX, offsetY, width, height, 'S');

  // Header bar
  renderHeaderBar(doc, config.storeName, colors, offsetX, offsetY, width, {
    height: layout.header.height,
    fontSize: layout.header.fontSize,
    accentHeight: layout.header.accentHeight,
  });

  let y = offsetY + layout.header.height + layout.spacing.sectionGap;

  // Logo
  if (config.storeLogo) {
    const { height: logoH } = await addImageToPdf(doc, config.storeLogo, offsetX + layout.margin, y, contentWidth, layout.logoMaxHeight);
    y += logoH + layout.spacing.afterLogo;
  }

  // Model name
  doc.setFontSize(layout.fontSize.modelName);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkenColor(colors.accent, 0.2));
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, centerX, y + layout.spacing.sectionGap, { align: 'center' });
  y += modelLines.length * layout.spacing.lineHeight + layout.spacing.afterModelName;

  // Badges (include stock status)
  const badges = buildBadgesFromConfig(config, colors, layout.includeStockBadge);
  y = renderBadgeRow(doc, badges, centerX, y, {
    fontSize: layout.badge.fontSize,
    paddingX: layout.badge.paddingX,
    paddingY: layout.badge.paddingY,
    radius: layout.badge.radius,
    spacing: layout.badge.spacing,
  });

  // Price section with box
  y = renderPriceSection(doc, config, colors, centerX, y, contentWidth, {
    mainFontSize: layout.price.mainFontSize,
    strikeFontSize: layout.price.strikeFontSize,
    showBox: layout.price.showBox,
    boxHeight: layout.price.boxHeight,
  });

  // Financing
  y = renderFinancingInfo(doc, config, centerX, y, layout.fontSize.financing);

  // Feature badges
  if (config.features.length > 0 && layout.maxFeatures > 0) {
    doc.setFontSize(layout.featureBadge.fontSize);
    const features = config.features.slice(0, layout.maxFeatures);
    let totalW = features.reduce((sum, f) => sum + doc.getTextWidth(f) + layout.featureBadge.paddingX * 2, 0) + (features.length - 1) * layout.featureBadge.spacing;
    let fx = centerX - totalW / 2;

    for (const feature of features) {
      const fw = drawBadge(doc, feature, fx, y, lightenColor(colors.primary, 0.15), hexToRgb(colors.primary), layout.featureBadge.fontSize, layout.featureBadge.paddingX, layout.featureBadge.paddingY, layout.featureBadge.radius);
      fx += fw + layout.featureBadge.spacing;
    }
    y += 0.2;
  }

  // Specs section
  const specsY = y;
  const specsHeight = layout.specs.sectionHeight;

  // Specs background
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(offsetX + layout.margin, y, contentWidth, specsHeight, 0.08, 0.08, 'F');

  // Colored left accent
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.roundedRect(offsetX + layout.margin, y, layout.specs.accentWidth, specsHeight, 0.025, 0.025, 'F');

  y += layout.specs.padding;
  const specX = offsetX + layout.margin + layout.specs.padding + layout.specs.accentWidth;
  const specWidth = (contentWidth - layout.specs.padding * 2) / 2;
  const leftSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  const rightSpecs: ComponentCategory[] = ['motherboard', 'psu', 'case', 'cooling'];

  let leftY = y;
  let rightY = y;

  // Left column specs
  for (const key of leftSpecs) {
    const value = config.components[key];
    if (!value) continue;

    doc.setFontSize(layout.fontSize.specLabel);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(COMPONENT_LABELS[key].toUpperCase(), specX, leftY + 0.08);

    const brandIcon = findBrandIcon(value, brandIcons);
    let valueX = specX;
    if (brandIcon) {
      await addImageToPdf(doc, brandIcon.image, specX, leftY + 0.12, layout.specs.iconSize, layout.specs.iconSize, false);
      valueX += layout.specs.iconSize + 0.02;
    }

    doc.setFontSize(layout.fontSize.specValue);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const valueLines = doc.splitTextToSize(value, specWidth - (valueX - specX) - 0.05);
    doc.text(valueLines[0], valueX, leftY + 0.22);
    leftY += layout.specs.lineHeight;
  }

  // Right column specs
  const rightX = specX + specWidth + layout.specs.columnGap;
  for (const key of rightSpecs) {
    const value = config.components[key];
    if (!value) continue;

    doc.setFontSize(layout.fontSize.specLabel);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(COMPONENT_LABELS[key].toUpperCase(), rightX, rightY + 0.08);

    const brandIcon = findBrandIcon(value, brandIcons);
    let valueX = rightX;
    if (brandIcon) {
      await addImageToPdf(doc, brandIcon.image, rightX, rightY + 0.12, layout.specs.iconSize, layout.specs.iconSize, false);
      valueX += layout.specs.iconSize + 0.02;
    }

    doc.setFontSize(layout.fontSize.specValue);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const valueLines = doc.splitTextToSize(value, specWidth - (valueX - rightX) - 0.05);
    doc.text(valueLines[0], valueX, rightY + 0.22);
    rightY += layout.specs.lineHeight;
  }

  y = specsY + specsHeight + 0.1;

  // Additional info bar
  y = renderInfoBar(doc, config, colors, offsetX + layout.margin, y, contentWidth, layout.infoBar.height, layout.infoBar.labelFontSize, layout.infoBar.valueFontSize);

  // Product image & QR code
  const { visualSettings } = config;
  if (visualSettings?.productImage || (visualSettings?.showQrCode && visualSettings?.qrCodeUrl)) {
    const imgSize = layout.media.imageSize;
    if (visualSettings.productImage && visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addImageToPdf(doc, visualSettings.productImage, offsetX + layout.margin, y, imgSize, imgSize, false);
      await addQrCodeToPdf(doc, visualSettings.qrCodeUrl, offsetX + width - layout.margin - layout.media.qrSize, y, layout.media.qrSize);
    } else if (visualSettings.productImage) {
      await addImageToPdf(doc, visualSettings.productImage, centerX - imgSize / 2, y, imgSize, imgSize, false);
    } else if (visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addQrCodeToPdf(doc, visualSettings.qrCodeUrl, centerX - layout.media.qrSize / 2, y, layout.media.qrSize);
    }
  }

  // Footer
  const footerY = offsetY + height - layout.footer.offsetFromBottom;
  await renderFooter(doc, config, offsetX, footerY, width, layout.footer.barcodeWidth, layout.footer.barcodeHeight, layout.footer.skuFontSize);

  // Bottom accent line
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(offsetX, offsetY + height - layout.footer.accentHeight, width, layout.footer.accentHeight, 'F');
}

export async function generatePriceCard(config: PrebuildConfig, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const size = CARD_SIZES.price;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [size.width, size.height] });
  await drawPriceCardAt(doc, config, 0, 0, brandIcons);
  return doc;
}

export async function generatePriceCardMultiUp(config: PrebuildConfig, includeCropMarks: boolean = true, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const multiUp = getMultiUpConfig('price')!;
  const cardW = CARD_SIZES.price.width;
  const cardH = CARD_SIZES.price.height;

  const marginX = (multiUp.pageWidth - multiUp.cols * cardW) / 2;
  const marginY = (multiUp.pageHeight - multiUp.rows * cardH) / 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

  if (includeCropMarks) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(multiUp.cropMarkWidth);
    for (let row = 0; row <= multiUp.rows; row++) {
      for (let col = 0; col <= multiUp.cols; col++) {
        const x = marginX + col * cardW;
        const y = marginY + row * cardH;
        doc.line(x - multiUp.cropMarkLength, y, x - multiUp.cropMarkGap, y);
        doc.line(x + multiUp.cropMarkGap, y, x + multiUp.cropMarkLength, y);
        doc.line(x, y - multiUp.cropMarkLength, x, y - multiUp.cropMarkGap);
        doc.line(x, y + multiUp.cropMarkGap, x, y + multiUp.cropMarkLength);
      }
    }
  }

  for (let row = 0; row < multiUp.rows; row++) {
    for (let col = 0; col < multiUp.cols; col++) {
      await drawPriceCardAt(doc, config, marginX + col * cardW, marginY + row * cardH, brandIcons);
    }
  }

  doc.setFontSize(multiUp.footerFontSize);
  doc.setTextColor(150, 150, 150);
  const totalCards = multiUp.cols * multiUp.rows;
  doc.text(`${config.modelName || 'PC Build'} - Price Cards (${totalCards} per page)`, multiUp.pageWidth / 2, multiUp.pageHeight - multiUp.footerY, { align: 'center' });

  return doc;
}

// ============================================================================
// POSTER (8.5" × 11") - Full page display
// ============================================================================

export async function generatePoster(config: PrebuildConfig, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const layout = getLayoutConfig('poster');
  const width = CARD_SIZES.poster.width;
  const height = CARD_SIZES.poster.height;
  const colors = getThemeColors(config);
  const contentWidth = width - layout.margin * 2;
  const centerX = width / 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [width, height] });

  // Header bar
  renderHeaderBar(doc, config.storeName, colors, 0, 0, width, {
    height: layout.header.height,
    fontSize: layout.header.fontSize,
    accentHeight: layout.header.accentHeight,
  });

  let y = layout.header.height + layout.spacing.sectionGap;

  // Logo
  if (config.storeLogo) {
    const { height: logoH } = await addImageToPdf(doc, config.storeLogo, layout.margin, y, contentWidth, layout.logoMaxHeight);
    y += logoH + layout.spacing.afterLogo;
  }

  // Badges (include stock status)
  const badges = buildBadgesFromConfig(config, colors, layout.includeStockBadge);
  y = renderBadgeRow(doc, badges, centerX, y, {
    fontSize: layout.badge.fontSize,
    paddingX: layout.badge.paddingX,
    paddingY: layout.badge.paddingY,
    radius: layout.badge.radius,
    spacing: layout.badge.spacing,
  });

  // Model name
  doc.setFontSize(layout.fontSize.modelName);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkenColor(colors.accent, 0.1));
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, centerX, y + 0.3, { align: 'center' });
  y += modelLines.length * layout.spacing.lineHeight + layout.spacing.afterModelName;

  // Price section with decorated box
  // Strike price if on sale
  if (config.saleInfo?.enabled && config.saleInfo.originalPrice > 0) {
    doc.setFontSize(layout.price.strikeFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const origPriceStr = formatPrice(config.saleInfo.originalPrice);
    const origW = doc.getTextWidth(origPriceStr);
    doc.text(origPriceStr, centerX, y + 0.2, { align: 'center' });
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.015);
    doc.line(centerX - origW / 2 - 0.03, y + 0.14, centerX + origW / 2 + 0.03, y + 0.14);
    y += 0.28;
  }

  // Main price box
  const priceBoxH = layout.price.boxHeight;
  doc.setFillColor(...lightenColor(colors.priceColor, 0.92));
  doc.roundedRect(layout.margin + 0.3, y, contentWidth - 0.6, priceBoxH, layout.price.boxRadius, layout.price.boxRadius, 'F');

  // Side accents on price box
  doc.setFillColor(...hexToRgb(colors.priceColor));
  doc.roundedRect(layout.margin + 0.3, y, 0.06, priceBoxH, 0.03, 0.03, 'F');
  doc.roundedRect(width - layout.margin - 0.36, y, 0.06, priceBoxH, 0.03, 0.03, 'F');

  doc.setFontSize(layout.price.mainFontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.priceColor));
  doc.text(formatPrice(config.price), centerX, y + priceBoxH * 0.73, { align: 'center' });
  y += priceBoxH + layout.spacing.afterPrice;

  // Financing
  y = renderFinancingInfo(doc, config, centerX, y, layout.fontSize.financing, true);
  y += layout.spacing.afterModelName;

  // Specifications section header
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(0, y, width, POSTER_SPEC_HEADER.height, 'F');
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(0, y + POSTER_SPEC_HEADER.height - POSTER_SPEC_HEADER.accentHeight, width, POSTER_SPEC_HEADER.accentHeight, 'F');

  doc.setFontSize(POSTER_SPEC_HEADER.fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SPECIFICATIONS', centerX, y + POSTER_SPEC_HEADER.titleY, { align: 'center' });
  y += POSTER_SPEC_HEADER.height + layout.spacing.sectionGap;

  // Spec cards - 2 columns, 4 rows
  const cardWidth = (contentWidth - 0.2) / 2;
  const allSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

  for (let row = 0; row < 4; row++) {
    const leftSpec = allSpecs[row];
    const rightSpec = allSpecs[row + 4];
    const cardY = y + row * (POSTER_SPEC_CARD.height + POSTER_SPEC_CARD.gap);

    // Left card
    if (config.components[leftSpec]) {
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(layout.margin, cardY, cardWidth, POSTER_SPEC_CARD.height, POSTER_SPEC_CARD.radius, POSTER_SPEC_CARD.radius, 'F');
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.roundedRect(layout.margin, cardY, POSTER_SPEC_CARD.accentWidth, POSTER_SPEC_CARD.height, 0.025, 0.025, 'F');

      doc.setFontSize(layout.fontSize.specLabel);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(COMPONENT_LABELS[leftSpec].toUpperCase(), layout.margin + POSTER_SPEC_CARD.contentPadding, cardY + POSTER_SPEC_CARD.labelY);

      const brandIcon = findBrandIcon(config.components[leftSpec], brandIcons);
      let valueX = layout.margin + POSTER_SPEC_CARD.contentPadding;
      if (brandIcon) {
        await addImageToPdf(doc, brandIcon.image, layout.margin + POSTER_SPEC_CARD.contentPadding, cardY + POSTER_SPEC_CARD.iconY, layout.specs.iconSize, layout.specs.iconSize, false);
        valueX += layout.specs.iconSize + 0.04;
      }

      doc.setFontSize(layout.fontSize.specValue);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valueLines = doc.splitTextToSize(config.components[leftSpec], cardWidth - (valueX - layout.margin) - 0.15);
      doc.text(valueLines[0], valueX, cardY + POSTER_SPEC_CARD.valueY);
    }

    // Right card
    if (config.components[rightSpec]) {
      const rightX = layout.margin + cardWidth + 0.2;

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(rightX, cardY, cardWidth, POSTER_SPEC_CARD.height, POSTER_SPEC_CARD.radius, POSTER_SPEC_CARD.radius, 'F');
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.roundedRect(rightX, cardY, POSTER_SPEC_CARD.accentWidth, POSTER_SPEC_CARD.height, 0.025, 0.025, 'F');

      doc.setFontSize(layout.fontSize.specLabel);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(COMPONENT_LABELS[rightSpec].toUpperCase(), rightX + POSTER_SPEC_CARD.contentPadding, cardY + POSTER_SPEC_CARD.labelY);

      const brandIcon = findBrandIcon(config.components[rightSpec], brandIcons);
      let valueX = rightX + POSTER_SPEC_CARD.contentPadding;
      if (brandIcon) {
        await addImageToPdf(doc, brandIcon.image, rightX + POSTER_SPEC_CARD.contentPadding, cardY + POSTER_SPEC_CARD.iconY, layout.specs.iconSize, layout.specs.iconSize, false);
        valueX += layout.specs.iconSize + 0.04;
      }

      doc.setFontSize(layout.fontSize.specValue);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valueLines = doc.splitTextToSize(config.components[rightSpec], cardWidth - (valueX - rightX) - 0.15);
      doc.text(valueLines[0], valueX, cardY + POSTER_SPEC_CARD.valueY);
    }
  }

  y += 4 * (POSTER_SPEC_CARD.height + POSTER_SPEC_CARD.gap) + 0.1;

  // Additional info bar
  y = renderInfoBar(doc, config, colors, layout.margin, y, contentWidth, layout.infoBar.height, layout.infoBar.labelFontSize, layout.infoBar.valueFontSize);

  // Description
  if (config.description) {
    doc.setFontSize(layout.fontSize.description);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(config.description, contentWidth - 0.5);
    doc.text(descLines.slice(0, 2), centerX, y + 0.12, { align: 'center' });
    y += descLines.slice(0, 2).length * 0.16 + 0.1;
  }

  // Feature badges
  if (config.features.length > 0 && layout.maxFeatures > 0) {
    doc.setFontSize(layout.featureBadge.fontSize);
    const features = config.features.slice(0, layout.maxFeatures);
    let totalW = features.reduce((sum, f) => sum + doc.getTextWidth(f) + layout.featureBadge.paddingX * 2, 0) + (features.length - 1) * layout.featureBadge.spacing;

    if (totalW <= contentWidth) {
      let fx = centerX - totalW / 2;
      for (const feature of features) {
        const fw = drawBadge(doc, feature, fx, y, hexToRgb(colors.primary), [255, 255, 255], layout.featureBadge.fontSize, layout.featureBadge.paddingX, layout.featureBadge.paddingY, layout.featureBadge.radius);
        fx += fw + layout.featureBadge.spacing;
      }
    }
  }

  // Footer section
  const footerY = height - layout.footer.offsetFromBottom;

  // QR code
  const { visualSettings } = config;
  if (visualSettings?.showQrCode && visualSettings?.qrCodeUrl) {
    await addQrCodeToPdf(doc, visualSettings.qrCodeUrl, width - layout.margin - layout.media.qrSize, footerY - 0.7, layout.media.qrSize);
  }

  // Barcode
  if (config.sku && isValidBarcode(config.sku)) {
    await addBarcodeToPdf(doc, config.sku, layout.margin, footerY - 0.05, layout.footer.barcodeWidth, layout.footer.barcodeHeight);
  }

  // SKU text
  if (config.sku) {
    doc.setFontSize(layout.footer.skuFontSize);
    doc.setTextColor(100, 100, 100);
    doc.text(`SKU: ${config.sku}`, layout.margin, footerY + 0.35);
  }

  // Bottom accent bar
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(0, height - layout.footer.accentHeight, width, layout.footer.accentHeight, 'F');
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(0, height - layout.footer.accentHeight, width, layout.footer.primaryStripeHeight, 'F');

  return doc;
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

export async function generatePDF(config: PrebuildConfig, cardSize: CardSize, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  switch (cardSize) {
    case 'shelf':
      return generateShelfTag(config, brandIcons);
    case 'price':
      return generatePriceCard(config, brandIcons);
    case 'poster':
      return generatePoster(config, brandIcons);
    default:
      return generatePriceCard(config, brandIcons);
  }
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
