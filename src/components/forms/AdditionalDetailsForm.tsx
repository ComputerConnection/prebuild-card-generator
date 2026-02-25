/**
 * AdditionalDetailsForm - OS, warranty, connectivity, description, and feature badges
 */

import { useId } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '../../stores';
import {
  osOptions,
  warrantyOptions,
  wifiOptions,
  featureOptions,
} from '../../data/componentOptions';

export function AdditionalDetailsForm() {
  const baseId = useId();
  const { os, warranty, wifi, description, features, setConfig, toggleFeature } = useConfigStore(
    useShallow((state) => ({
      os: state.config.os,
      warranty: state.config.warranty,
      wifi: state.config.wifi,
      description: state.config.description,
      features: state.config.features,
      setConfig: state.setConfig,
      toggleFeature: state.toggleFeature,
    }))
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Additional Details</h2>
      <p className="text-sm text-gray-500 mb-3">These fields appear on Price Cards and Posters</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label htmlFor={`${baseId}-os`} className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
          <select
            id={`${baseId}-os`}
            value={os}
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
          <label htmlFor={`${baseId}-warranty`} className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
          <select
            id={`${baseId}-warranty`}
            value={warranty}
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
          <label htmlFor={`${baseId}-wifi`} className="block text-sm font-medium text-gray-700 mb-1">Connectivity</label>
          <select
            id={`${baseId}-wifi`}
            value={wifi}
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
        <label htmlFor={`${baseId}-description`} className="block text-sm font-medium text-gray-700 mb-1">
          Description (Poster only)
        </label>
        <textarea
          id={`${baseId}-description`}
          value={description}
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
              aria-pressed={features.includes(feature)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                features.includes(feature)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {feature}
            </button>
          ))}
        </div>
        {features.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {features.length} selected (up to 6 shown on poster)
          </p>
        )}
      </div>
    </div>
  );
}
