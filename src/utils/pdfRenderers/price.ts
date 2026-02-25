import { jsPDF } from 'jspdf';
import {
  PrebuildConfig,
  CARD_SIZES,
  COMPONENT_LABELS,
  ComponentCategory,
  getThemeColors,
  BrandIcon,
} from '../../types';
import { findBrandIcon } from '../brandDetection';
import { getLayoutConfig, getMultiUpConfig } from '../pdfLayouts';
import {
  hexToRgb,
  lightenColor,
  darkenColor,
  addImageToPdf,
  addQrCodeToPdf,
  drawBadge,
  buildBadgesFromConfig,
  renderBadgeRow,
  renderHeaderBar,
  renderPriceSection,
  renderFinancingInfo,
  renderFooter,
  renderInfoBar,
} from '../pdfHelpers';

// ============================================================================
// PRICE CARD (4" x 6") - Medium display card
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
