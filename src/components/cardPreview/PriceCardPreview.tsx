import {
  ComponentCategory,
  COMPONENT_LABELS,
  CONDITION_CONFIG,
  STOCK_STATUS_CONFIG,
  calculateMonthlyPayment,
  calculateDiscountPercent,
  formatPrice,
} from '../../types';
import { findBrandIcon } from '../../utils/brandDetection';
import type { CardLayoutProps } from './types';

export function PriceCardPreview({
  config,
  colors,
  brandIcons,
  qrCodeImage,
  barcodeImage,
}: CardLayoutProps) {
  const leftSpecs: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage'];
  const rightSpecs: ComponentCategory[] = ['motherboard', 'psu', 'case', 'cooling'];
  const footerInfo = [
    { label: 'OS', value: config.os },
    { label: 'Warranty', value: config.warranty },
    { label: 'WiFi', value: config.wifi },
  ].filter((item) => item.value);
  const { visualSettings } = config;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="py-1.5 px-2" style={{ backgroundColor: colors.accent }}>
        {config.storeName && (
          <p className="text-[8px] text-center text-white font-bold">{config.storeName}</p>
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
              {config.saleInfo.badgeText}{' '}
              {config.saleInfo.originalPrice > 0 && config.price > 0
                ? `${calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% OFF`
                : ''}
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
          {config.saleInfo.enabled && config.saleInfo.originalPrice > 0 && (
            <p className="text-[8px] text-gray-400 line-through">
              {formatPrice(config.saleInfo.originalPrice)}
            </p>
          )}
          <p className="text-lg font-bold" style={{ color: colors.priceColor }}>
            {formatPrice(config.price)}
          </p>
          {config.financingInfo.enabled && config.price > 0 && (
            <p className="text-[6px] text-gray-600">
              As low as $
              {calculateMonthlyPayment(
                config.price,
                config.financingInfo.months,
                config.financingInfo.apr
              )}
              /mo
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
        <div className="flex-1 rounded p-1 relative" style={{ backgroundColor: '#f8f8f8' }}>
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
            {qrCodeImage && <img src={qrCodeImage} alt="QR Code" className="w-8 h-8" />}
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
            <p className="text-[5px] text-gray-400 text-center">SKU: {config.sku}</p>
          )}
        </div>
      </div>
    </div>
  );
}
