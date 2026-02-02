/**
 * Tests for src/utils/qrcode.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQRCodeDataUrl, generateQRCodeCanvas } from '../../../utils/qrcode';

// Mock the qrcode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async (text: string) => {
      if (!text) throw new Error('No text provided');
      return `data:image/png;base64,mockQRCode_${text}`;
    }),
    toCanvas: vi.fn(async (canvas: HTMLCanvasElement, text: string) => {
      if (!text) throw new Error('No text provided');
      // Simulate canvas modification
      return canvas;
    }),
  },
}));

// Mock logger to avoid console output during tests
vi.mock('../../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('generateQRCodeDataUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty string for empty text', async () => {
    const result = await generateQRCodeDataUrl('');
    expect(result).toBe('');
  });

  it('should generate data URL for valid text', async () => {
    const result = await generateQRCodeDataUrl('https://example.com');
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should use default size of 128', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    await generateQRCodeDataUrl('test');
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ width: 128 })
    );
  });

  it('should accept custom size', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    await generateQRCodeDataUrl('test', 256);
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({ width: 256 })
    );
  });

  it('should use correct QR code options', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    await generateQRCodeDataUrl('test');
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'test',
      expect.objectContaining({
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
    );
  });

  it('should handle generation errors gracefully', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    QRCode.toDataURL.mockRejectedValueOnce(new Error('QR generation failed'));

    const result = await generateQRCodeDataUrl('test');
    expect(result).toBe('');
  });
});

describe('generateQRCodeCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for empty text', async () => {
    const result = await generateQRCodeCanvas('');
    expect(result).toBeNull();
  });

  it('should generate canvas for valid text', async () => {
    const result = await generateQRCodeCanvas('https://example.com');
    expect(result).toBeInstanceOf(HTMLCanvasElement);
  });

  it('should use default size of 128', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    await generateQRCodeCanvas('test');
    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      'test',
      expect.objectContaining({ width: 128 })
    );
  });

  it('should accept custom size', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    await generateQRCodeCanvas('test', 200);
    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      'test',
      expect.objectContaining({ width: 200 })
    );
  });

  it('should handle canvas generation errors gracefully', async () => {
    const QRCode = vi.mocked(await import('qrcode')).default;
    QRCode.toCanvas.mockRejectedValueOnce(new Error('Canvas generation failed'));

    const result = await generateQRCodeCanvas('test');
    expect(result).toBeNull();
  });
});
