/**
 * AdditionalDetailsForm - OS, warranty, connectivity, description, and feature badges
 */

import { useConfigStore } from '../../stores';
import {
  osOptions,
  warrantyOptions,
  wifiOptions,
  featureOptions,
} from '../../data/componentOptions';

export function AdditionalDetailsForm() {
  const { config, setConfig, toggleFeature } = useConfigStore();

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Additional Details</h2>
      <p className="text-sm text-gray-500 mb-3">These fields appear on Price Cards and Posters</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
          <select
            value={config.os}
            onChange={(e) => setConfig({ os: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select OS...</option>
            {osOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
          <select
            value={config.warranty}
            onChange={(e) => setConfig({ warranty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select Warranty...</option>
            {warrantyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Connectivity</label>
          <select
            value={config.wifi}
            onChange={(e) => setConfig({ wifi: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Select Connectivity...</option>
            {wifiOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Poster only)
        </label>
        <textarea
          value={config.description}
          onChange={(e) => setConfig({ description: e.target.value })}
          placeholder="Brief description or selling points..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Feature Badges */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feature Badges (Poster only)
        </label>
        <div className="flex flex-wrap gap-2">
          {featureOptions.map((feature) => (
            <button
              key={feature}
              onClick={() => toggleFeature(feature)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                config.features.includes(feature)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
        {config.features.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {config.features.length} selected (up to 6 shown on poster)
          </p>
        )}
      </div>
    </div>
  );
}
