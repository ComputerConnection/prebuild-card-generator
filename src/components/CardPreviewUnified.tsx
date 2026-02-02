/**
 * CardPreviewUnified - Preview component using unified layout system
 *
 * This component uses the same layout builders as the PDF generator,
 * ensuring visual consistency between preview and output.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  PrebuildConfig,
  CardSize,
  CARD_SIZES,
  BrandIcon,
  BACKGROUND_PATTERNS,
  FONT_FAMILIES,
} from '../types';
import { generateQRCodeDataUrl } from '../utils/qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from '../utils/barcode';
import { useCardLayout } from '../hooks/useCardLayout';
import { renderLayoutToHtml } from '../utils/renderToHtml';

interface CardPreviewProps {
  config: PrebuildConfig;
  cardSize: CardSize;
  brandIcons: BrandIcon[];
}

/**
 * Scale factor for converting inches to preview pixels
 * This determines how large the preview appears on screen
 */
const PREVIEW_SCALE: Record<CardSize, number> = {
  shelf: 60, // 2" × 60 = 120px width
  price: 50, // 4" × 50 = 200px width
  poster: 33, // 8.5" × 33 = 280px width
};

export function CardPreviewUnified({ config, cardSize, brandIcons }: CardPreviewProps) {
  const size = CARD_SIZES[cardSize];
  const scale = PREVIEW_SCALE[cardSize];
  const { visualSettings } = config;

  // State for generated QR code and barcode images
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [barcodeImage, setBarcodeImage] = useState<string>('');

  // Generate QR code when URL changes
  useEffect(() => {
    if (visualSettings.showQrCode && visualSettings.qrCodeUrl) {
      generateQRCodeDataUrl(visualSettings.qrCodeUrl, 100).then(setQrCodeImage);
    } else {
      setQrCodeImage('');
    }
  }, [visualSettings.showQrCode, visualSettings.qrCodeUrl]);

  // Generate barcode from SKU
  useEffect(() => {
    if (config.sku && isValidBarcode(config.sku)) {
      setBarcodeImage(generateBarcodeDataUrl(config.sku, { height: 25, displayValue: false }));
    } else {
      setBarcodeImage('');
    }
  }, [config.sku]);

  // Build layout using unified system
  const { layout } = useCardLayout({
    config,
    cardSize,
    brandIcons,
    qrCodeImage,
    barcodeImage,
  });

  // Render layout to HTML
  const previewContent = useMemo(
    () => renderLayoutToHtml(layout, { qrCodeImage, barcodeImage }),
    [layout, qrCodeImage, barcodeImage]
  );

  // Background style
  const backgroundStyle = useMemo((): React.CSSProperties => {
    const pattern = BACKGROUND_PATTERNS[visualSettings.backgroundPattern];
    if (pattern.value === 'solid') {
      return { backgroundColor: 'white' };
    }
    return {
      background: pattern.value,
      backgroundSize: '20px 20px',
    };
  }, [visualSettings.backgroundPattern]);

  // Font style
  const fontStyle = useMemo((): React.CSSProperties => {
    const font = FONT_FAMILIES[visualSettings.fontFamily];
    return { fontFamily: font.value };
  }, [visualSettings.fontFamily]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Preview: {size.name} ({size.width}&quot; × {size.height}&quot;)
      </h2>
      <div className="flex justify-center">
        <div
          className="border-2 border-gray-300 shadow-lg overflow-hidden"
          style={{
            width: `${size.width * scale}px`,
            height: `${size.height * scale}px`,
            ...backgroundStyle,
            ...fontStyle,
          }}
        >
          {previewContent}
        </div>
      </div>
    </div>
  );
}

export default CardPreviewUnified;
