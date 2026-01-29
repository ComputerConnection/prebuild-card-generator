import { jsPDF } from 'jspdf';
import { PrebuildConfig, CardSize, CARD_SIZES, COMPONENT_LABELS, ComponentCategory, getThemeColors, BrandIcon, STOCK_STATUS_CONFIG, CONDITION_CONFIG, calculateMonthlyPayment, calculateDiscountPercent } from '../types';
import { findBrandIcon } from './brandDetection';
import { generateQRCodeDataUrl } from './qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from './barcode';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function lightenColor(hex: string, percent: number): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r + (255 - r) * percent),
    Math.round(g + (255 - g) * percent),
    Math.round(b + (255 - b) * percent),
  ];
}

function darkenColor(hex: string, percent: number): [number, number, number] {
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
  center: boolean = true
): Promise<{ width: number; height: number }> {
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
      resolve({ width, height });
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = src;
  });
}

async function addQrCodeToPdf(doc: jsPDF, url: string, x: number, y: number, size: number): Promise<void> {
  if (!url) return;
  try {
    const qrDataUrl = await generateQRCodeDataUrl(url, 200);
    await addImageToPdf(doc, qrDataUrl, x, y, size, size, false);
  } catch {
    // Silently fail
  }
}

function addBarcodeToPdf(doc: jsPDF, sku: string, x: number, y: number, width: number, height: number): void {
  if (!sku || !isValidBarcode(sku)) return;
  try {
    const barcodeDataUrl = generateBarcodeDataUrl(sku, { height: 50, displayValue: false });
    const img = new Image();
    img.onload = () => {
      doc.addImage(img, 'PNG', x, y, width, height);
    };
    img.src = barcodeDataUrl;
  } catch {
    // Silently fail
  }
}

// ============================================================================
// DRAWING PRIMITIVES
// ============================================================================

function drawBadge(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  bgColor: [number, number, number],
  textColor: [number, number, number] = [255, 255, 255],
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
  const width = CARD_SIZES.shelf.width;
  const height = CARD_SIZES.shelf.height;
  const colors = getThemeColors(config);
  const margin = 0.08;
  const contentWidth = width - margin * 2;

  // Draw card border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.01);
  doc.rect(offsetX, offsetY, width, height, 'S');

  // ─── HEADER SECTION ───
  const headerHeight = 0.35;
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(offsetX, offsetY, width, headerHeight, 'F');

  // Store name
  if (config.storeName) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.storeName, offsetX + width / 2, offsetY + 0.22, { align: 'center' });
  }

  let y = offsetY + headerHeight + 0.08;

  // ─── LOGO ───
  if (config.storeLogo) {
    const { height: logoH } = await addImageToPdf(doc, config.storeLogo, offsetX + margin, y, contentWidth, 0.3);
    y += logoH + 0.06;
  }

  // ─── MODEL NAME ───
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, offsetX + width / 2, y + 0.08, { align: 'center' });
  y += modelLines.length * 0.12 + 0.06;

  // ─── BADGES ROW ───
  const badges: { text: string; color: [number, number, number]; textColor?: [number, number, number] }[] = [];
  if (config.condition) {
    const cc = CONDITION_CONFIG[config.condition];
    badges.push({ text: cc.shortLabel, color: hexToRgb(cc.bgColor), textColor: hexToRgb(cc.color) });
  }
  if (config.buildTier) {
    badges.push({ text: config.buildTier, color: hexToRgb(colors.primary) });
  }
  if (config.saleInfo?.enabled) {
    badges.push({ text: config.saleInfo.badgeText, color: [220, 38, 38] });
  }

  if (badges.length > 0) {
    doc.setFontSize(5);
    let totalW = badges.reduce((sum, b) => sum + doc.getTextWidth(b.text) + 0.1, 0) + (badges.length - 1) * 0.04;
    let bx = offsetX + (width - totalW) / 2;

    for (const badge of badges) {
      const bw = drawBadge(doc, badge.text, bx, y, badge.color, badge.textColor || [255, 255, 255], 5, 0.05, 0.03, 0.03);
      bx += bw + 0.04;
    }
    y += 0.18;
  }

  // ─── PRICE SECTION ───
  // Strike price if on sale
  if (config.saleInfo?.enabled && config.saleInfo.originalPrice) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const origW = doc.getTextWidth(config.saleInfo.originalPrice);
    const origX = offsetX + (width - origW) / 2;
    doc.text(config.saleInfo.originalPrice, origX, y + 0.08);
    doc.setLineWidth(0.01);
    doc.setDrawColor(150, 150, 150);
    doc.line(origX - 0.02, y + 0.05, origX + origW + 0.02, y + 0.05);
    y += 0.12;
  }

  // Main price
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.priceColor));
  doc.text(config.price || '$0', offsetX + width / 2, y + 0.18, { align: 'center' });
  y += 0.28;

  // ─── KEY SPECS ───
  const keySpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  doc.setFontSize(5.5);

  for (const key of keySpecs) {
    const value = config.components[key];
    if (!value) continue;

    const brandIcon = findBrandIcon(value, brandIcons);
    let textX = offsetX + margin;

    if (brandIcon) {
      await addImageToPdf(doc, brandIcon.image, textX, y - 0.02, 0.12, 0.12, false);
      textX += 0.14;
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    const label = COMPONENT_LABELS[key] + ':';
    doc.text(label, textX, y + 0.06);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const labelW = doc.getTextWidth(label);
    const valueW = contentWidth - (textX - offsetX - margin) - labelW - 0.02;
    const valueText = doc.splitTextToSize(value, valueW)[0];
    doc.text(valueText, textX + labelW + 0.02, y + 0.06);

    y += 0.12;
  }

  // ─── FOOTER ───
  const footerY = offsetY + height - 0.25;

  // Barcode
  if (config.sku && isValidBarcode(config.sku)) {
    addBarcodeToPdf(doc, config.sku, offsetX + 0.25, footerY - 0.12, width - 0.5, 0.1);
  }

  // SKU
  if (config.sku) {
    doc.setFontSize(4.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`SKU: ${config.sku}`, offsetX + width / 2, footerY + 0.08, { align: 'center' });
  }
}

