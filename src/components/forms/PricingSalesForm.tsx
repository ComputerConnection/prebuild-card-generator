/**
 * PricingSalesForm - Sale information and financing options
 */

import { useState, useCallback, useEffect, useId } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '../../stores';
import { saleBadgeOptions, financingTermOptions } from '../../data/componentOptions';
import {
  calculateMonthlyPayment,
  calculateDiscountPercent,
  formatPriceForInput,
  parsePrice,
} from '../../types';
import { validateSalePrice, validateApr } from '../../utils/validation';

interface FormErrors {
  originalPrice?: string;
  apr?: string;
}

export function PricingSalesForm() {
  const { saleInfo, financingInfo, price, setConfig } = useConfigStore(
    useShallow((state) => ({
      saleInfo: state.config.saleInfo,
      financingInfo: state.config.financingInfo,
      price: state.config.price,
      setConfig: state.setConfig,
    }))
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const baseId = useId();

  // Validate sale price relationship whenever either price changes
  useEffect(() => {
    if (saleInfo.enabled && saleInfo.originalPrice > 0 && price > 0) {
      const validation = validateSalePrice(saleInfo.originalPrice, price);
      setErrors((prev) => ({ ...prev, originalPrice: validation.error }));
    } else {
      setErrors((prev) => ({ ...prev, originalPrice: undefined }));
    }
  }, [saleInfo.enabled, saleInfo.originalPrice, price]);

  const handleOriginalPriceChange = useCallback(
    (value: string) => {
      const originalPrice = parsePrice(value);
      setConfig({
        saleInfo: { ...saleInfo, originalPrice },
      });
    },
    [saleInfo, setConfig]
  );

  const handleAprChange = useCallback(
    (value: string) => {
      const apr = parseFloat(value) || 0;
      setConfig({
        financingInfo: { ...financingInfo, apr },
      });
      const validation = validateApr(apr);
      setErrors((prev) => ({ ...prev, apr: validation.error }));
    },
    [financingInfo, setConfig]
  );

  const handleAprBlur = useCallback(() => {
    const validation = validateApr(financingInfo.apr);
    setErrors((prev) => ({ ...prev, apr: validation.error }));
  }, [financingInfo.apr]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Pricing & Sales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Sale Toggle */}
        <div className="md:col-span-2">
          <label htmlFor={`${baseId}-sale-toggle`} className="flex items-center gap-2 cursor-pointer">
            <input
              id={`${baseId}-sale-toggle`}
              type="checkbox"
              checked={saleInfo.enabled}
              onChange={(e) =>
                setConfig({
                  saleInfo: { ...saleInfo, enabled: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">This item is on sale</span>
          </label>
        </div>

        {saleInfo.enabled && (
          <>
            <div>
              <label htmlFor={`${baseId}-original-price`} className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  id={`${baseId}-original-price`}
                  type="text"
                  value={formatPriceForInput(saleInfo.originalPrice)}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  placeholder="1,799"
                  className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.originalPrice ? (
                <p className="text-sm text-red-600 mt-1">{errors.originalPrice}</p>
              ) : saleInfo.originalPrice > 0 &&
                price > 0 &&
                saleInfo.originalPrice > price ? (
                <p className="text-sm text-green-600 mt-1">
                  {calculateDiscountPercent(saleInfo.originalPrice, price)}% off
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={`${baseId}-badge-text`} className="block text-sm font-medium text-gray-700 mb-1">
                Sale Badge Text
              </label>
              <select
                id={`${baseId}-badge-text`}
                value={saleInfo.badgeText}
                onChange={(e) =>
                  setConfig({
                    saleInfo: { ...saleInfo, badgeText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {saleBadgeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Financing Toggle */}
      <div className="border-t pt-4">
        <label htmlFor={`${baseId}-financing-toggle`} className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            id={`${baseId}-financing-toggle`}
            type="checkbox"
            checked={financingInfo.enabled}
            onChange={(e) =>
              setConfig({
                financingInfo: { ...financingInfo, enabled: e.target.checked },
              })
            }
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Show financing option</span>
        </label>

        {financingInfo.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor={`${baseId}-term-months`} className="block text-sm font-medium text-gray-700 mb-1">Term (Months)</label>
              <select
                id={`${baseId}-term-months`}
                value={financingInfo.months}
                onChange={(e) =>
                  setConfig({
                    financingInfo: { ...financingInfo, months: parseInt(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {financingTermOptions.map((term) => (
                  <option key={term} value={term}>
                    {term} months
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${baseId}-apr`} className="block text-sm font-medium text-gray-700 mb-1">APR %</label>
              <input
                id={`${baseId}-apr`}
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={financingInfo.apr}
                onChange={(e) => handleAprChange(e.target.value)}
                onBlur={handleAprBlur}
                placeholder="0 for 0% APR"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apr ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.apr && <p className="mt-1 text-xs text-red-600">{errors.apr}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Payment
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-800 font-medium">
                $
                {calculateMonthlyPayment(
                  price,
                  financingInfo.months,
                  financingInfo.apr
                ) || '0.00'}
                /mo
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
