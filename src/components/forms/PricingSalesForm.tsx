/**
 * PricingSalesForm - Sale information and financing options
 */

import { useState, useCallback, useEffect } from 'react';
import { useConfigStore } from '../../stores';
import { saleBadgeOptions, financingTermOptions } from '../../data/componentOptions';
import { calculateMonthlyPayment, calculateDiscountPercent, formatPriceForInput, parsePrice } from '../../types';
import { validateSalePrice, validateApr } from '../../utils/validation';

interface FormErrors {
  originalPrice?: string;
  apr?: string;
}

export function PricingSalesForm() {
  const { config, setConfig } = useConfigStore();
  const [errors, setErrors] = useState<FormErrors>({});

  // Validate sale price relationship whenever either price changes
  useEffect(() => {
    if (config.saleInfo.enabled && config.saleInfo.originalPrice > 0 && config.price > 0) {
      const validation = validateSalePrice(config.saleInfo.originalPrice, config.price);
      setErrors(prev => ({ ...prev, originalPrice: validation.error }));
    } else {
      setErrors(prev => ({ ...prev, originalPrice: undefined }));
    }
  }, [config.saleInfo.enabled, config.saleInfo.originalPrice, config.price]);

  const handleOriginalPriceChange = useCallback((value: string) => {
    const originalPrice = parsePrice(value);
    setConfig({
      saleInfo: { ...config.saleInfo, originalPrice },
    });
  }, [config.saleInfo, setConfig]);

  const handleAprChange = useCallback((value: string) => {
    const apr = parseFloat(value) || 0;
    setConfig({
      financingInfo: { ...config.financingInfo, apr },
    });
    const validation = validateApr(apr);
    setErrors(prev => ({ ...prev, apr: validation.error }));
  }, [config.financingInfo, setConfig]);

  const handleAprBlur = useCallback(() => {
    const validation = validateApr(config.financingInfo.apr);
    setErrors(prev => ({ ...prev, apr: validation.error }));
  }, [config.financingInfo.apr]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Pricing & Sales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Sale Toggle */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.saleInfo.enabled}
              onChange={(e) =>
                setConfig({
                  saleInfo: { ...config.saleInfo, enabled: e.target.checked },
                })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">This item is on sale</span>
          </label>
        </div>

        {config.saleInfo.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  value={formatPriceForInput(config.saleInfo.originalPrice)}
                  onChange={(e) => handleOriginalPriceChange(e.target.value)}
                  placeholder="1,799"
                  className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.originalPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.originalPrice ? (
                <p className="text-sm text-red-600 mt-1">{errors.originalPrice}</p>
              ) : config.saleInfo.originalPrice > 0 && config.price > 0 && config.saleInfo.originalPrice > config.price ? (
                <p className="text-sm text-green-600 mt-1">
                  {calculateDiscountPercent(config.saleInfo.originalPrice, config.price)}% off
                </p>
              ) : null}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Badge Text</label>
              <select
                value={config.saleInfo.badgeText}
                onChange={(e) =>
                  setConfig({
                    saleInfo: { ...config.saleInfo, badgeText: e.target.value },
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
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={config.financingInfo.enabled}
            onChange={(e) =>
              setConfig({
                financingInfo: { ...config.financingInfo, enabled: e.target.checked },
              })
            }
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">Show financing option</span>
        </label>

        {config.financingInfo.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months)</label>
              <select
                value={config.financingInfo.months}
                onChange={(e) =>
                  setConfig({
                    financingInfo: { ...config.financingInfo, months: parseInt(e.target.value) },
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
              <label className="block text-sm font-medium text-gray-700 mb-1">APR %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={config.financingInfo.apr}
                onChange={(e) => handleAprChange(e.target.value)}
                onBlur={handleAprBlur}
                placeholder="0 for 0% APR"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.apr ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.apr && (
                <p className="mt-1 text-xs text-red-600">{errors.apr}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
              <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-800 font-medium">
                $
                {calculateMonthlyPayment(
                  config.price,
                  config.financingInfo.months,
                  config.financingInfo.apr
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
