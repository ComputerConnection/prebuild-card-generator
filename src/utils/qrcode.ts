import QRCode from 'qrcode';
import { logger } from './logger';

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataUrl(text: string, size: number = 128): Promise<string> {
  if (!text) {
    logger.debug('QRCode', 'Skipping QR code generation - no text provided');
    return '';
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    logger.debug('QRCode', 'Successfully generated QR code', { textLength: text.length, size });
    return dataUrl;
  } catch (err) {
    logger.error('QRCode', 'Failed to generate QR code', err);
    return '';
  }
}

/**
 * Generate QR code as canvas for PDF embedding
 */
export async function generateQRCodeCanvas(
  text: string,
  size: number = 128
): Promise<HTMLCanvasElement | null> {
  if (!text) {
    logger.debug('QRCode', 'Skipping QR code canvas generation - no text provided');
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, text, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    logger.debug('QRCode', 'Successfully generated QR code canvas', {
      textLength: text.length,
      size,
    });
    return canvas;
  } catch (err) {
    logger.error('QRCode', 'Failed to generate QR code canvas', err);
    return null;
  }
}
