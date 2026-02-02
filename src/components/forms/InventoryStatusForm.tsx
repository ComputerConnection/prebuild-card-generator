/**
 * InventoryStatusForm - Condition, stock status, and quantity
 */

import { useState, useCallback } from 'react';
import { useConfigStore } from '../../stores';
import { ConditionType, StockStatus, CONDITION_CONFIG, STOCK_STATUS_CONFIG } from '../../types';
import { validateStockQuantity } from '../../utils/validation';

export function InventoryStatusForm() {
  const { config, setConfig } = useConfigStore();
  const [errors, setErrors] = useState<{ stockQuantity?: string }>({});

  const handleQuantityChange = useCallback((value: string) => {
    setConfig({ stockQuantity: value });
    const validation = validateStockQuantity(value);
    setErrors({ stockQuantity: validation.error });
  }, [setConfig]);

  const handleQuantityBlur = useCallback(() => {
    const validation = validateStockQuantity(config.stockQuantity);
    setErrors({ stockQuantity: validation.error });
  }, [config.stockQuantity]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Inventory Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select
            value={config.condition ?? ''}
            onChange={(e) => setConfig({ condition: e.target.value ? e.target.value as ConditionType : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Not specified</option>
            <option value="new">Brand New</option>
            <option value="certified_preowned">Certified Pre-Owned</option>
            <option value="open_box">Open Box</option>
            <option value="refurbished">Refurbished</option>
            <option value="preowned">Pre-Owned</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
          <select
            value={config.stockStatus ?? ''}
            onChange={(e) => setConfig({ stockStatus: e.target.value ? e.target.value as StockStatus : null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">No status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="on_order">On Order</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (optional)</label>
          <input
            type="text"
            value={config.stockQuantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            onBlur={handleQuantityBlur}
            placeholder="e.g., 5 units"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.stockQuantity ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.stockQuantity && (
            <p className="mt-1 text-xs text-red-600">{errors.stockQuantity}</p>
          )}
        </div>
      </div>

      {/* Status badges preview */}
      {(config.condition !== null || config.stockStatus !== null) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {config.condition !== null && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: CONDITION_CONFIG[config.condition].bgColor,
                color: CONDITION_CONFIG[config.condition].color,
              }}
            >
              {CONDITION_CONFIG[config.condition].label}
            </span>
          )}
          {config.stockStatus !== null && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: STOCK_STATUS_CONFIG[config.stockStatus].bgColor,
                color: STOCK_STATUS_CONFIG[config.stockStatus].color,
              }}
            >
              {STOCK_STATUS_CONFIG[config.stockStatus].label}
              {config.stockQuantity && ` - ${config.stockQuantity}`}
            </span>
          )}
        </div>
      )}
      {config.condition !== null && (
        <p className="mt-2 text-xs text-gray-500">
          {CONDITION_CONFIG[config.condition].description}
        </p>
      )}
    </div>
  );
}
