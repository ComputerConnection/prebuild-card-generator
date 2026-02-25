import { jsPDF } from 'jspdf';
import {
  PrebuildConfig,
  CardSize,
  CARD_SIZES,
  COMPONENT_LABELS,
  ComponentCategory,
  getThemeColors,
  BrandIcon,
  formatPrice,
} from '../types';
import { findBrandIcon } from './brandDetection';
import { isValidBarcode } from './barcode';
import {
  getLayoutConfig,
  getMultiUpConfig,
  POSTER_SPEC_CARD,
  POSTER_SPEC_HEADER,
} from './pdfLayouts';
import {
  hexToRgb,
  lightenColor,
  darkenColor,
  addImageToPdf,
  addQrCodeToPdf,
  addBarcodeToPdf,
  drawBadge,
  buildBadgesFromConfig,
  renderBadgeRow,
  renderHeaderBar,
  renderPriceSection,
  renderFinancingInfo,
  renderFooter,
  renderSpecLine,
  renderInfoBar,
} from './pdfHelpers';

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
    const { height: logoH } = await addImageToPdf(
      doc,
      config.storeLogo,
      offsetX + layout.margin,
      y,
      contentWidth,
      layout.logoMaxHeight
    );
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
      doc,
      key,
      config.components[key],
      brandIcons,
      offsetX + layout.margin,
      y,
      contentWidth,
      colors,
      layout.specs.iconSize,
      layout.fontSize.specLabel,
      layout.fontSize.specValue
    );
  }

  // Footer
  await renderFooter(
    doc,
    config,
    offsetX,
    offsetY + height - layout.footer.offsetFromBottom,
    width,
    layout.footer.barcodeWidth,
    layout.footer.barcodeHeight,
    layout.footer.skuFontSize
  );
}

export async function generateShelfTag(
  config: PrebuildConfig,
  brandIcons: BrandIcon[] = []
): Promise<jsPDF> {
  const size = CARD_SIZES.shelf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [size.width, size.height] });
  await drawShelfTagAt(doc, config, 0, 0, brandIcons);
  return doc;
}

export async function generateShelfTagMultiUp(
  config: PrebuildConfig,
  includeCropMarks: boolean = true,
  brandIcons: BrandIcon[] = []
): Promise<jsPDF> {
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
  doc.text(
    `${config.modelName || 'PC Build'} - Shelf Tags (${totalCards} per page)`,
    multiUp.pageWidth / 2,
    multiUp.pageHeight - multiUp.footerY,
    { align: 'center' }
  );

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
    const { height: logoH } = await addImageToPdf(
      doc,
      config.storeLogo,
      offsetX + layout.margin,
      y,
      contentWidth,
      layout.logoMaxHeight
    );
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
    const totalW =
      features.reduce((sum, f) => sum + doc.getTextWidth(f) + layout.featureBadge.paddingX * 2, 0) +
      (features.length - 1) * layout.featureBadge.spacing;
    let fx = centerX - totalW / 2;

    for (const feature of features) {
      const fw = drawBadge(
        doc,
        feature,
        fx,
        y,
        lightenColor(colors.primary, 0.15),
        hexToRgb(colors.primary),
        layout.featureBadge.fontSize,
        layout.featureBadge.paddingX,
        layout.featureBadge.paddingY,
        layout.featureBadge.radius
      );
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
  doc.roundedRect(
    offsetX + layout.margin,
    y,
    layout.specs.accentWidth,
    specsHeight,
    0.025,
    0.025,
    'F'
  );

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
      await addImageToPdf(
        doc,
        brandIcon.image,
        specX,
        leftY + 0.12,
        layout.specs.iconSize,
        layout.specs.iconSize,
        false
      );
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
      await addImageToPdf(
        doc,
        brandIcon.image,
        rightX,
        rightY + 0.12,
        layout.specs.iconSize,
        layout.specs.iconSize,
        false
      );
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
  y = renderInfoBar(
    doc,
    config,
    colors,
    offsetX + layout.margin,
    y,
    contentWidth,
    layout.infoBar.height,
    layout.infoBar.labelFontSize,
    layout.infoBar.valueFontSize
  );

  // Product image & QR code
  const { visualSettings } = config;
  if (visualSettings?.productImage || (visualSettings?.showQrCode && visualSettings?.qrCodeUrl)) {
    const imgSize = layout.media.imageSize;
    if (visualSettings.productImage && visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addImageToPdf(
        doc,
        visualSettings.productImage,
        offsetX + layout.margin,
        y,
        imgSize,
        imgSize,
        false
      );
      await addQrCodeToPdf(
        doc,
        visualSettings.qrCodeUrl,
        offsetX + width - layout.margin - layout.media.qrSize,
        y,
        layout.media.qrSize
      );
    } else if (visualSettings.productImage) {
      await addImageToPdf(
        doc,
        visualSettings.productImage,
        centerX - imgSize / 2,
        y,
        imgSize,
        imgSize,
        false
      );
    } else if (visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      await addQrCodeToPdf(
        doc,
        visualSettings.qrCodeUrl,
        centerX - layout.media.qrSize / 2,
        y,
        layout.media.qrSize
      );
    }
  }

  // Footer
  const footerY = offsetY + height - layout.footer.offsetFromBottom;
  await renderFooter(
    doc,
    config,
    offsetX,
    footerY,
    width,
    layout.footer.barcodeWidth,
    layout.footer.barcodeHeight,
    layout.footer.skuFontSize
  );

  // Bottom accent line
  doc.setFillColor(...hexToRgb(colors.primary));
  doc.rect(
    offsetX,
    offsetY + height - layout.footer.accentHeight,
    width,
    layout.footer.accentHeight,
    'F'
  );
}

export async function generatePriceCard(
  config: PrebuildConfig,
  brandIcons: BrandIcon[] = []
): Promise<jsPDF> {
  const size = CARD_SIZES.price;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: [size.width, size.height] });
  await drawPriceCardAt(doc, config, 0, 0, brandIcons);
  return doc;
}

