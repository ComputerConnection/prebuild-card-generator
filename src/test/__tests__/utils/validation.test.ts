/**
 * Tests for src/utils/validation.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validatePrice,
  validateSalePrice,
  validateSku,
  validateUpc,
  validateEan,
  validateUrl,
  validateFinancingMonths,
  validateApr,
  validateImageFile,
  validateImageDataUrl,
  validateStockQuantity,
  hasValidationErrors,
} from '../../../utils/validation';

describe('validatePrice', () => {
  it('should accept valid prices', () => {
    expect(validatePrice(0)).toEqual({ valid: true });
    expect(validatePrice(100)).toEqual({ valid: true });
    expect(validatePrice(999.99)).toEqual({ valid: true });
    expect(validatePrice(1000000)).toEqual({ valid: true });
  });

  it('should reject negative prices', () => {
    const result = validatePrice(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('negative');
  });

  it('should reject prices exceeding maximum', () => {
    const result = validatePrice(1000001);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('maximum');
  });
});

describe('validateSalePrice', () => {
  it('should accept valid sale prices', () => {
    expect(validateSalePrice(100, 80)).toEqual({ valid: true });
    expect(validateSalePrice(1000, 1)).toEqual({ valid: true });
  });

  it('should reject when original price is 0 or negative', () => {
    expect(validateSalePrice(0, 50).valid).toBe(false);
    expect(validateSalePrice(-10, 50).valid).toBe(false);
  });

  it('should reject when sale price is 0 or negative', () => {
    expect(validateSalePrice(100, 0).valid).toBe(false);
    expect(validateSalePrice(100, -10).valid).toBe(false);
  });

  it('should reject when sale price >= original price', () => {
    expect(validateSalePrice(100, 100).valid).toBe(false);
    expect(validateSalePrice(100, 150).valid).toBe(false);
  });
});

describe('validateSku', () => {
  it('should accept empty SKU (optional)', () => {
    expect(validateSku('')).toEqual({ valid: true });
  });

  it('should accept valid SKU formats', () => {
    expect(validateSku('ABC123')).toEqual({ valid: true });
    expect(validateSku('SKU-001-XYZ')).toEqual({ valid: true });
    expect(validateSku('Product_001')).toEqual({ valid: true });
  });

  it('should reject SKU over 80 characters', () => {
    const longSku = 'A'.repeat(81);
    expect(validateSku(longSku).valid).toBe(false);
  });

  it('should reject SKU with non-ASCII characters', () => {
    expect(validateSku('SKU-émoji').valid).toBe(false);
    expect(validateSku('SKU-日本語').valid).toBe(false);
  });
});

describe('validateUpc', () => {
  it('should accept empty UPC (optional)', () => {
    expect(validateUpc('')).toEqual({ valid: true });
  });

  it('should accept valid 12-digit UPC', () => {
    expect(validateUpc('012345678901')).toEqual({ valid: true });
    expect(validateUpc('000000000000')).toEqual({ valid: true });
  });

  it('should reject non-12-digit codes', () => {
    expect(validateUpc('12345').valid).toBe(false);
    expect(validateUpc('1234567890123').valid).toBe(false);
  });

  it('should reject non-numeric characters', () => {
    expect(validateUpc('01234567890A').valid).toBe(false);
  });
});

describe('validateEan', () => {
  it('should accept empty EAN (optional)', () => {
    expect(validateEan('')).toEqual({ valid: true });
  });

  it('should accept valid 13-digit EAN', () => {
    expect(validateEan('0123456789012')).toEqual({ valid: true });
    expect(validateEan('0000000000000')).toEqual({ valid: true });
  });

  it('should reject non-13-digit codes', () => {
    expect(validateEan('12345').valid).toBe(false);
    expect(validateEan('012345678901').valid).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should accept empty URL (optional)', () => {
    expect(validateUrl('')).toEqual({ valid: true });
  });

  it('should accept valid HTTP/HTTPS URLs', () => {
    expect(validateUrl('https://example.com')).toEqual({ valid: true });
    expect(validateUrl('http://example.com/path?query=1')).toEqual({ valid: true });
    expect(validateUrl('https://sub.domain.example.com:8080/path')).toEqual({ valid: true });
  });

  it('should reject invalid URL format', () => {
    expect(validateUrl('not-a-url').valid).toBe(false);
    expect(validateUrl('example.com').valid).toBe(false);
  });

  it('should reject non-HTTP protocols', () => {
    expect(validateUrl('ftp://example.com').valid).toBe(false);
    expect(validateUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateUrl('file:///etc/passwd').valid).toBe(false);
  });
});

describe('validateFinancingMonths', () => {
  it('should accept valid month values', () => {
    expect(validateFinancingMonths(6)).toEqual({ valid: true });
    expect(validateFinancingMonths(12)).toEqual({ valid: true });
    expect(validateFinancingMonths(120)).toEqual({ valid: true });
  });

  it('should reject non-integer values', () => {
    expect(validateFinancingMonths(6.5).valid).toBe(false);
  });

  it('should reject 0 or negative', () => {
    expect(validateFinancingMonths(0).valid).toBe(false);
    expect(validateFinancingMonths(-1).valid).toBe(false);
  });

  it('should reject values over 120', () => {
    expect(validateFinancingMonths(121).valid).toBe(false);
  });
});

describe('validateApr', () => {
  it('should accept valid APR values', () => {
    expect(validateApr(0)).toEqual({ valid: true });
    expect(validateApr(5.99)).toEqual({ valid: true });
    expect(validateApr(29.99)).toEqual({ valid: true });
    expect(validateApr(100)).toEqual({ valid: true });
  });

  it('should reject negative APR', () => {
    expect(validateApr(-1).valid).toBe(false);
  });

  it('should reject APR over 100%', () => {
    expect(validateApr(100.01).valid).toBe(false);
  });
});

describe('validateImageFile', () => {
  const createMockFile = (type: string, _size: number): File => {
    const blob = new Blob([''], { type });
    return new File([blob], 'test.jpg', { type }) as File;
  };

  it('should accept valid image types', () => {
    expect(validateImageFile(createMockFile('image/jpeg', 1000)).valid).toBe(true);
    expect(validateImageFile(createMockFile('image/png', 1000)).valid).toBe(true);
    expect(validateImageFile(createMockFile('image/gif', 1000)).valid).toBe(true);
    expect(validateImageFile(createMockFile('image/webp', 1000)).valid).toBe(true);
    expect(validateImageFile(createMockFile('image/svg+xml', 1000)).valid).toBe(true);
  });

  it('should reject invalid image types', () => {
    expect(validateImageFile(createMockFile('application/pdf', 1000)).valid).toBe(false);
    expect(validateImageFile(createMockFile('text/plain', 1000)).valid).toBe(false);
  });

  it('should reject files over 5MB', () => {
    // Create a file with size property
    const file = createMockFile('image/jpeg', 1000);
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
    expect(validateImageFile(file).valid).toBe(false);
  });
});

describe('validateImageDataUrl', () => {
  it('should accept empty data URL (optional)', () => {
    expect(validateImageDataUrl('')).toEqual({ valid: true });
  });

  it('should accept valid image data URLs', () => {
    expect(validateImageDataUrl('data:image/png;base64,abc123')).toEqual({ valid: true });
    expect(validateImageDataUrl('data:image/jpeg;base64,xyz789')).toEqual({ valid: true });
  });

  it('should reject non-image data URLs', () => {
    expect(validateImageDataUrl('data:text/plain;base64,abc').valid).toBe(false);
    expect(validateImageDataUrl('not-a-data-url').valid).toBe(false);
  });

  it('should reject overly large data URLs', () => {
    const largeData = 'A'.repeat(8 * 1024 * 1024); // 8MB base64
    expect(validateImageDataUrl(`data:image/png;base64,${largeData}`).valid).toBe(false);
  });
});

describe('validateStockQuantity', () => {
  it('should accept empty quantity (optional)', () => {
    expect(validateStockQuantity('')).toEqual({ valid: true });
  });

  it('should accept valid quantity formats', () => {
    expect(validateStockQuantity('5')).toEqual({ valid: true });
    expect(validateStockQuantity('5 units')).toEqual({ valid: true });
    expect(validateStockQuantity('10+')).toEqual({ valid: true });
    expect(validateStockQuantity('0')).toEqual({ valid: true });
  });

  it('should reject excessively large quantities', () => {
    expect(validateStockQuantity('9999999').valid).toBe(false);
  });
});

describe('hasValidationErrors', () => {
  it('should return false for empty errors', () => {
    expect(hasValidationErrors({})).toBe(false);
  });

  it('should return false when all errors are undefined', () => {
    expect(hasValidationErrors({ price: undefined, sku: undefined })).toBe(false);
  });

  it('should return true when any error is defined', () => {
    expect(hasValidationErrors({ price: 'Error message' })).toBe(true);
    expect(hasValidationErrors({ price: undefined, sku: 'Invalid' })).toBe(true);
  });
});
