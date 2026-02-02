import JsBarcode from 'jsbarcode';
import { logger } from './logger';

/**
 * Generate barcode as data URL
 */
export function generateBarcodeDataUrl(text: string, options?: {
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}): string {
  if (!text) {
    logger.debug('Barcode', 'Skipping barcode generation - no text provided');
    return '';
  }

  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, text, {
      format: options?.format || 'CODE128',
      width: options?.width || 2,
      height: options?.height || 50,
      displayValue: options?.displayValue ?? true,
      fontSize: 12,
      margin: 5,
    });
    logger.debug('Barcode', 'Successfully generated barcode', { text, format: options?.format || 'CODE128' });
    return canvas.toDataURL('image/png');
  } catch (err) {
    logger.error('Barcode', 'Failed to generate barcode', err);
    return '';
  }
}

/**
 * Check if text is valid for barcode generation
 */
export function isValidBarcode(text: string): boolean {
  // CODE128 accepts most ASCII characters
  const isValid = text.length > 0 && text.length <= 80 && /^[\x00-\x7F]+$/.test(text);
  if (!isValid && text.length > 0) {
    logger.debug('Barcode', 'Invalid barcode text', { text, length: text.length });
  }
  return isValid;
}