export async function generatePriceCardMultiUp(
  config: PrebuildConfig,
  includeCropMarks: boolean = true,
  brandIcons: BrandIcon[] = []
): Promise<jsPDF> {
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
  doc.text(
    `${config.modelName || 'PC Build'} - Price Cards (${totalCards} per page)`,
    multiUp.pageWidth / 2,
    multiUp.pageHeight - multiUp.footerY,
    { align: 'center' }
  );

  return doc;
}

// ============================================================================
// POSTER (8.5" × 11") - Full page display
// ============================================================================

export async function generatePoster(
  config: PrebuildConfig,
  brandIcons: BrandIcon[] = []
): Promise<jsPDF> {
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
    const { height: logoH } = await addImageToPdf(
      doc,
      config.storeLogo,
      layout.margin,
      y,
      contentWidth,
      layout.logoMaxHeight
    );
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
  doc.roundedRect(
    layout.margin + 0.3,
    y,
    contentWidth - 0.6,
    priceBoxH,
    layout.price.boxRadius,
    layout.price.boxRadius,
    'F'
  );

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
  doc.rect(
    0,
    y + POSTER_SPEC_HEADER.height - POSTER_SPEC_HEADER.accentHeight,
    width,
    POSTER_SPEC_HEADER.accentHeight,
    'F'
  );

  doc.setFontSize(POSTER_SPEC_HEADER.fontSize);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('SPECIFICATIONS', centerX, y + POSTER_SPEC_HEADER.titleY, { align: 'center' });
  y += POSTER_SPEC_HEADER.height + layout.spacing.sectionGap;

  // Spec cards - 2 columns, 4 rows
  const cardWidth = (contentWidth - 0.2) / 2;
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

  for (let row = 0; row < 4; row++) {
    const leftSpec = allSpecs[row];
    const rightSpec = allSpecs[row + 4];
    const cardY = y + row * (POSTER_SPEC_CARD.height + POSTER_SPEC_CARD.gap);

    // Left card
    if (config.components[leftSpec]) {
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(
        layout.margin,
        cardY,
        cardWidth,
        POSTER_SPEC_CARD.height,
        POSTER_SPEC_CARD.radius,
        POSTER_SPEC_CARD.radius,
        'F'
      );
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.roundedRect(
        layout.margin,
        cardY,
        POSTER_SPEC_CARD.accentWidth,
        POSTER_SPEC_CARD.height,
        0.025,
        0.025,
        'F'
      );

      doc.setFontSize(layout.fontSize.specLabel);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(
        COMPONENT_LABELS[leftSpec].toUpperCase(),
        layout.margin + POSTER_SPEC_CARD.contentPadding,
        cardY + POSTER_SPEC_CARD.labelY
      );

      const brandIcon = findBrandIcon(config.components[leftSpec], brandIcons);
      let valueX = layout.margin + POSTER_SPEC_CARD.contentPadding;
      if (brandIcon) {
        await addImageToPdf(
          doc,
          brandIcon.image,
          layout.margin + POSTER_SPEC_CARD.contentPadding,
          cardY + POSTER_SPEC_CARD.iconY,
          layout.specs.iconSize,
          layout.specs.iconSize,
          false
        );
        valueX += layout.specs.iconSize + 0.04;
      }

      doc.setFontSize(layout.fontSize.specValue);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valueLines = doc.splitTextToSize(
        config.components[leftSpec],
        cardWidth - (valueX - layout.margin) - 0.15
      );
      doc.text(valueLines[0], valueX, cardY + POSTER_SPEC_CARD.valueY);
    }

    // Right card
    if (config.components[rightSpec]) {
      const rightX = layout.margin + cardWidth + 0.2;

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(
        rightX,
        cardY,
        cardWidth,
        POSTER_SPEC_CARD.height,
        POSTER_SPEC_CARD.radius,
        POSTER_SPEC_CARD.radius,
        'F'
      );
      doc.setFillColor(...hexToRgb(colors.primary));
      doc.roundedRect(
        rightX,
        cardY,
        POSTER_SPEC_CARD.accentWidth,
        POSTER_SPEC_CARD.height,
        0.025,
        0.025,
        'F'
      );

      doc.setFontSize(layout.fontSize.specLabel);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...hexToRgb(colors.primary));
      doc.text(
        COMPONENT_LABELS[rightSpec].toUpperCase(),
        rightX + POSTER_SPEC_CARD.contentPadding,
        cardY + POSTER_SPEC_CARD.labelY
      );

      const brandIcon = findBrandIcon(config.components[rightSpec], brandIcons);
      let valueX = rightX + POSTER_SPEC_CARD.contentPadding;
      if (brandIcon) {
        await addImageToPdf(
          doc,
          brandIcon.image,
          rightX + POSTER_SPEC_CARD.contentPadding,
          cardY + POSTER_SPEC_CARD.iconY,
          layout.specs.iconSize,
          layout.specs.iconSize,
          false
        );
        valueX += layout.specs.iconSize + 0.04;
      }

      doc.setFontSize(layout.fontSize.specValue);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      const valueLines = doc.splitTextToSize(
        config.components[rightSpec],
        cardWidth - (valueX - rightX) - 0.15
      );
      doc.text(valueLines[0], valueX, cardY + POSTER_SPEC_CARD.valueY);
    }
  }

  y += 4 * (POSTER_SPEC_CARD.height + POSTER_SPEC_CARD.gap) + 0.1;

  // Additional info bar
  y = renderInfoBar(
    doc,
    config,
    colors,
    layout.margin,
    y,
    contentWidth,
    layout.infoBar.height,
    layout.infoBar.labelFontSize,
    layout.infoBar.valueFontSize
  );

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
    const totalW =
      features.reduce((sum, f) => sum + doc.getTextWidth(f) + layout.featureBadge.paddingX * 2, 0) +
      (features.length - 1) * layout.featureBadge.spacing;

    if (totalW <= contentWidth) {
      let fx = centerX - totalW / 2;
      for (const feature of features) {
        const fw = drawBadge(
          doc,
          feature,
          fx,
          y,
          hexToRgb(colors.primary),
          [255, 255, 255],
          layout.featureBadge.fontSize,
          layout.featureBadge.paddingX,
          layout.featureBadge.paddingY,
          layout.featureBadge.radius
        );
        fx += fw + layout.featureBadge.spacing;
      }
    }
  }

  // Footer section
  const footerY = height - layout.footer.offsetFromBottom;

  // QR code
  const { visualSettings } = config;
  if (visualSettings?.showQrCode && visualSettings?.qrCodeUrl) {
    await addQrCodeToPdf(
      doc,
      visualSettings.qrCodeUrl,
      width - layout.margin - layout.media.qrSize,
      footerY - 0.7,
      layout.media.qrSize
    );
  }

  // Barcode
  if (config.sku && isValidBarcode(config.sku)) {
    await addBarcodeToPdf(
      doc,
      config.sku,
      layout.margin,
      footerY - 0.05,
      layout.footer.barcodeWidth,
      layout.footer.barcodeHeight
    );
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

export async function generatePDF(
  config: PrebuildConfig,
  cardSize: CardSize,
  brandIcons: BrandIcon[] = []
): Promise<jsPDF> {
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
