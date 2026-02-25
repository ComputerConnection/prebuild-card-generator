import { useState, useEffect, useId, useMemo, memo } from 'react';
import {
  PrebuildConfig,
  CardSize,
  CARD_SIZES,
  COMPONENT_LABELS,
  ComponentCategory,
  getThemeColors,
  BrandIcon,
  STOCK_STATUS_CONFIG,
  CONDITION_CONFIG,
  formatPrice,
  BACKGROUND_PATTERNS,
  FONT_FAMILIES,
} from '../types';
import { findBrandIcon } from '../utils/brandDetection';
import { generateQRCodeDataUrl } from '../utils/qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from '../utils/barcode';
import { ShelfTagPreview } from './cardPreview/ShelfTagPreview';
import { PriceCardPreview } from './cardPreview/PriceCardPreview';
import { PosterPreview } from './cardPreview/PosterPreview';
import { ZoomControls } from './cardPreview/ZoomControls';

// Zoom levels for accessibility
const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5, 2] as const;
const DEFAULT_ZOOM_INDEX = 1;

interface CardPreviewProps {
  config: PrebuildConfig;
  cardSize: CardSize;
  brandIcons: BrandIcon[];
}

export const CardPreview = memo(function CardPreview({
  config,
  cardSize,
  brandIcons,
}: CardPreviewProps) {
  const size = CARD_SIZES[cardSize];
  const aspectRatio = size.width / size.height;
  const colors = getThemeColors(config);
  const baseId = useId();

  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [barcodeImage, setBarcodeImage] = useState<string>('');
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
  const zoom = ZOOM_LEVELS[zoomIndex];

  const handleZoomIn = () => setZoomIndex((prev) => Math.min(prev + 1, ZOOM_LEVELS.length - 1));
  const handleZoomOut = () => setZoomIndex((prev) => Math.max(prev - 1, 0));
  const handleResetZoom = () => setZoomIndex(DEFAULT_ZOOM_INDEX);

  // Generate QR code when URL changes
  useEffect(() => {
    if (config.visualSettings.showQrCode && config.visualSettings.qrCodeUrl) {
      generateQRCodeDataUrl(config.visualSettings.qrCodeUrl, 100).then(setQrCodeImage);
    } else {
      setQrCodeImage('');
    }
  }, [config.visualSettings.showQrCode, config.visualSettings.qrCodeUrl]);

  // Generate barcode from SKU
  useEffect(() => {
    if (config.sku && isValidBarcode(config.sku)) {
      setBarcodeImage(generateBarcodeDataUrl(config.sku, { height: 25, displayValue: false }));
    } else {
      setBarcodeImage('');
    }
  }, [config.sku]);

  // Get background pattern CSS - memoized to prevent object recreation
  const backgroundStyle = useMemo((): React.CSSProperties => {
    const pattern = BACKGROUND_PATTERNS[config.visualSettings.backgroundPattern];
    if (pattern.value === 'solid') {
      return { backgroundColor: 'white' };
    }
    return { background: pattern.value, backgroundSize: '20px 20px' };
  }, [config.visualSettings.backgroundPattern]);

  // Get font family CSS - memoized to prevent object recreation
  const fontStyle = useMemo((): React.CSSProperties => {
    const font = FONT_FAMILIES[config.visualSettings.fontFamily];
    return { fontFamily: font.value };
  }, [config.visualSettings.fontFamily]);

  // Helper to render a spec line with optional brand icon
  const renderSpecWithIcon = (
    key: ComponentCategory,
    value: string,
    iconSize: number = 12,
    fontSize: string = 'text-[6px]'
  ) => {
    const brandIcon = findBrandIcon(value, brandIcons);
    return (
      <div key={key} className={`flex items-center gap-0.5 ${fontSize}`}>
        {brandIcon && (
          <img
            src={brandIcon.image}
            alt={brandIcon.name}
            className="object-contain flex-shrink-0"
            style={{ width: iconSize, height: iconSize }}
          />
        )}
        <span className="truncate">
          <span className="font-semibold">{COMPONENT_LABELS[key]}:</span> {value}
        </span>
      </div>
    );
  };

  const layoutProps = {
    config,
    colors,
    brandIcons,
    qrCodeImage,
    barcodeImage,
    fontStyle,
    backgroundStyle,
    baseId,
    renderSpecWithIcon,
  };

  const getPreviewContent = () => {
    switch (cardSize) {
      case 'shelf':
        return <ShelfTagPreview {...layoutProps} />;
      case 'price':
        return <PriceCardPreview {...layoutProps} />;
      case 'poster':
        return <PosterPreview {...layoutProps} />;
      default:
        return <PriceCardPreview {...layoutProps} />;
    }
  };

  // Generate screen reader description
  const getCardDescription = () => {
    const parts = [];
    if (config.modelName) parts.push(config.modelName);
    if (config.price > 0) parts.push(`Price: ${formatPrice(config.price)}`);
    if (config.condition) parts.push(`Condition: ${CONDITION_CONFIG[config.condition].label}`);
    if (config.stockStatus) parts.push(`Status: ${STOCK_STATUS_CONFIG[config.stockStatus].label}`);
    if (config.buildTier) parts.push(`Tier: ${config.buildTier}`);
    const specParts = [];
    if (config.components.cpu) specParts.push(`CPU: ${config.components.cpu}`);
    if (config.components.gpu) specParts.push(`GPU: ${config.components.gpu}`);
    if (specParts.length > 0) parts.push(specParts.join(', '));
    return parts.join('. ');
  };

  const baseWidth = cardSize === 'shelf' ? 120 : cardSize === 'price' ? 200 : 280;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-800" id={`${baseId}-heading`}>
          Preview: {size.name} ({size.width}&quot; &times; {size.height}&quot;)
        </h2>
        <ZoomControls
          zoom={zoom}
          canZoomIn={zoomIndex < ZOOM_LEVELS.length - 1}
          canZoomOut={zoomIndex > 0}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      </div>

      {/* Accessible hint */}
      <p className="text-xs text-gray-500 mb-2" id={`${baseId}-hint`}>
        Use zoom controls to enlarge the preview. Small text on printed cards may appear larger than
        shown.
      </p>

      <div className="flex justify-center overflow-auto">
        <div
          role="img"
          aria-labelledby={`${baseId}-heading`}
          aria-describedby={`${baseId}-description`}
          className="border-2 border-gray-300 shadow-lg overflow-hidden transition-transform origin-top"
          style={{
            width: `${baseWidth * zoom}px`,
            aspectRatio: aspectRatio,
            ...backgroundStyle,
            ...fontStyle,
          }}
        >
          {getPreviewContent()}
        </div>
      </div>

      {/* Screen reader description */}
      <p id={`${baseId}-description`} className="sr-only">
        {getCardDescription()}
      </p>
    </div>
  );
});
