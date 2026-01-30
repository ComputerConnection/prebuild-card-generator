/**
 * BuildInfoForm - Model name, price, SKU, and build tier
 */

import { useConfigStore } from '../../stores';
import { buildTierOptions } from '../../data/componentOptions';

export function BuildInfoForm() {
  const { config, setConfig } = useConfigStore();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Build Info</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model Name</label>
          <input
            type="text"
            value={config.modelName}
            onChange={(e) => setConfig({ modelName: e.target.value })}
            placeholder="e.g., Gaming Pro X"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="text"
            value={config.price}
            onChange={(e) => setConfig({ price: e.target.value })}
            placeholder="e.g., $1,499"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Product Code</label>
          <input
            type="text"
            value={config.sku}
            onChange={(e) => setConfig({ sku: e.target.value })}
            placeholder="e.g., PC-GAM-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Build Tier</label>
          <select
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
