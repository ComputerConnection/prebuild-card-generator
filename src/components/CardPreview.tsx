import { useState, useEffect } from 'react';
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
  calculateMonthlyPayment,
  calculateDiscountPercent,
  BACKGROUND_PATTERNS,
  FONT_FAMILIES,
} from '../types';
import { findBrandIcon } from '../utils/brandDetection';
import { generateQRCodeDataUrl } from '../utils/qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from '../utils/barcode';

interface CardPreviewProps {
  config: PrebuildConfig;
  cardSize: CardSize;
  brandIcons: BrandIcon[];
}

const COMPONENT_ORDER: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

export function CardPreview({ config, cardSize, brandIcons }: CardPreviewProps) {
  const size = CARD_SIZES[cardSize];
  const aspectRatio = size.width / size.height;
  const colors = getThemeColors(config);
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

  // Get background pattern CSS
  const getBackgroundStyle = (): React.CSSProperties => {
    const pattern = BACKGROUND_PATTERNS[visualSettings.backgroundPattern];
    if (pattern.value === 'solid') {
      return { backgroundColor: 'white' };
    }
    return {
      background: pattern.value,
      backgroundSize: '20px 20px',
    };
  };

  // Get font family CSS
  const getFontStyle = (): React.CSSProperties => {
    const font = FONT_FAMILIES[visualSettings.fontFamily];
    return { fontFamily: font.value };
  };

  // Helper to render a spec line with optional brand icon
  const renderSpecWithIcon = (key: ComponentCategory, value: string, iconSize: number = 12, fontSize: string = 'text-[6px]') => {
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

  const renderShelfTag = () => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div
        className="py-1 px-2"
        style={{ backgroundColor: colors.accent }}
      >
        {config.storeName && (
          <p className="text-[6px] text-center text-white font-bold truncate">
            {config.storeName}
          </p>
        )}
      </div>

      <div className="p-1.5 flex-1 flex flex-col">
        {config.storeLogo && (
          <img
            src={config.storeLogo}
            alt="Store logo"
            className="h-4 w-auto mx-auto mb-1 object-contain"
          />
        )}
        <h3 className="text-[9px] font-bold text-center mb-0.5 leading-tight">
          {config.modelName || 'PC Build'}
        </h3>

        {/* Build tier, condition, and sale badge row */}
        <div className="flex justify-center gap-1 mb-1 flex-wrap">
          {config.condition && (
            <span
              className="text-[5px] px-1 py-0.5 rounded font-medium"
              style={{
                backgroundColor: CONDITION_CONFIG[config.condition].bgColor,
                color: CONDITION_CONFIG[config.condition].color,
              }}
            >
              {CONDITION_CONFIG[config.condition].shortLabel}
            </span>
          )}
          {config.buildTier && (
            <span
              className="text-[5px] px-1 py-0.5 rounded text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {config.buildTier}
            </span>
          )}
          {config.saleInfo.enabled && (
            <span className="text-[5px] px-1 py-0.5 rounded bg-red-500 text-white">
              {config.saleInfo.badgeText}
            </span>
          )}
        </div>

        {/* Price section */}
        <div className="text-center mb-1">
          {config.saleInfo.enabled && config.saleInfo.originalPrice && (
            <p className="text-[7px] text-gray-400 line-through">
              {config.saleInfo.originalPrice}
            </p>
          )}
          <p
            className="text-base font-bold"
            style={{ color: colors.priceColor }}
          >
            {config.price || '$0'}
          </p>
        </div>

        <div className="text-[6px] space-y-0.5 flex-1">
          {(['cpu', 'gpu', 'ram', 'storage'] as ComponentCategory[]).map((key) => {
            const value = config.components[key];
            if (!value) return null;
            return renderSpecWithIcon(key, value, 8, 'text-[6px]');
          })}
        </div>

        {/* SKU and barcode */}
        <div className="mt-auto">
          {barcodeImage && (
            <div className="flex justify-center mb-0.5">
              <img src={barcodeImage} alt="Barcode" className="h-3" />
            </div>
          )}
          {config.sku && (
            <p className="text-[5px] text-center text-gray-400">
              SKU: {config.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPriceCard = () => {
    const leftSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
    const rightSpecs: ComponentCategory[] = ['motherboard', 'psu', 'case', 'cooling'];
    const footerInfo = [
      { label: 'OS', value: config.os },
      { label: 'Warranty', value: config.warranty },
      { label: 'WiFi', value: config.wifi },
    ].filter(item => item.value);

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header bar */}
        <div
          className="py-1.5 px-2"
          style={{ backgroundColor: colors.accent }}
        >
          {config.storeName && (
            <p className="text-[8px] text-center text-white font-bold">
              {config.storeName}
            </p>
          )}
        </div>

        <div className="p-2 flex-1 flex flex-col">
          {config.storeLogo && (
            <img
              src={config.storeLogo}
              alt="Store logo"
              className="h-5 w-auto mx-auto mb-1 object-contain"
            />
          )}
          <h3 className="text-[10px] font-bold text-center mb-0.5">
            {config.modelName || 'PC Build'}
          </h3>

          {/* Build tier, condition, sale badge, and stock status */}
          <div className="flex justify-center gap-1 mb-0.5 flex-wrap">
            {config.condition && (
              <span
                className="text-[6px] px-1 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: CONDITION_CONFIG[config.condition].bgColor,
                  color: CONDITION_CONFIG[config.condition].color,
                }}
              >
                {CONDITION_CONFIG[config.condition].shortLabel}
              </span>
            )}
            {config.buildTier && (
              <span
                className="text-[6px] px-1 py-0.5 rounded text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {config.buildTier}
              </span>
            )}
            {config.saleInfo.enabled && (
              <span className="text-[6px] px-1 py-0.5 rounded bg-red-500 text-white">
                {config.saleInfo.badgeText} {config.saleInfo.originalPrice && config.price ? `${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF` : ''}
              </span>
            )}
            {config.stockStatus && (
              <span
                className="text-[6px] px-1 py-0.5 rounded"
                style={{
                  backgroundColor: STOCK_STATUS_CONFIG[config.stockStatus].bgColor,
                  color: STOCK_STATUS_CONFIG[config.stockStatus].color,
                }}
              >
                {STOCK_STATUS_CONFIG[config.stockStatus].label}
              </span>
            )}
          </div>

          {/* Price section */}
          <div className="text-center mb-1">
            {config.saleInfo.enabled && config.saleInfo.originalPrice && (
              <p className="text-[8px] text-gray-400 line-through">
                {config.saleInfo.originalPrice}
              </p>
            )}
            <p
              className="text-lg font-bold"
              style={{ color: colors.priceColor }}
            >
              {config.price || '$0'}
            </p>
            {config.financingInfo.enabled && config.price && (
              <p className="text-[6px] text-gray-600">
                As low as ${calculateMonthlyPayment(config.price, config.financingInfo.months, config.financingInfo.apr)}/mo
              </p>
            )}
          </div>

          {/* Feature badges */}
          {config.features.length > 0 && (
            <div className="flex flex-wrap justify-center gap-0.5 mb-1">
              {config.features.slice(0, 4).map((feature) => (
                <span
                  key={feature}
                  className="text-[5px] px-1 py-0.5 rounded text-white"
                  style={{ backgroundColor: colors.primary }}
                >
                  {feature}
                </span>
              ))}
            </div>
          )}

          {/* Specs section with background */}
          <div
            className="flex-1 rounded p-1 relative"
            style={{ backgroundColor: '#f8f8f8' }}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
              style={{ backgroundColor: colors.primary }}
            />

            {/* Two-column specs */}
            <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[6px] pl-1.5">
              <div className="space-y-0.5">
                {leftSpecs.map((key) => {
                  const value = config.components[key];
                  if (!value) return null;
                  const brandIcon = findBrandIcon(value, brandIcons);
                  return (
                    <div key={key}>
                      <p className="font-bold" style={{ color: colors.primary }}>
                        {COMPONENT_LABELS[key]}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {brandIcon && (
                          <img
                            src={brandIcon.image}
                            alt={brandIcon.name}
                            className="w-3 h-3 object-contain flex-shrink-0"
                          />
                        )}
                        <p className="truncate">{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-0.5">
                {rightSpecs.map((key) => {
                  const value = config.components[key];
                  if (!value) return null;
                  const brandIcon = findBrandIcon(value, brandIcons);
                  return (
                    <div key={key}>
                      <p className="font-bold" style={{ color: colors.primary }}>
                        {COMPONENT_LABELS[key]}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {brandIcon && (
                          <img
                            src={brandIcon.image}
                            alt={brandIcon.name}
                            className="w-3 h-3 object-contain flex-shrink-0"
                          />
                        )}
                        <p className="truncate">{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer with OS/Warranty/WiFi */}
          {footerInfo.length > 0 && (
            <div
              className="mt-1 rounded p-1 grid gap-1 text-center"
              style={{
                backgroundColor: `${colors.primary}15`,
                gridTemplateColumns: `repeat(${footerInfo.length}, 1fr)`,
              }}
            >
              {footerInfo.map((info) => (
                <div key={info.label}>
                  <p className="text-[5px] font-bold" style={{ color: colors.primary }}>
                    {info.label.toUpperCase()}
                  </p>
                  <p className="text-[5px] truncate">{info.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Product image and QR code row */}
          {(visualSettings.productImage || qrCodeImage) && (
            <div className="flex justify-center items-center gap-2 mt-1">
              {visualSettings.productImage && (
                <img
                  src={visualSettings.productImage}
                  alt="Product"
                  className="w-8 h-8 object-contain"
                />
              )}
              {qrCodeImage && (
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  className="w-8 h-8"
                />
              )}
            </div>
          )}

          {/* SKU and barcode */}
          <div className="mt-1">
            {barcodeImage && (
              <div className="flex justify-center mb-0.5">
                <img src={barcodeImage} alt="Barcode" className="h-4" />
              </div>
            )}
            {config.sku && (
              <p className="text-[5px] text-gray-400 text-center">
                SKU: {config.sku}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPoster = () => (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div
        className="py-2 px-3"
        style={{ backgroundColor: colors.accent }}
      >
        {config.storeName && (
          <p className="text-[10px] text-center text-white font-bold">
            {config.storeName}
          </p>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col overflow-hidden">
        {config.storeLogo && (
          <img
            src={config.storeLogo}
            alt="Store logo"
            className="h-8 w-auto mx-auto mb-2 object-contain"
          />
        )}

        {/* Build tier, condition, sale badge, stock status */}
        <div className="flex justify-center gap-1 mb-1.5 flex-wrap">
          {config.condition && (
            <span
              className="text-[8px] px-2 py-0.5 rounded font-medium"
              style={{
                backgroundColor: CONDITION_CONFIG[config.condition].bgColor,
                color: CONDITION_CONFIG[config.condition].color,
              }}
            >
              {CONDITION_CONFIG[config.condition].shortLabel}
            </span>
          )}
          {config.buildTier && (
            <span
              className="text-[8px] px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {config.buildTier}
            </span>
          )}
          {config.saleInfo.enabled && (
            <span className="text-[8px] px-2 py-0.5 rounded bg-red-500 text-white">
              {config.saleInfo.badgeText} {config.saleInfo.originalPrice && config.price ? `${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF` : ''}
            </span>
          )}
          {config.stockStatus && (
            <span
              className="text-[8px] px-2 py-0.5 rounded"
              style={{
                backgroundColor: STOCK_STATUS_CONFIG[config.stockStatus].bgColor,
                color: STOCK_STATUS_CONFIG[config.stockStatus].color,
              }}
            >
              {STOCK_STATUS_CONFIG[config.stockStatus].label}
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-center mb-1">
          {config.modelName || 'PC Build'}
        </h3>

        {/* Price section */}
        <div className="text-center mb-2">
          {config.saleInfo.enabled && config.saleInfo.originalPrice && (
            <p className="text-[10px] text-gray-400 line-through">
              {config.saleInfo.originalPrice}
            </p>
          )}
          <p
            className="text-2xl font-bold"
            style={{ color: colors.priceColor }}
          >
            {config.price || '$0'}
          </p>
          {config.financingInfo.enabled && config.price && (
            <p className="text-[8px] text-gray-600">
              As low as ${calculateMonthlyPayment(config.price, config.financingInfo.months, config.financingInfo.apr)}/mo for {config.financingInfo.months} months
              {config.financingInfo.apr > 0 && ` @ ${config.financingInfo.apr}% APR`}
            </p>
          )}
        </div>

        {/* Feature badges */}
        {config.features.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mb-2">
            {config.features.slice(0, 4).map((feature) => (
              <span
                key={feature}
                className="text-[6px] px-1 py-0.5 rounded text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        <hr style={{ borderColor: colors.primary }} className="mb-2" />

        <p
          className="text-[8px] font-bold text-center mb-1.5"
          style={{ color: colors.accent }}
        >
          SPECIFICATIONS
        </p>

        {/* Two-column specs */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[7px] flex-1">
          {COMPONENT_ORDER.map((key) => {
            const value = config.components[key];
            if (!value) return null;
            const brandIcon = findBrandIcon(value, brandIcons);
            return (
              <div key={key} className="min-w-0">
                <span className="font-bold" style={{ color: colors.accent }}>
                  {COMPONENT_LABELS[key]}
                </span>
                <div className="flex items-center gap-0.5">
                  {brandIcon && (
                    <img
                      src={brandIcon.image}
                      alt={brandIcon.name}
                      className="w-3 h-3 object-contain flex-shrink-0"
                    />
                  )}
                  <p className="truncate">{value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional info */}
        {(config.os || config.wifi || config.warranty) && (
          <>
            <hr className="border-gray-200 my-1.5" />
            <div className="grid grid-cols-3 gap-1 text-[6px] text-center">
              {config.os && (
                <div>
                  <p className="text-gray-500 font-bold">OS</p>
                  <p className="truncate">{config.os}</p>
                </div>
              )}
              {config.wifi && (
                <div>
                  <p className="text-gray-500 font-bold">Connectivity</p>
                  <p className="truncate">{config.wifi}</p>
                </div>
              )}
              {config.warranty && (
                <div>
                  <p className="text-gray-500 font-bold">Warranty</p>
                  <p className="truncate">{config.warranty}</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Description */}
        {config.description && (
          <p className="text-[6px] text-gray-500 text-center italic mt-1.5 line-clamp-2">
            {config.description}
          </p>
        )}

        {/* Product image, QR code, and barcode section */}
        <div className="mt-auto pt-2">
          {/* Product image and QR code row */}
          {(visualSettings.productImage || qrCodeImage) && (
            <div className="flex justify-center items-center gap-3 mb-1.5">
              {visualSettings.productImage && (
                <img
                  src={visualSettings.productImage}
                  alt="Product"
                  className="w-12 h-12 object-contain"
                />
              )}
              {qrCodeImage && (
                <div className="text-center">
                  <img
                    src={qrCodeImage}
                    alt="QR Code"
                    className="w-10 h-10"
                  />
                  <p className="text-[5px] text-gray-400">Scan for details</p>
                </div>
              )}
            </div>
          )}

          {/* Barcode */}
          {barcodeImage && (
            <div className="flex justify-center mb-1">
              <img src={barcodeImage} alt="Barcode" className="h-5" />
            </div>
          )}

          {config.sku && (
            <p className="text-[5px] text-gray-400 text-center">
              SKU: {config.sku}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const getPreviewContent = () => {
    switch (cardSize) {
      case 'shelf':
        return renderShelfTag();
      case 'price':
        return renderPriceCard();
      case 'poster':
        return renderPoster();
      default:
        return renderPriceCard();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Preview: {size.name} ({size.width}" × {size.height}")
      </h2>
      <div className="flex justify-center">
        <div
          className="border-2 border-gray-300 shadow-lg overflow-hidden"
          style={{
            width: cardSize === 'shelf' ? '120px' : cardSize === 'price' ? '200px' : '280px',
            aspectRatio: aspectRatio,
            ...getBackgroundStyle(),
            ...getFontStyle(),
          }}
        >
          {getPreviewContent()}
        </div>
      </div>
    </div>
  );
}
