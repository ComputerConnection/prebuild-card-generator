import { jsPDF } from 'jspdf';
import { PrebuildConfig, CardSize, CARD_SIZES, COMPONENT_LABELS, ComponentCategory, getThemeColors, ThemeColors } from '../types';

const COMPONENT_ORDER: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function addLogoToPdf(doc: jsPDF, logo: string, x: number, y: number, maxWidth: number, maxHeight: number): Promise<number> {
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

      const centeredX = x + (maxWidth - width) / 2;
      doc.addImage(img, 'PNG', centeredX, y, width, height);
      resolve(height);
    };
    img.onerror = () => resolve(0);
    img.src = logo;
  });
}

function drawHeaderBarAt(doc: jsPDF, colors: ThemeColors, x: number, y: number, width: number, height: number) {
  const [r, g, b] = hexToRgb(colors.accent);
  doc.setFillColor(r, g, b);
  doc.rect(x, y, width, height, 'F');
}

function drawFeatureBadge(doc: jsPDF, text: string, x: number, y: number, colors: ThemeColors): number {
  const [r, g, b] = hexToRgb(colors.primary);
  const padding = 0.08;
  const textWidth = doc.getTextWidth(text);
  const badgeWidth = textWidth + (padding * 2);
  const badgeHeight = 0.22;

  doc.setFillColor(r, g, b);
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 0.05, 0.05, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(text, x + padding, y + 0.155);
  doc.setTextColor(0, 0, 0);

  return badgeWidth + 0.1;
}

