import { PrebuildConfig, CardSize, CARD_SIZES, COMPONENT_LABELS, ComponentCategory, getThemeColors } from '../types';

interface CardPreviewProps {
  config: PrebuildConfig;
  cardSize: CardSize;
}

const COMPONENT_ORDER: ComponentCategory[] = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

export function CardPreview({ config, cardSize }: CardPreviewProps) {
  const size = CARD_SIZES[cardSize];
  const aspectRatio = size.width / size.height;
  const colors = getThemeColors(config);

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

        {config.buildTier && (
          <div className="flex justify-center mb-1">
            <span
              className="text-[5px] px-1 py-0.5 rounded text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {config.buildTier}
            </span>
          </div>
        )}

        <p
          className="text-base font-bold text-center mb-1"
          style={{ color: colors.priceColor }}
        >
          {config.price || '$0'}
        </p>

        <div className="text-[6px] space-y-0.5 flex-1">
          {(['cpu', 'gpu', 'ram', 'storage'] as ComponentCategory[]).map((key) => {
            const value = config.components[key];
            if (!value) return null;
            return (
              <p key={key} className="leading-tight truncate">
                <span className="font-semibold">{COMPONENT_LABELS[key]}:</span> {value}
              </p>
            );
          })}
        </div>

        {config.sku && (
          <p className="text-[5px] text-center text-gray-400 mt-auto">
            SKU: {config.sku}
          </p>
        )}
      </div>
    </div>
  );

  const renderPriceCard = () => (
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
            className="h-6 w-auto mx-auto mb-1.5 object-contain"
          />
        )}
        <h3 className="text-xs font-bold text-center mb-1">
          {config.modelName || 'PC Build'}
        </h3>

        {config.buildTier && (
          <div className="flex justify-center mb-1">
            <span
              className="text-[7px] px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {config.buildTier}
            </span>
          </div>
        )}

        <p
          className="text-xl font-bold text-center mb-1.5"
          style={{ color: colors.priceColor }}
        >
          {config.price || '$0'}
        </p>

        <hr style={{ borderColor: colors.primary }} className="mb-1.5" />

        <div className="text-[8px] space-y-0.5 flex-1">
          {COMPONENT_ORDER.map((key) => {
            const value = config.components[key];
            if (!value) return null;
            return (
              <p key={key} className="truncate">
                <span className="font-semibold">{COMPONENT_LABELS[key]}:</span> {value}
              </p>
            );
          })}
          {config.os && (
            <p className="truncate">
              <span className="font-semibold">OS:</span> {config.os}
            </p>
          )}
        </div>

        <div className="mt-auto pt-1 text-center">
          {config.warranty && (
            <p className="text-[6px] text-gray-500">{config.warranty}</p>
          )}
          {config.sku && (
            <p className="text-[5px] text-gray-400">SKU: {config.sku}</p>
          )}
        </div>
      </div>
    </div>
  );

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

        {config.buildTier && (
          <div className="flex justify-center mb-1.5">
            <span
              className="text-[8px] px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: colors.primary }}
            >
              {config.buildTier}
            </span>
          </div>
        )}

        <h3 className="text-sm font-bold text-center mb-1">
          {config.modelName || 'PC Build'}
        </h3>

        <p
          className="text-2xl font-bold text-center mb-2"
          style={{ color: colors.priceColor }}
        >
          {config.price || '$0'}
        </p>

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
            return (
              <div key={key} className="min-w-0">
                <span className="font-bold" style={{ color: colors.accent }}>
                  {COMPONENT_LABELS[key]}
                </span>
                <p className="truncate">{value}</p>
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

        {config.sku && (
          <p className="text-[5px] text-gray-400 text-center mt-auto pt-1">
            SKU: {config.sku}
          </p>
        )}
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
          className="bg-white border-2 border-gray-300 shadow-lg overflow-hidden"
          style={{
            width: cardSize === 'shelf' ? '120px' : cardSize === 'price' ? '200px' : '280px',
            aspectRatio: aspectRatio,
          }}
        >
          {getPreviewContent()}
        </div>
      </div>
    </div>
  );
}
