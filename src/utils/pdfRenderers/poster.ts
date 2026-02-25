import { jsPDF } from 'jspdf';
import {
  PrebuildConfig,
  CARD_SIZES,
  COMPONENT_LABELS,
  ComponentCategory,
  getThemeColors,
  BrandIcon,
  formatPrice,
} from '../../types';
import { findBrandIcon } from '../brandDetection';
import { isValidBarcode } from '../barcode';
import {
  getLayoutConfig,
  POSTER_SPEC_CARD,
  POSTER_SPEC_HEADER,
} from '../pdfLayouts';
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
  renderFinancingInfo,
  renderInfoBar,
} from '../pdfHelpers';

// ============================================================================
// POSTER (8.5" x 11") - Full page display
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