// Draw a single shelf tag at a specific position
async function drawShelfTagAt(
  doc: jsPDF,
  config: PrebuildConfig,
  offsetX: number,
  offsetY: number
): Promise<void> {
  const size = CARD_SIZES.shelf;
  const colors = getThemeColors(config);
  const margin = 0.1;
  const contentWidth = size.width - (margin * 2);
  let y = offsetY;

  // Header bar
  drawHeaderBarAt(doc, colors, offsetX, offsetY, size.width, 0.25);
  y = offsetY + 0.08;

  // Store name in header (white text)
  if (config.storeName) {
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.storeName, offsetX + size.width / 2, y + 0.08, { align: 'center' });
  }
  doc.setTextColor(0, 0, 0);
  y = offsetY + 0.3;

  // Store logo (small)
  if (config.storeLogo) {
    const logoHeight = await addLogoToPdf(doc, config.storeLogo, offsetX + margin, y, contentWidth, 0.25);
    y += logoHeight + 0.08;
  }

  // Model name
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, offsetX + size.width / 2, y + 0.1, { align: 'center' });
  y += modelLines.length * 0.12 + 0.08;

  // Build tier badge (if set)
  if (config.buildTier) {
    doc.setFontSize(5);
    const [r, g, b] = hexToRgb(colors.primary);
    doc.setFillColor(r, g, b);
    const tierWidth = doc.getTextWidth(config.buildTier) + 0.1;
    doc.roundedRect(offsetX + (size.width - tierWidth) / 2, y, tierWidth, 0.14, 0.03, 0.03, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(config.buildTier, offsetX + size.width / 2, y + 0.1, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 0.2;
  }

  // Price (prominent, colored)
  const [pr, pg, pb] = hexToRgb(colors.priceColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(config.price || '$0', offsetX + size.width / 2, y + 0.15, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 0.25;

  // Key specs only (CPU, GPU, RAM, Storage)
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  const keySpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];

  for (const key of keySpecs) {
    const value = config.components[key];
    if (value) {
      doc.setFont('helvetica', 'bold');
      const labelText = `${COMPONENT_LABELS[key]}: `;
      doc.text(labelText, offsetX + margin, y + 0.06);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(labelText);
      const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth);
      doc.text(valueLines[0], offsetX + margin + labelWidth, y + 0.06);
      y += 0.1;
    }
  }

  // SKU at bottom
  if (config.sku) {
    doc.setFontSize(4);
    doc.setTextColor(128, 128, 128);
    doc.text(`SKU: ${config.sku}`, offsetX + size.width / 2, offsetY + size.height - 0.08, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
}

export async function generateShelfTag(config: PrebuildConfig): Promise<jsPDF> {
  const size = CARD_SIZES.shelf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [size.width, size.height]
  });

  await drawShelfTagAt(doc, config, 0, 0);
  return doc;
}

// Multi-up shelf tags: 12 tags on a letter page (4 columns x 3 rows)
export async function generateShelfTagMultiUp(config: PrebuildConfig, includeCropMarks: boolean = true): Promise<jsPDF> {
  const pageWidth = 8.5;
  const pageHeight = 11;
  const tagWidth = CARD_SIZES.shelf.width;  // 2"
  const tagHeight = CARD_SIZES.shelf.height; // 3"

  const cols = 4;
  const rows = 3;

  // Calculate margins to center the grid
  const gridWidth = cols * tagWidth;
  const gridHeight = rows * tagHeight;
  const marginX = (pageWidth - gridWidth) / 2;
  const marginY = (pageHeight - gridHeight) / 2;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  // Draw crop marks if enabled
  if (includeCropMarks) {
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.01);
    const cropMarkLength = 0.15;

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const x = marginX + col * tagWidth;
        const y = marginY + row * tagHeight;

        // Draw corner crop marks
        // Top-left corner marks
        if (col > 0 || row > 0) {
          // Horizontal mark going left
          if (col > 0) {
            doc.line(x - cropMarkLength, y, x - 0.02, y);
          }
          // Vertical mark going up
          if (row > 0) {
            doc.line(x, y - cropMarkLength, x, y - 0.02);
          }
        }

        // Top-right corner marks
        if (col < cols || row > 0) {
          // Horizontal mark going right
          if (col < cols) {
            doc.line(x + 0.02, y, x + cropMarkLength, y);
          }
        }

        // Bottom-left corner marks
        if (col > 0 || row < rows) {
          // Vertical mark going down
          if (row < rows) {
            doc.line(x, y + 0.02, x, y + cropMarkLength);
          }
        }
      }
    }
  }

  // Draw all shelf tags
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = marginX + col * tagWidth;
      const y = marginY + row * tagHeight;
      await drawShelfTagAt(doc, config, x, y);
    }
  }

  // Add page info at bottom
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${config.modelName || 'PC Build'} - Shelf Tags (${cols}x${rows} = ${cols * rows} per page)`,
    pageWidth / 2,
    pageHeight - 0.2,
    { align: 'center' }
  );

  return doc;
}

// Draw a single price card at a specific position
async function drawPriceCardAt(
  doc: jsPDF,
  config: PrebuildConfig,
  offsetX: number,
  offsetY: number
): Promise<void> {
  const size = CARD_SIZES.price;
  const colors = getThemeColors(config);
  const margin = 0.2;
  const contentWidth = size.width - (margin * 2);
  let y = offsetY;

  // Header bar
  drawHeaderBarAt(doc, colors, offsetX, offsetY, size.width, 0.4);
  y = offsetY + 0.12;

  // Store name in header
  if (config.storeName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.storeName, offsetX + size.width / 2, y + 0.12, { align: 'center' });
  }
  doc.setTextColor(0, 0, 0);
  y = offsetY + 0.5;

  // Store logo
  if (config.storeLogo) {
    const logoHeight = await addLogoToPdf(doc, config.storeLogo, offsetX + margin, y, contentWidth, 0.5);
    y += logoHeight + 0.15;
  }

  // Model name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, offsetX + size.width / 2, y + 0.15, { align: 'center' });
  y += modelLines.length * 0.2 + 0.1;

  // Build tier badge
  if (config.buildTier) {
    doc.setFontSize(8);
    const [r, g, b] = hexToRgb(colors.primary);
    doc.setFillColor(r, g, b);
    const tierWidth = doc.getTextWidth(config.buildTier) + 0.2;
    doc.roundedRect(offsetX + (size.width - tierWidth) / 2, y, tierWidth, 0.22, 0.05, 0.05, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(config.buildTier, offsetX + size.width / 2, y + 0.155, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 0.32;
  }

  // Price (prominent, colored)
  const [pr, pg, pb] = hexToRgb(colors.priceColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(config.price || '$0', offsetX + size.width / 2, y + 0.3, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 0.5;

  // Divider line
  const [lr, lg, lb] = hexToRgb(colors.primary);
  doc.setDrawColor(lr, lg, lb);
  doc.setLineWidth(0.02);
  doc.line(offsetX + margin, y, offsetX + size.width - margin, y);
  y += 0.15;

  // All specs
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  for (const key of COMPONENT_ORDER) {
    const value = config.components[key];
    if (value) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${COMPONENT_LABELS[key]}:`, offsetX + margin, y + 0.1);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(value, contentWidth - 0.9);
      doc.text(valueLines, offsetX + margin + 0.9, y + 0.1);
      y += Math.max(valueLines.length * 0.12, 0.18);
    }
  }

  // OS (if set)
  if (config.os) {
    doc.setFont('helvetica', 'bold');
    doc.text('OS:', offsetX + margin, y + 0.1);
    doc.setFont('helvetica', 'normal');
    doc.text(config.os, offsetX + margin + 0.9, y + 0.1);
    y += 0.18;
  }

  // Warranty at bottom
  if (config.warranty) {
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(config.warranty, offsetX + size.width / 2, offsetY + size.height - 0.25, { align: 'center' });
  }

  // SKU at bottom
  if (config.sku) {
    doc.setFontSize(6);
    doc.setTextColor(128, 128, 128);
    doc.text(`SKU: ${config.sku}`, offsetX + size.width / 2, offsetY + size.height - 0.12, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
}

export async function generatePriceCard(config: PrebuildConfig): Promise<jsPDF> {
  const size = CARD_SIZES.price;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [size.width, size.height]
  });

  await drawPriceCardAt(doc, config, 0, 0);
  return doc;
}