export async function generateShelfTag(config: PrebuildConfig, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const size = CARD_SIZES.shelf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [size.width, size.height] });
  await drawShelfTagAt(doc, config, 0, 0, brandIcons);
  return doc;
}

export async function generateShelfTagMultiUp(config: PrebuildConfig, includeCropMarks: boolean = true, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const pageWidth = 8.5;
  const pageHeight = 11;
  const tagW = CARD_SIZES.shelf.width;
  const tagH = CARD_SIZES.shelf.height;
  const cols = 4;
  const rows = 3;

  const marginX = (pageWidth - cols * tagW) / 2;
  const marginY = (pageHeight - rows * tagH) / 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

  if (includeCropMarks) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.005);
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const x = marginX + col * tagW;
        const y = marginY + row * tagH;
        // Draw crop marks
        doc.line(x - 0.1, y, x - 0.02, y);
        doc.line(x + 0.02, y, x + 0.1, y);
        doc.line(x, y - 0.1, x, y - 0.02);
        doc.line(x, y + 0.02, x, y + 0.1);
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      await drawShelfTagAt(doc, config, marginX + col * tagW, marginY + row * tagH, brandIcons);
    }
  }

  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(`${config.modelName || 'PC Build'} - Shelf Tags (12 per page)`, pageWidth / 2, pageHeight - 0.15, { align: 'center' });

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
  const width = CARD_SIZES.price.width;
  const height = CARD_SIZES.price.height;
  const colors = getThemeColors(config);
  const margin = 0.15;
  const contentWidth = width - margin * 2;

  // Card border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.01);
  doc.rect(offsetX, offsetY, width, height, 'S');

  // ─── HEADER BAR ───
  const headerHeight = 0.45;
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(offsetX, offsetY, width, headerHeight, 'F');

  // Decorative accent line at bottom of header
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(offsetX, offsetY + headerHeight - 0.04, width, 0.04, 'F');

  if (config.storeName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.storeName, offsetX + width / 2, offsetY + 0.28, { align: 'center' });
  }

  let y = offsetY + headerHeight + 0.12;

  // ─── LOGO ───
  if (config.storeLogo) {
    const { height: logoH } = await addImageToPdf(doc, config.storeLogo, offsetX + margin, y, contentWidth, 0.45);
    y += logoH + 0.08;
  }

  // ─── MODEL NAME ───
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkenColor(colors.accent, 0.2));
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, offsetX + width / 2, y + 0.12, { align: 'center' });
  y += modelLines.length * 0.18 + 0.06;

  // ─── BADGES ───
  const pcBadges: { text: string; bg: [number, number, number]; fg: [number, number, number] }[] = [];

  if (config.condition) {
    const cc = CONDITION_CONFIG[config.condition];
    pcBadges.push({ text: cc.shortLabel, bg: hexToRgb(cc.bgColor), fg: hexToRgb(cc.color) });
  }
  if (config.buildTier) {
    pcBadges.push({ text: config.buildTier, bg: hexToRgb(colors.primary), fg: [255, 255, 255] });
  }
  if (config.saleInfo?.enabled) {
    const saleText = config.saleInfo.originalPrice && config.price
      ? `${config.saleInfo.badgeText} ${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF`
      : config.saleInfo.badgeText;
    pcBadges.push({ text: saleText, bg: [220, 38, 38], fg: [255, 255, 255] });
  }
  if (config.stockStatus) {
    const sc = STOCK_STATUS_CONFIG[config.stockStatus];
    pcBadges.push({ text: sc.label, bg: hexToRgb(sc.bgColor), fg: hexToRgb(sc.color) });
  }

  if (pcBadges.length > 0) {
    doc.setFontSize(7);
    let totalW = pcBadges.reduce((sum, b) => sum + doc.getTextWidth(b.text) + 0.16, 0) + (pcBadges.length - 1) * 0.06;
    let bx = offsetX + (width - totalW) / 2;

    for (const badge of pcBadges) {
      const bw = drawBadge(doc, badge.text, bx, y, badge.bg, badge.fg, 7, 0.08, 0.04, 0.04);
      bx += bw + 0.06;
    }
    y += 0.24;
  }

  // ─── PRICE SECTION ───
  // Original price strikethrough
  if (config.saleInfo?.enabled && config.saleInfo.originalPrice) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    const origW = doc.getTextWidth(config.saleInfo.originalPrice);
    const origX = offsetX + (width - origW) / 2;
    doc.text(config.saleInfo.originalPrice, origX, y + 0.12);
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.015);
    doc.line(origX - 0.02, y + 0.08, origX + origW + 0.02, y + 0.08);
    y += 0.16;
  }

  // Main price with background
  const priceBoxHeight = 0.5;
  doc.setFillColor(...lightenColor(colors.priceColor, 0.92));
  doc.roundedRect(offsetX + margin, y, contentWidth, priceBoxHeight, 0.06, 0.06, 'F');

  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.priceColor));
  doc.text(config.price || '$0', offsetX + width / 2, y + 0.38, { align: 'center' });
  y += priceBoxHeight + 0.08;

  // Financing
  if (config.financingInfo?.enabled && config.price) {
    const monthly = calculateMonthlyPayment(config.price, config.financingInfo.months, config.financingInfo.apr);
    if (monthly) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Or as low as $${monthly}/mo for ${config.financingInfo.months} months`, offsetX + width / 2, y + 0.08, { align: 'center' });
      y += 0.16;
    }
  }

  // ─── FEATURE BADGES ───
  if (config.features.length > 0) {
    doc.setFontSize(6);
    const features = config.features.slice(0, 4);
    let totalW = features.reduce((sum, f) => sum + doc.getTextWidth(f) + 0.12, 0) + (features.length - 1) * 0.04;
    let fx = offsetX + (width - totalW) / 2;

    for (const feature of features) {
      const fw = drawBadge(doc, feature, fx, y, lightenColor(colors.primary, 0.15), hexToRgb(colors.primary), 6, 0.06, 0.03, 0.03);
      fx += fw + 0.04;
    }
    y += 0.2;
  }

  // ─── SPECS SECTION ───
  const specsY = y;
  const specsHeight = 1.6;

  // Specs background
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(offsetX + margin, y, contentWidth, specsHeight, 0.08, 0.08, 'F');

  // Colored left accent
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.roundedRect(offsetX + margin, y, 0.05, specsHeight, 0.025, 0.025, 'F');

  y += 0.08;
  const specX = offsetX + margin + 0.12;
  const specWidth = (contentWidth - 0.2) / 2;
  const leftSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  const rightSpecs: ComponentCategory[] = ['motherboard', 'psu', 'case', 'cooling'];

  let leftY = y;
  let rightY = y;

  // Left column specs
  for (const key of leftSpecs) {
    const value = config.components[key];
    if (!value) continue;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(COMPONENT_LABELS[key].toUpperCase(), specX, leftY + 0.08);

    const brandIcon = findBrandIcon(value, brandIcons);
    let valueX = specX;
    if (brandIcon) {
      await addImageToPdf(doc, brandIcon.image, specX, leftY + 0.12, 0.14, 0.14, false);
      valueX += 0.16;
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const valueLines = doc.splitTextToSize(value, specWidth - (valueX - specX) - 0.05);
    doc.text(valueLines[0], valueX, leftY + 0.22);
    leftY += 0.36;
  }

  // Right column specs
  const rightX = specX + specWidth + 0.06;
  for (const key of rightSpecs) {
    const value = config.components[key];
    if (!value) continue;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb(colors.primary));
    doc.text(COMPONENT_LABELS[key].toUpperCase(), rightX, rightY + 0.08);

    const brandIcon = findBrandIcon(value, brandIcons);
    let valueX = rightX;
    if (brandIcon) {
      await addImageToPdf(doc, brandIcon.image, rightX, rightY + 0.12, 0.14, 0.14, false);
      valueX += 0.16;
    }

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const valueLines = doc.splitTextToSize(value, specWidth - (valueX - rightX) - 0.05);
    doc.text(valueLines[0], valueX, rightY + 0.22);
    rightY += 0.36;
  }

  y = specsY + specsHeight + 0.1;

  // ─── ADDITIONAL INFO ───
  const footerInfo = [
    { label: 'OS', value: config.os },
    { label: 'WARRANTY', value: config.warranty },
    { label: 'CONNECTIVITY', value: config.wifi },
  ].filter(item => item.value);

  if (footerInfo.length > 0) {
    const infoHeight = 0.35;
    doc.setFillColor(...lightenColor(colors.primary, 0.9));
    doc.roundedRect(offsetX + margin, y, contentWidth, infoHeight, 0.05, 0.05, 'F');

    const colW = contentWidth / footerInfo.length;
    footerInfo.forEach((info, i) => {
      const cx = offsetX + margin + colW * i + colW / 2;
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(info.label, cx, y + 0.12, { align: 'center' });

      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const valLines = doc.splitTextToSize(info.value!, colW - 0.1);
      doc.text(valLines[0], cx, y + 0.26, { align: 'center' });
    });
    y += infoHeight + 0.08;
  }

  // ─── PRODUCT IMAGE & QR CODE ───
  const { visualSettings } = config;
  if (visualSettings?.productImage || (visualSettings?.showQrCode && visualSettings?.qrCodeUrl)) {
    const imgSize = 0.55;
    if (visualSettings.productImage && visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addImageToPdf(doc, visualSettings.productImage, offsetX + margin, y, imgSize, imgSize, false);
      await addQrCodeToPdf(doc, visualSettings.qrCodeUrl, offsetX + width - margin - imgSize, y, imgSize);
    } else if (visualSettings.productImage) {
      await addImageToPdf(doc, visualSettings.productImage, offsetX + width / 2 - imgSize / 2, y, imgSize, imgSize, false);
    } else if (visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addQrCodeToPdf(doc, visualSettings.qrCodeUrl, offsetX + width / 2 - imgSize / 2, y, imgSize);
    }
  }

  // ─── FOOTER ───
  const footerY = offsetY + height - 0.28;

  // Barcode
  if (config.sku && isValidBarcode(config.sku)) {
    addBarcodeToPdf(doc, config.sku, offsetX + 0.6, footerY - 0.14, width - 1.2, 0.12);
  }

  // SKU
  if (config.sku) {
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text(`SKU: ${config.sku}`, offsetX + width / 2, footerY + 0.1, { align: 'center' });
  }

  // Bottom accent line
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(offsetX, offsetY + height - 0.04, width, 0.04, 'F');
}

export async function generatePriceCard(config: PrebuildConfig, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const size = CARD_SIZES.price;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [size.width, size.height] });
  await drawPriceCardAt(doc, config, 0, 0, brandIcons);
  return doc;
}

export async function generatePriceCardMultiUp(config: PrebuildConfig, includeCropMarks: boolean = true, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const pageWidth = 8.5;
  const pageHeight = 11;
  const cardW = CARD_SIZES.price.width;
  const cardH = CARD_SIZES.price.height;
  const cols = 2;
  const rows = 1;

  const marginX = (pageWidth - cols * cardW) / 2;
  const marginY = (pageHeight - rows * cardH) / 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });

  if (includeCropMarks) {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.005);
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const x = marginX + col * cardW;
        const y = marginY + row * cardH;
        doc.line(x - 0.15, y, x - 0.03, y);
        doc.line(x + 0.03, y, x + 0.15, y);
        doc.line(x, y - 0.15, x, y - 0.03);
        doc.line(x, y + 0.03, x, y + 0.15);
      }
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      await drawPriceCardAt(doc, config, marginX + col * cardW, marginY + row * cardH, brandIcons);
    }
  }

  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(`${config.modelName || 'PC Build'} - Price Cards (2 per page)`, pageWidth / 2, pageHeight - 0.15, { align: 'center' });

  return doc;
}

// ============================================================================
// POSTER (8.5" × 11") - Full page display
// ============================================================================

export async function generatePoster(config: PrebuildConfig, brandIcons: BrandIcon[] = []): Promise<jsPDF> {
  const width = CARD_SIZES.poster.width;
  const height = CARD_SIZES.poster.height;
  const colors = getThemeColors(config);
  const margin = 0.35;
  const contentWidth = width - margin * 2;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [width, height] });

  // ─── HEADER BAR ───
  const headerHeight = 0.7;
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(0, 0, width, headerHeight, 'F');

  // Accent stripe at bottom of header
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(0, headerHeight - 0.05, width, 0.05, 'F');

  // Store name in header
  if (config.storeName) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.storeName, width / 2, 0.45, { align: 'center' });
  }

  let y = headerHeight + 0.2;

  // ─── LOGO ───
  if (config.storeLogo) {
    const { height: logoH } = await addImageToPdf(doc, config.storeLogo, margin, y, contentWidth, 0.6);
    y += logoH + 0.15;
  }

  // ─── BADGES ROW ───
  const posterBadges: { text: string; bg: [number, number, number]; fg: [number, number, number] }[] = [];

  if (config.condition) {
    const cc = CONDITION_CONFIG[config.condition];
    posterBadges.push({ text: cc.shortLabel, bg: hexToRgb(cc.bgColor), fg: hexToRgb(cc.color) });
  }
  if (config.buildTier) {
    posterBadges.push({ text: config.buildTier, bg: hexToRgb(colors.primary), fg: [255, 255, 255] });
  }
  if (config.saleInfo?.enabled) {
    const saleText = config.saleInfo.originalPrice && config.price
      ? `${config.saleInfo.badgeText} ${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF`
      : config.saleInfo.badgeText;
    posterBadges.push({ text: saleText, bg: [220, 38, 38], fg: [255, 255, 255] });
  }
  if (config.stockStatus) {
    const sc = STOCK_STATUS_CONFIG[config.stockStatus];
    posterBadges.push({ text: sc.label, bg: hexToRgb(sc.bgColor), fg: hexToRgb(sc.color) });
  }

  if (posterBadges.length > 0) {
    doc.setFontSize(12);
    let totalW = posterBadges.reduce((sum, b) => sum + doc.getTextWidth(b.text) + 0.3, 0) + (posterBadges.length - 1) * 0.1;
    let bx = (width - totalW) / 2;

    for (const badge of posterBadges) {
      const bw = drawBadge(doc, badge.text, bx, y, badge.bg, badge.fg, 12, 0.12, 0.06, 0.06);
      bx += bw + 0.1;
    }
    y += 0.4;
  }

  // ─── MODEL NAME ───
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkenColor(colors.accent, 0.1));
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, width / 2, y + 0.3, { align: 'center' });
  y += modelLines.length * 0.4 + 0.15;

  // ─── PRICE SECTION ───
  // Strike price if on sale
  if (config.saleInfo?.enabled && config.saleInfo.originalPrice) {
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    const origW = doc.getTextWidth(config.saleInfo.originalPrice);
    doc.text(config.saleInfo.originalPrice, width / 2, y + 0.2, { align: 'center' });
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.015);
    doc.line(width / 2 - origW / 2 - 0.03, y + 0.14, width / 2 + origW / 2 + 0.03, y + 0.14);
    y += 0.28;
  }

  // Main price box
  const priceBoxH = 0.75;
  doc.setFillColor(...lightenColor(colors.priceColor, 0.92));
  doc.roundedRect(margin + 0.3, y, contentWidth - 0.6, priceBoxH, 0.08, 0.08, 'F');

  // Side accents on price box
  doc.setFillColor(...hexToRgb(colors.priceColor));
  doc.roundedRect(margin + 0.3, y, 0.06, priceBoxH, 0.03, 0.03, 'F');
  doc.roundedRect(width - margin - 0.36, y, 0.06, priceBoxH, 0.03, 0.03, 'F');

  doc.setFontSize(56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb(colors.priceColor));
  doc.text(config.price || '$0', width / 2, y + 0.55, { align: 'center' });
  y += priceBoxH + 0.1;

  // Financing info
  if (config.financingInfo?.enabled && config.price) {
    const monthly = calculateMonthlyPayment(config.price, config.financingInfo.months, config.financingInfo.apr);
    if (monthly) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      let finText = `Or as low as $${monthly}/mo for ${config.financingInfo.months} months`;
      if (config.financingInfo.apr > 0) finText += ` @ ${config.financingInfo.apr}% APR`;
      doc.text(finText, width / 2, y + 0.12, { align: 'center' });
      y += 0.28;
    }
  }

  // ─── SPECIFICATIONS SECTION ───
  y += 0.15;

  // Section header with background
  const specHeaderH = 0.4;
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(0, y, width, specHeaderH, 'F');
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(0, y + specHeaderH - 0.04, width, 0.04, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SPECIFICATIONS', width / 2, y + 0.26, { align: 'center' });
  y += specHeaderH + 0.2;

  // Spec cards - 2 columns, 4 rows
  const cardWidth = (contentWidth - 0.2) / 2;
  const cardHeight = 0.7;
  const cardGap = 0.15;
  const allSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

  for (let row = 0; row < 4; row++) {
    const leftSpec = allSpecs[row];
    const rightSpec = allSpecs[row + 4];
    const cardY = y + row * (cardHeight + cardGap);

    // Left card
    if (config.components[leftSpec]) {
      // Card background
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, cardY, cardWidth, cardHeight, 0.06, 0.06, 'F');

      // Left accent
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.roundedRect(margin, cardY, 0.05, cardHeight, 0.025, 0.025, 'F');

      // Label
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(COMPONENT_LABELS[leftSpec].toUpperCase(), margin + 0.15, cardY + 0.22);

      // Value with optional brand icon
      const brandIcon = findBrandIcon(config.components[leftSpec], brandIcons);
      let valueX = margin + 0.15;
      if (brandIcon) {
        await addImageToPdf(doc, brandIcon.image, margin + 0.15, cardY + 0.32, 0.28, 0.28, false);
        valueX += 0.32;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valueLines = doc.splitTextToSize(config.components[leftSpec], cardWidth - (valueX - margin) - 0.15);
      doc.text(valueLines[0], valueX, cardY + 0.5);
    }

    // Right card
    if (config.components[rightSpec]) {
      const rightX = margin + cardWidth + 0.2;

      // Card background
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(rightX, cardY, cardWidth, cardHeight, 0.06, 0.06, 'F');

      // Left accent
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.roundedRect(rightX, cardY, 0.05, cardHeight, 0.025, 0.025, 'F');

      // Label
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(COMPONENT_LABELS[rightSpec].toUpperCase(), rightX + 0.15, cardY + 0.22);

      // Value with optional brand icon
      const brandIcon = findBrandIcon(config.components[rightSpec], brandIcons);
      let valueX = rightX + 0.15;
      if (brandIcon) {
        await addImageToPdf(doc, brandIcon.image, rightX + 0.15, cardY + 0.32, 0.28, 0.28, false);
        valueX += 0.32;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valueLines = doc.splitTextToSize(config.components[rightSpec], cardWidth - (valueX - rightX) - 0.15);
      doc.text(valueLines[0], valueX, cardY + 0.5);
    }
  }

  y += 4 * (cardHeight + cardGap) + 0.1;

  // ─── ADDITIONAL INFO BAR ───
  const additionalInfo = [
    { label: 'OS', value: config.os },
    { label: 'CONNECTIVITY', value: config.wifi },
    { label: 'WARRANTY', value: config.warranty },
  ].filter(item => item.value);

  if (additionalInfo.length > 0) {
    const infoBarH = 0.6;
    doc.setFillColor(...lightenColor(colors.primary, 0.88));
    doc.roundedRect(margin, y, contentWidth, infoBarH, 0.06, 0.06, 'F');

    const colW = contentWidth / additionalInfo.length;
    additionalInfo.forEach((info, i) => {
      const cx = margin + colW * i + colW / 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(info.label, cx, y + 0.2, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valLines = doc.splitTextToSize(info.value!, colW - 0.2);
      doc.text(valLines[0], cx, y + 0.42, { align: 'center' });
    });
    y += infoBarH + 0.15;
  }

  // ─── DESCRIPTION ───
  if (config.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(config.description, contentWidth - 0.5);
    doc.text(descLines.slice(0, 2), width / 2, y + 0.12, { align: 'center' });
    y += descLines.slice(0, 2).length * 0.16 + 0.1;
  }

  // ─── FEATURE BADGES ───
  if (config.features.length > 0) {
    doc.setFontSize(9);
    const features = config.features.slice(0, 6);
    let totalW = features.reduce((sum, f) => sum + doc.getTextWidth(f) + 0.18, 0) + (features.length - 1) * 0.06;

    if (totalW <= contentWidth) {
      let fx = (width - totalW) / 2;
      for (const feature of features) {
        const fw = drawBadge(doc, feature, fx, y, hexToRgb(colors.primary), [255, 255, 255], 9, 0.08, 0.04, 0.04);
        fx += fw + 0.06;
      }
    }
  }

  // ─── FOOTER SECTION ───
  const footerY = height - 0.55;

  // Product image & QR code
  const { visualSettings } = config;
  if (visualSettings?.productImage || (visualSettings?.showQrCode && visualSettings?.qrCodeUrl)) {
    const imgSize = 0.6;
    if (visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addQrCodeToPdf(doc, visualSettings.qrCodeUrl, width - margin - imgSize, footerY - imgSize - 0.1, imgSize);
    }
  }

  // Barcode
  if (config.sku && isValidBarcode(config.sku)) {
    addBarcodeToPdf(doc, config.sku, margin, footerY - 0.05, 1.8, 0.3);
  }

  // SKU text
  if (config.sku) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`SKU: ${config.sku}`, margin, footerY + 0.35);
  }

  // Bottom accent bar
  doc.setFillColor(...hexToRgb(colors.accent));
  doc.rect(0, height - 0.1, width, 0.1, 'F');
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(0, height - 0.1, width, 0.03, 'F');

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
