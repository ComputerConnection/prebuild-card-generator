import JsBarcode from 'jsbarcode';

/**
 * Generate barcode as data URL
 */
export function generateBarcodeDataUrl(text: string, options?: {
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}): string {
  if (!text) return '';

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
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate barcode:', err);
    return '';
  }
}

/**
 * Check if text is valid for barcode generation
 */
export function isValidBarcode(text: string): boolean {
  // CODE128 accepts most ASCII characters
  return text.length > 0 && text.length <= 80 && /^[\x00-\x7F]+$/.test(text);
}
