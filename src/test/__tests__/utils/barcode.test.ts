/**
 * Tests for src/utils/barcode.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isValidBarcode,
  generateBarcodeDataUrl,
  BARCODE_MAX_LENGTH,
  BARCODE_DEFAULT_FORMAT,
  BARCODE_ASCII_PATTERN,
} from '../../../utils/barcode';

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

describe('barcode validation constants', () => {
  it('should export BARCODE_MAX_LENGTH as 80', () => {
    expect(BARCODE_MAX_LENGTH).toBe(80);
  });

  it('should export BARCODE_DEFAULT_FORMAT as CODE128', () => {
    expect(BARCODE_DEFAULT_FORMAT).toBe('CODE128');
  });

  it('should export BARCODE_ASCII_PATTERN as a RegExp', () => {
    expect(BARCODE_ASCII_PATTERN).toBeInstanceOf(RegExp);
    expect(BARCODE_ASCII_PATTERN.test('ABC123')).toBe(true);
    expect(BARCODE_ASCII_PATTERN.test('émoji')).toBe(false);
  });
});

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

    it('should accept single character codes', () => {
      expect(isValidBarcode('A')).toBe(true);
      expect(isValidBarcode('0')).toBe(true);
    });

    it(`should accept codes at exactly BARCODE_MAX_LENGTH (${BARCODE_MAX_LENGTH}) characters`, () => {
      const codeAtMax = 'A'.repeat(BARCODE_MAX_LENGTH);
      expect(codeAtMax.length).toBe(BARCODE_MAX_LENGTH);
      expect(isValidBarcode(codeAtMax)).toBe(true);
    });
  });

  describe('invalid barcodes', () => {
    it('should reject empty strings', () => {
      expect(isValidBarcode('')).toBe(false);
    });

    it(`should reject codes over BARCODE_MAX_LENGTH (${BARCODE_MAX_LENGTH}) characters`, () => {
      const codeOverMax = 'A'.repeat(BARCODE_MAX_LENGTH + 1);
      expect(isValidBarcode(codeOverMax)).toBe(false);
    });

    it('should reject non-ASCII characters', () => {
      expect(isValidBarcode('SKU-émoji')).toBe(false);
      expect(isValidBarcode('商品123')).toBe(false);
      expect(isValidBarcode('Ö123')).toBe(false);
    });

    it('should reject strings with emoji characters', () => {
      expect(isValidBarcode('SKU-🎉')).toBe(false);
      expect(isValidBarcode('🔥DEAL')).toBe(false);
    });

    it('should reject very long input well beyond the limit', () => {
      const veryLongCode = 'X'.repeat(1000);
      expect(isValidBarcode(veryLongCode)).toBe(false);
    });

    it('should reject strings that are purely non-ASCII', () => {
      expect(isValidBarcode('日本語のみ')).toBe(false);
      expect(isValidBarcode('кириллица')).toBe(false);
    });
  });

  describe('boundary cases', () => {
    it(`should accept code at exactly BARCODE_MAX_LENGTH (${BARCODE_MAX_LENGTH})`, () => {
      expect(isValidBarcode('A'.repeat(BARCODE_MAX_LENGTH))).toBe(true);
    });

    it(`should reject code at BARCODE_MAX_LENGTH + 1 (${BARCODE_MAX_LENGTH + 1})`, () => {
      expect(isValidBarcode('A'.repeat(BARCODE_MAX_LENGTH + 1))).toBe(false);
    });

    it('should handle whitespace-only strings as valid ASCII', () => {
      // Spaces are valid ASCII characters (0x20)
      expect(isValidBarcode(' ')).toBe(true);
      expect(isValidBarcode('   ')).toBe(true);
    });
  });
});

describe('generateBarcodeDataUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToDataURL.mockReturnValue('data:image/png;base64,mockBarcodeData');
  });

  describe('empty / missing input', () => {
    it('should return empty string for empty text', () => {
      const result = generateBarcodeDataUrl('');
      expect(result).toBe('');
    });

    it('should return empty string for undefined-like falsy text', () => {
      // The function parameter is typed as string, but the runtime guard
      // checks `!text`, which catches empty string
      expect(generateBarcodeDataUrl('')).toBe('');
    });
  });

  describe('successful generation', () => {
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
  });

  describe('format argument passed to JsBarcode', () => {
    it('should use BARCODE_DEFAULT_FORMAT when no format option is provided', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      generateBarcodeDataUrl('TEST');
      expect(JsBarcode).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        'TEST',
        expect.objectContaining({ format: BARCODE_DEFAULT_FORMAT })
      );
    });

    it('should pass a custom format to JsBarcode when specified', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      generateBarcodeDataUrl('1234567890128', { format: 'EAN13' });
      expect(JsBarcode).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        '1234567890128',
        expect.objectContaining({ format: 'EAN13' })
      );
    });

    it('should pass CODE39 format when specified', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      generateBarcodeDataUrl('ABC-123', { format: 'CODE39' });
      expect(JsBarcode).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        'ABC-123',
        expect.objectContaining({ format: 'CODE39' })
      );
    });

    it('should pass default width, height, and displayValue when no options given', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      generateBarcodeDataUrl('DEFAULTS');
      expect(JsBarcode).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        'DEFAULTS',
        expect.objectContaining({
          format: BARCODE_DEFAULT_FORMAT,
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        })
      );
    });

    it('should merge custom options with defaults', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      generateBarcodeDataUrl('CUSTOM', { width: 4, height: 80 });
      expect(JsBarcode).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        'CUSTOM',
        expect.objectContaining({
          format: BARCODE_DEFAULT_FORMAT,
          width: 4,
          height: 80,
          displayValue: true,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle barcode generation errors gracefully and return empty string', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      JsBarcode.mockImplementationOnce(() => {
        throw new Error('Invalid barcode');
      });

      const result = generateBarcodeDataUrl('INVALID');
      expect(result).toBe('');
    });

    it('should return empty string when JsBarcode throws a non-Error', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      JsBarcode.mockImplementationOnce(() => {
        throw 'string error';
      });

      const result = generateBarcodeDataUrl('THROWS_STRING');
      expect(result).toBe('');
    });

    it('should return empty string when toDataURL throws', async () => {
      mockToDataURL.mockImplementationOnce(() => {
        throw new Error('Canvas toDataURL failed');
      });

      const result = generateBarcodeDataUrl('CANVAS_FAIL');
      expect(result).toBe('');
    });

    it('should not call toDataURL if JsBarcode throws', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      JsBarcode.mockImplementationOnce(() => {
        throw new Error('JsBarcode failure');
      });

      generateBarcodeDataUrl('FAIL_EARLY');
      expect(mockToDataURL).not.toHaveBeenCalled();
    });

    it('should not call JsBarcode when text is empty', async () => {
      const JsBarcode = vi.mocked(await import('jsbarcode')).default;
      generateBarcodeDataUrl('');
      expect(JsBarcode).not.toHaveBeenCalled();
    });
  });
});
