/**
 * BuildInfoForm - Model name, price, SKU, and build tier
 * With improved accessibility
 */

import { useState, useCallback, useId } from 'react';
import { useConfigStore } from '../../stores';
import { buildTierOptions } from '../../data/componentOptions';
import { formatPriceForInput, parsePrice } from '../../types';
import { validatePrice, validateSku } from '../../utils/validation';

export function BuildInfoForm() {
  const { config, setConfig } = useConfigStore();
  const [errors, setErrors] = useState<{ price?: string; sku?: string }>({});
  const baseId = useId();

  const handlePriceChange = useCallback(
    (value: string) => {
      const price = parsePrice(value);
      setConfig({ price });
      const validation = validatePrice(price);
      setErrors((prev) => ({ ...prev, price: validation.error }));
    },
    [setConfig]
  );

  const handlePriceBlur = useCallback(() => {
    const validation = validatePrice(config.price);
    setErrors((prev) => ({ ...prev, price: validation.error }));
  }, [config.price]);

  const handleSkuChange = useCallback(
    (value: string) => {
      setConfig({ sku: value });
      const validation = validateSku(value);
      setErrors((prev) => ({ ...prev, sku: validation.error }));
    },
    [setConfig]
  );

  const handleSkuBlur = useCallback(() => {
    const validation = validateSku(config.sku);
    setErrors((prev) => ({ ...prev, sku: validation.error }));
  }, [config.sku]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3" id={`${baseId}-heading`}>
        Build Info
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`${baseId}-model-name`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Model Name
          </label>
          <input
            id={`${baseId}-model-name`}
            type="text"
            value={config.modelName}
            onChange={(e) => setConfig({ modelName: e.target.value })}
            placeholder="e.g., Gaming Pro X"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor={`${baseId}-price`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-hidden="true"
            >
              $
            </span>
            <input
              id={`${baseId}-price`}
              type="text"
              inputMode="decimal"
              value={formatPriceForInput(config.price)}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              placeholder="1,499"
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? `${baseId}-price-error` : undefined}
              className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.price && (
            <p id={`${baseId}-price-error`} className="mt-1 text-xs text-red-600" role="alert">
              {errors.price}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${baseId}-sku`} className="block text-sm font-medium text-gray-700 mb-1">
            SKU / Product Code
          </label>
          <input
            id={`${baseId}-sku`}
            type="text"
            value={config.sku}
            onChange={(e) => handleSkuChange(e.target.value)}
            onBlur={handleSkuBlur}
            placeholder="e.g., PC-GAM-001"
            aria-invalid={!!errors.sku}
            aria-describedby={errors.sku ? `${baseId}-sku-error` : undefined}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.sku ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.sku && (
            <p id={`${baseId}-sku-error`} className="mt-1 text-xs text-red-600" role="alert">
              {errors.sku}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor={`${baseId}-build-tier`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Build Tier
          </label>
          <select
            id={`${baseId}-build-tier`}
            value={config.buildTier}
            onChange={(e) => setConfig({ buildTier: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select Build Tier...</option>
            {buildTierOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