// Multi-up price cards: 2 cards on a letter page (2 columns x 1 row)
export async function generatePriceCardMultiUp(config: PrebuildConfig, includeCropMarks: boolean = true): Promise<jsPDF> {
  const pageWidth = 8.5;
  const pageHeight = 11;
  const cardWidth = CARD_SIZES.price.width;  // 4"
  const cardHeight = CARD_SIZES.price.height; // 6"

  const cols = 2;
  const rows = 1;

  // Calculate margins to center the grid
  const gridWidth = cols * cardWidth;
  const gridHeight = rows * cardHeight;
  const marginX = (pageWidth - gridWidth) / 2;
  const marginY = (pageHeight - gridHeight) / 2;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter'
  });

  // Draw crop marks if enabled
  if (includeCropMarks) {
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.01);
    const cropMarkLength = 0.2;

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        const x = marginX + col * cardWidth;
        const y = marginY + row * cardHeight;

        // Horizontal marks
        if (col > 0) {
          doc.line(x - cropMarkLength, y, x - 0.03, y);
        }
        if (col < cols) {
          doc.line(x + 0.03, y, x + cropMarkLength, y);
        }

        // Vertical marks
        if (row > 0) {
          doc.line(x, y - cropMarkLength, x, y - 0.03);
        }
        if (row < rows) {
          doc.line(x, y + 0.03, x, y + cropMarkLength);
        }
      }
    }
  }

  // Draw all price cards
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = marginX + col * cardWidth;
      const y = marginY + row * cardHeight;
      await drawPriceCardAt(doc, config, x, y);
    }
  }

  // Add page info at bottom
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `${config.modelName || 'PC Build'} - Price Cards (${cols * rows} per page)`,
    pageWidth / 2,
    pageHeight - 0.2,
    { align: 'center' }
  );

  return doc;
}

