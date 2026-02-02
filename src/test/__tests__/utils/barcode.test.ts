/**
 * Tests for src/utils/barcode.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidBarcode, generateBarcodeDataUrl } from '../../../utils/barcode';

// Mock canvas toDataURL since jsdom doesn't support it
const mockToDataURL = vi.fn(() => 'data:image/png;base64,mockBarcodeData');

// Override document.createElement to return a canvas with mocked toDataURL
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  const element = originalCreateElement(tagName);
  if (tagName === 'canvas') {
    element.toDataURL = mockToDataURL;
  }
  return element;
});

// Mock JsBarcode
vi.mock('jsbarcode', () => ({
  default: vi.fn((canvas, text, options) => {
    // Simulate JsBarcode behavior
    if (!text || text.length === 0) {
      throw new Error('Empty text');
    }
    // The mock will just set some canvas properties
    if (canvas.getContext) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillRect(0, 0, 100, options?.height || 50);
      }
    }
  }),
}));

describe('isValidBarcode', () => {
  describe('valid barcodes', () => {
    it('should accept alphanumeric codes', () => {
      expect(isValidBarcode('ABC123')).toBe(true);
      expect(isValidBarcode('SKU-001')).toBe(true);
      expect(isValidBarcode('Product_123_XYZ')).toBe(true);
    });

    it('should accept numeric codes', () => {
      expect(isValidBarcode('123456789')).toBe(true);
      expect(isValidBarcode('012345678901')).toBe(true);
    });

    it('should accept codes with special ASCII characters', () => {
      expect(isValidBarcode('SKU-001/A')).toBe(true);
      expect(isValidBarcode('ITEM.123')).toBe(true);
      expect(isValidBarcode('CODE_123+ABC')).toBe(true);
    });

    it('should accept codes up to 80 characters', () => {
      const code80 = 'A'.repeat(80);
      expect(isValidBarcode(code80)).toBe(true);
    });
  });

  describe('invalid barcodes', () => {
    it('should reject empty strings', () => {
      expect(isValidBarcode('')).toBe(false);
    });

    it('should reject codes over 80 characters', () => {
      const code81 = 'A'.repeat(81);
      expect(isValidBarcode(code81)).toBe(false);
    });

    it('should reject non-ASCII characters', () => {
      expect(isValidBarcode('SKU-émoji')).toBe(false);
      expect(isValidBarcode('商品123')).toBe(false);
      expect(isValidBarcode('Ö123')).toBe(false);
    });
  });
});

describe('generateBarcodeDataUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToDataURL.mockReturnValue('data:image/png;base64,mockBarcodeData');
  });

  it('should return empty string for empty text', () => {
    const result = generateBarcodeDataUrl('');
    expect(result).toBe('');
  });

  it('should generate data URL for valid text', () => {
    const result = generateBarcodeDataUrl('ABC123');
    expect(result).toBe('data:image/png;base64,mockBarcodeData');
    expect(mockToDataURL).toHaveBeenCalledWith('image/png');
  });

  it('should accept custom options', () => {
    const result = generateBarcodeDataUrl('ABC123', {
      format: 'CODE128',
      width: 3,
      height: 100,
      displayValue: false,
    });
    expect(result).toBe('data:image/png;base64,mockBarcodeData');
  });

  it('should use default format CODE128', async () => {
    const JsBarcode = vi.mocked(await import('jsbarcode')).default;
    generateBarcodeDataUrl('TEST');
    expect(JsBarcode).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      'TEST',
      expect.objectContaining({ format: 'CODE128' })
    );
  });

  it('should handle barcode generation errors gracefully', async () => {
    const JsBarcode = vi.mocked(await import('jsbarcode')).default;
    JsBarcode.mockImplementationOnce(() => {
      throw new Error('Invalid barcode');
    });

    const result = generateBarcodeDataUrl('INVALID');
    expect(result).toBe('');
  });
});
