/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// PRICE VALIDATION
// ============================================================================

const MAX_PRICE = 1_000_000; // $1M reasonable max for PC builds

export function validatePrice(price: number): ValidationResult {
  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }
  if (price > MAX_PRICE) {
    return { valid: false, error: `Price exceeds maximum ($${MAX_PRICE.toLocaleString()})` };
  }
  return { valid: true };
}

export function validateSalePrice(originalPrice: number, salePrice: number): ValidationResult {
  if (originalPrice <= 0) {
    return { valid: false, error: 'Original price must be greater than 0' };
  }
  if (salePrice <= 0) {
    return { valid: false, error: 'Sale price must be greater than 0' };
  }
  if (salePrice >= originalPrice) {
    return { valid: false, error: 'Sale price must be less than original price' };
  }
  return { valid: true };
}

// ============================================================================
// SKU / BARCODE VALIDATION
// ============================================================================

export function validateSku(sku: string): ValidationResult {
  if (!sku) {
    return { valid: true }; // SKU is optional
  }

  // Check length for barcode compatibility (CODE128 supports up to 80 chars)
  if (sku.length > 80) {
    return { valid: false, error: 'SKU too long for barcode (max 80 characters)' };
  }

  // Check for ASCII characters only (CODE128 requirement)
  if (!/^[\x20-\x7E]+$/.test(sku)) {
    return { valid: false, error: 'SKU contains invalid characters for barcode' };
  }

  return { valid: true };
}

export function validateUpc(code: string): ValidationResult {
  if (!code) {
    return { valid: true };
  }

  // UPC-A is exactly 12 digits
  if (!/^\d{12}$/.test(code)) {
    return { valid: false, error: 'UPC must be exactly 12 digits' };
  }

  return { valid: true };
}

export function validateEan(code: string): ValidationResult {
  if (!code) {
    return { valid: true };
  }

  // EAN-13 is exactly 13 digits
  if (!/^\d{13}$/.test(code)) {
    return { valid: false, error: 'EAN must be exactly 13 digits' };
  }

  return { valid: true };
}

// ============================================================================
// URL VALIDATION
// ============================================================================

export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: true }; // URL is optional when QR is disabled
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ============================================================================
// FINANCING VALIDATION
// ============================================================================

export function validateFinancingMonths(months: number): ValidationResult {
  if (!Number.isInteger(months)) {
    return { valid: false, error: 'Months must be a whole number' };
  }
  if (months <= 0) {
    return { valid: false, error: 'Months must be greater than 0' };
  }
  if (months > 120) {
    return { valid: false, error: 'Financing term cannot exceed 120 months' };
  }
  return { valid: true };
}

export function validateApr(apr: number): ValidationResult {
  if (apr < 0) {
    return { valid: false, error: 'APR cannot be negative' };
  }
  if (apr > 100) {
    return { valid: false, error: 'APR cannot exceed 100%' };
  }
  return { valid: true };
}

// ============================================================================
// IMAGE VALIDATION
// ============================================================================

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

export function validateImageFile(file: File): ValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.map((t) => t.split('/')[1]).join(', ')}`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB` };
  }

  return { valid: true };
}

export function validateImageDataUrl(dataUrl: string): ValidationResult {
  if (!dataUrl) {
    return { valid: true }; // Optional
  }

  if (!dataUrl.startsWith('data:image/')) {
    return { valid: false, error: 'Invalid image data' };
  }

  // Check approximate size (base64 is ~33% larger than binary)
  const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;
  const approximateBytes = (base64Length * 3) / 4;

  if (approximateBytes > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: `Image too large. Maximum size: ${MAX_IMAGE_SIZE_MB}MB` };
  }

  return { valid: true };
}

// ============================================================================
// STOCK QUANTITY VALIDATION
// ============================================================================

export function validateStockQuantity(quantity: string): ValidationResult {
  if (!quantity) {
    return { valid: true }; // Optional
  }

  // Allow formats like "5", "5 units", "10+"
  const numMatch = quantity.match(/^(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num < 0) {
      return { valid: false, error: 'Quantity cannot be negative' };
    }
    if (num > 999999) {
      return { valid: false, error: 'Quantity too large' };
    }
  }

  return { valid: true };
}

// ============================================================================
// COMPOSITE VALIDATION
// ============================================================================

export interface FormErrors {
  price?: string;
  sku?: string;
  originalPrice?: string;
  salePrice?: string;
  qrCodeUrl?: string;
  financingMonths?: string;
  apr?: string;
  productImage?: string;
  storeLogo?: string;
  stockQuantity?: string;
}

export function hasValidationErrors(errors: FormErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}
