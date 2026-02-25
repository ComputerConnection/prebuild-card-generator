import {
  ComponentCategory,
  CONDITION_CONFIG,
  formatPrice,
} from '../../types';
import type { CardLayoutProps } from './types';

export function ShelfTagPreview({
  config,
  colors,
  barcodeImage,
  renderSpecWithIcon,
}: CardLayoutProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="py-1 px-2" style={{ backgroundColor: colors.accent }}>
        {config.storeName && (
          <p className="text-[6px] text-center text-white font-bold truncate">{config.storeName}</p>
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
          {config.saleInfo.enabled && config.saleInfo.originalPrice > 0 && (
            <p className="text-[7px] text-gray-400 line-through">
              {formatPrice(config.saleInfo.originalPrice)}
            </p>
          )}
          <p className="text-base font-bold" style={{ color: colors.priceColor }}>
            {formatPrice(config.price)}
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
          {config.sku && <p className="text-[5px] text-center text-gray-400">SKU: {config.sku}</p>}
        </div>
      </div>
    </div>
  );
}