export async function generatePoster(config: PrebuildConfig): Promise<jsPDF> {
  const size = CARD_SIZES.poster;
  const colors = getThemeColors(config);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [size.width, size.height]
  });

  const margin = 0.5;
  const contentWidth = size.width - (margin * 2);
  let y = 0;

  // Large header bar
  drawHeaderBarAt(doc, colors, 0, 0, size.width, 0.8);
  y = 0.25;

  // Store name in header
  if (config.storeName) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(config.storeName, size.width / 2, y + 0.2, { align: 'center' });
  }
  doc.setTextColor(0, 0, 0);
  y = 0.95;

  // Store logo (larger)
  if (config.storeLogo) {
    const logoHeight = await addLogoToPdf(doc, config.storeLogo, margin, y, contentWidth, 1.0);
    y += logoHeight + 0.25;
  }

  // Build tier badge (prominent)
  if (config.buildTier) {
    doc.setFontSize(12);
    const [r, g, b] = hexToRgb(colors.primary);
    doc.setFillColor(r, g, b);
    const tierWidth = doc.getTextWidth(config.buildTier) + 0.4;
    doc.roundedRect((size.width - tierWidth) / 2, y, tierWidth, 0.35, 0.08, 0.08, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(config.buildTier, size.width / 2, y + 0.24, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 0.5;
  }

  // Model name
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  const modelLines = doc.splitTextToSize(config.modelName || 'PC Build', contentWidth);
  doc.text(modelLines, size.width / 2, y + 0.35, { align: 'center' });
  y += modelLines.length * 0.45 + 0.25;

  // Price (very prominent, colored)
  const [pr, pg, pb] = hexToRgb(colors.priceColor);
  doc.setFontSize(56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(pr, pg, pb);
  doc.text(config.price || '$0', size.width / 2, y + 0.6, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 0.9;

  // Feature badges row
  if (config.features.length > 0) {
    doc.setFontSize(9);
    let badgeX = margin;
    const maxBadgeY = y;
    let currentY = y;

    for (const feature of config.features.slice(0, 6)) {
      const badgeWidth = doc.getTextWidth(feature) + 0.16;
      if (badgeX + badgeWidth > size.width - margin) {
        badgeX = margin;
        currentY += 0.3;
      }
      drawFeatureBadge(doc, feature, badgeX, currentY, colors);
      badgeX += badgeWidth + 0.1;
    }
    y = Math.max(maxBadgeY, currentY) + 0.45;
  }

  // Divider line
  const [lr, lg, lb] = hexToRgb(colors.primary);
  doc.setDrawColor(lr, lg, lb);
  doc.setLineWidth(0.03);
  doc.line(margin, y, size.width - margin, y);
  y += 0.35;

  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const [tr, tg, tb] = hexToRgb(colors.accent);
  doc.setTextColor(tr, tg, tb);
  doc.text('SPECIFICATIONS', size.width / 2, y + 0.15, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 0.45;

  // Two-column specs layout
  const colWidth = (contentWidth - 0.3) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 0.3;
  let leftY = y;
  let rightY = y;

  doc.setFontSize(11);
  const leftSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  const rightSpecs: ComponentCategory[] = ['motherboard', 'psu', 'case', 'cooling'];

  // Left column
  for (const key of leftSpecs) {
    const value = config.components[key];
    if (value) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(COMPONENT_LABELS[key], leftColX, leftY + 0.12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(value, colWidth);
      doc.text(valueLines, leftColX, leftY + 0.3);
      leftY += 0.3 + (valueLines.length * 0.18) + 0.1;
    }
  }

  // Right column
  for (const key of rightSpecs) {
    const value = config.components[key];
    if (value) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(tr, tg, tb);
      doc.text(COMPONENT_LABELS[key], rightColX, rightY + 0.12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(value, colWidth);
      doc.text(valueLines, rightColX, rightY + 0.3);
      rightY += 0.3 + (valueLines.length * 0.18) + 0.1;
    }
  }

  y = Math.max(leftY, rightY) + 0.15;

  // Additional info section (OS, WiFi, etc.)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.01);
  doc.line(margin, y, size.width - margin, y);
  y += 0.25;

  doc.setFontSize(10);
  const additionalInfo = [
    { label: 'Operating System', value: config.os },
    { label: 'Connectivity', value: config.wifi },
    { label: 'Warranty', value: config.warranty },
  ].filter(item => item.value);

  if (additionalInfo.length > 0) {
    const infoColWidth = contentWidth / additionalInfo.length;
    additionalInfo.forEach((info, index) => {
      const x = margin + (infoColWidth * index) + (infoColWidth / 2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text(info.label, x, y + 0.1, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(info.value!, x, y + 0.3, { align: 'center' });
    });
    y += 0.55;
  }

  // Description (if provided)
  if (config.description) {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, size.width - margin, y);
    y += 0.2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(config.description, contentWidth);
    doc.text(descLines.slice(0, 3), size.width / 2, y + 0.12, { align: 'center' });
  }

  // Footer with SKU
  if (config.sku) {
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`SKU: ${config.sku}`, size.width / 2, size.height - 0.3, { align: 'center' });
  }

  return doc;
}

export async function generatePDF(config: PrebuildConfig, cardSize: CardSize): Promise<jsPDF> {
  switch (cardSize) {
    case 'shelf':
      return generateShelfTag(config);
    case 'price':
      return generatePriceCard(config);
    case 'poster':
      return generatePoster(config);
    default:
      return generatePriceCard(config);
  }
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
