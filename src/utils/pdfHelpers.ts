import { jsPDF } from 'jspdf';
import {
  PrebuildConfig,
  COMPONENT_LABELS,
  ComponentCategory,
  BrandIcon,
  STOCK_STATUS_CONFIG,
  CONDITION_CONFIG,
  calculateMonthlyPayment,
  calculateDiscountPercent,
  formatPrice,
  ThemeColors,
} from '../types';
import { findBrandIcon } from './brandDetection';
import { generateQRCodeDataUrl } from './qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from './barcode';
import { logger } from './logger';
import { hexToRgb, lightenColor, type RGB } from './colorUtils';
export type { RGB } from './colorUtils';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Badge {
  text: string;
  bg: RGB;
  fg: RGB;
}

export interface BadgeRowOptions {
  fontSize: number;
  paddingX: number;
  paddingY: number;
  radius: number;
  spacing: number;
}

export interface PriceSectionOptions {
  mainFontSize: number;
  strikeFontSize: number;
  showBox: boolean;
  boxHeight?: number;
}

export interface HeaderBarOptions {
  height: number;
  fontSize: number;
  accentHeight?: number;
}

// Re-export color utilities for consumers that import from pdfHelpers
export { hexToRgb, lightenColor, darkenColor } from './colorUtils';

// ============================================================================
// IMAGE HELPERS
// ============================================================================

export function addImageToPdf(
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
      img.onload = null;
      img.onerror = null;
      img.src = ''; // Release image reference to prevent memory leak
      resolve({ width, height, success: true });
    };
    img.onerror = (event) => {
      logger.warn('PDFGenerator', `Failed to load ${imageType}`, {
        src: src.substring(0, 100),
        event,
      });
      img.onload = null;
      img.onerror = null;
      img.src = ''; // Release image reference to prevent memory leak
      resolve({ width: 0, height: 0, success: false });
    };
    img.src = src;
  });
}

export async function addQrCodeToPdf(
  doc: jsPDF,
  url: string,
  x: number,
  y: number,
  size: number
): Promise<boolean> {
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

export async function addBarcodeToPdf(
  doc: jsPDF,
  sku: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<boolean> {
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
    const img = new Image();
    try {
      const success = await new Promise<boolean>((resolve) => {
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
      return success;
    } finally {
      img.onload = null;
      img.onerror = null;
      img.src = ''; // Release image reference to prevent memory leak
    }
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
export function drawBadge(
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
export function buildBadgesFromConfig(
  config: PrebuildConfig,
  colors: ThemeColors,
  includeStock: boolean = false
): Badge[] {
  const badges: Badge[] = [];

  if (config.condition) {
    const cc = CONDITION_CONFIG[config.condition];
    badges.push({ text: cc.shortLabel, bg: hexToRgb(cc.bgColor), fg: hexToRgb(cc.color) });
  }
  if (config.buildTier) {
    badges.push({ text: config.buildTier, bg: hexToRgb(colors.primary), fg: [255, 255, 255] });
  }
  if (config.saleInfo?.enabled) {
    const saleText =
      config.saleInfo.originalPrice > 0 && config.price > 0
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
export function renderBadgeRow(
  doc: jsPDF,
  badges: Badge[],
  centerX: number,
  y: number,
  options: BadgeRowOptions
): number {
  if (badges.length === 0) return y;

  const { fontSize, paddingX, paddingY, radius, spacing } = options;

  doc.setFontSize(fontSize);
  const totalWidth =
    badges.reduce((sum, b) => sum + doc.getTextWidth(b.text) + paddingX * 2, 0) +
    (badges.length - 1) * spacing;

  let bx = centerX - totalWidth / 2;

  for (const badge of badges) {
    const bw = drawBadge(
      doc,
      badge.text,
      bx,
      y,
      badge.bg,
      badge.fg,
      fontSize,
      paddingX,
      paddingY,
      radius
    );
    bx += bw + spacing;
  }

  // Return new Y position after badges
  return y + fontSize * 0.02 + paddingY * 2 + 0.06;
}

/**
 * Render header bar with store name
 */
export function renderHeaderBar(
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
export function renderPriceSection(
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
    doc.line(
      origX - 0.02,
      textY - strikeFontSize * 0.004,
      origX + origW + 0.02,
      textY - strikeFontSize * 0.004
    );
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
export function renderFinancingInfo(
  doc: jsPDF,
  config: PrebuildConfig,
  centerX: number,
  y: number,
  fontSize: number,
  includeApr: boolean = false
): number {
  if (!config.financingInfo?.enabled || config.price <= 0) return y;

  const monthly = calculateMonthlyPayment(
    config.price,
    config.financingInfo.months,
    config.financingInfo.apr
  );
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
export async function renderFooter(
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
    await addBarcodeToPdf(
      doc,
      config.sku,
      barcodeX,
      footerY - barcodeHeight - 0.02,
      barcodeWidth,
      barcodeHeight
    );
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
export async function renderSpecLine(
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
    await addImageToPdf(
      doc,
      brandIcon.image,
      textX,
      y - iconSize * 0.15,
      iconSize,
      iconSize,
      false
    );
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
export function renderInfoBar(
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
  ].filter((item) => item.value);

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
