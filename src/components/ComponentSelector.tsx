import { useState } from 'react';

interface ComponentSelectorProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export function ComponentSelector({ label, value, options, onChange }: ComponentSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === '__custom__') {
      setIsCustom(true);
      setCustomValue(value);
    } else {
      setIsCustom(false);
      onChange(selectedValue);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomValue(newValue);
    onChange(newValue);
  };

  const handleBackToSelect = () => {
    setIsCustom(false);
    onChange('');
  };

  const isValueInOptions = options.includes(value);
  const displayIsCustom = isCustom || (value && !isValueInOptions);

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {displayIsCustom ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={displayIsCustom ? (isCustom ? customValue : value) : ''}
            onChange={handleCustomChange}
            placeholder={`Enter custom ${label.toLowerCase()}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleBackToSelect}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border border-gray-300 transition-colors"
          >
            List
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">Select {label}...</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value="__custom__">-- Custom Entry --</option>
        </select>
      )}
    </div>
  );
}
