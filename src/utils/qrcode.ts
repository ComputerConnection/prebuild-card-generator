import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataUrl(text: string, size: number = 128): Promise<string> {
  if (!text) return '';

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

/**
 * Generate QR code as canvas for PDF embedding
 */
export async function generateQRCodeCanvas(text: string, size: number = 128): Promise<HTMLCanvasElement | null> {
  if (!text) return null;

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
    return canvas;
  } catch (err) {
    console.error('Failed to generate QR code canvas:', err);
    return null;
  }
}
