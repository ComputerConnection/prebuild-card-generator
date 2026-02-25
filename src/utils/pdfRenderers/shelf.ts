import { jsPDF } from 'jspdf';
import {
  PrebuildConfig,
  CARD_SIZES,
  ComponentCategory,
  getThemeColors,
  BrandIcon,
} from '../../types';
import { getLayoutConfig, getMultiUpConfig } from '../pdfLayouts';
import {
  addImageToPdf,
  buildBadgesFromConfig,
  renderBadgeRow,
  renderHeaderBar,
  renderPriceSection,
  renderSpecLine,
  renderFooter,
} from '../pdfHelpers';

// ============================================================================
// SHELF TAG (2" x 3") - Compact retail tag
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
