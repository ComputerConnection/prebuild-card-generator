import {
  COMPONENT_LABELS,
  ComponentCategory,
  CONDITION_CONFIG,
  STOCK_STATUS_CONFIG,
  calculateMonthlyPayment,
  calculateDiscountPercent,
  formatPrice,
} from '../../types';
import { findBrandIcon } from '../../utils/brandDetection';
import type { CardLayoutProps } from './types';

const COMPONENT_ORDER: ComponentCategory[] = [
  'cpu',
  'gpu',
  'ram',
  'storage',
  'motherboard',
  'psu',
  'case',
  'cooling',
];

export function PosterPreview({
  config,
  colors,
  brandIcons,
  qrCodeImage,
  barcodeImage,
}: CardLayoutProps) {
  const { visualSettings } = config;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="py-2 px-3" style={{ backgroundColor: colors.accent }}>
        {config.storeName && (
          <p className="text-[10px] text-center text-white font-bold">{config.storeName}</p>
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
              {config.saleInfo.badgeText}{' '}
              {config.saleInfo.originalPrice > 0 && config.price > 0
                ? `${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF`
                : ''}
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

        <h3 className="text-sm font-bold text-center mb-1">{config.modelName || 'PC Build'}</h3>

        {/* Price section */}
        <div className="text-center mb-2">
          {config.saleInfo.enabled && config.saleInfo.originalPrice > 0 && (
            <p className="text-[10px] text-gray-400 line-through">
              {formatPrice(config.saleInfo.originalPrice)}
            </p>
          )}
          <p className="text-2xl font-bold" style={{ color: colors.priceColor }}>
            {formatPrice(config.price)}
          </p>
          {config.financingInfo.enabled && config.price > 0 && (
            <p className="text-[8px] text-gray-600">
              As low as $
              {calculateMonthlyPayment(
                config.price,
                config.financingInfo.months,
                config.financingInfo.apr
              )}
              /mo for {config.financingInfo.months} months
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

        <p className="text-[8px] font-bold text-center mb-1.5" style={{ color: colors.accent }}>
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
                  <img src={qrCodeImage} alt="QR Code" className="w-10 h-10" />
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

          {config.sku && <p className="text-[5px] text-gray-400 text-center">SKU: {config.sku}</p>}
        </div>
      </div>
    </div>
  );
}
