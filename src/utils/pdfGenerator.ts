import { jsPDF } from 'jspdf';
import { PrebuildConfig, CardSize, BrandIcon } from '../types';
import {
  generateShelfTag,
  generateShelfTagMultiUp,
  generatePriceCard,
  generatePriceCardMultiUp,
  generatePoster,
} from './pdfRenderers';

// Re-export renderer functions so the public API stays unchanged
export {
  generateShelfTag,
  generateShelfTagMultiUp,
  generatePriceCard,
  generatePriceCardMultiUp,
  generatePoster,
};

// ============================================================================
// ORCHESTRATION FUNCTIONS
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
