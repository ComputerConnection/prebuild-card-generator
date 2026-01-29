import { useRef, useState } from 'react';
import { BrandIcon } from '../types';
import { getAllBrandNames } from '../utils/brandDetection';

interface BrandIconManagerProps {
  brandIcons: BrandIcon[];
  onUpdate: (icons: BrandIcon[]) => void;
}

const KNOWN_BRANDS = getAllBrandNames();

export function BrandIconManager({ brandIcons, onUpdate }: BrandIconManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const brandName = selectedBrand === '__custom__' ? customBrand.trim() : selectedBrand;
    if (!brandName) {
      alert('Please select or enter a brand name first');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const image = event.target?.result as string;

      // Check if brand already exists, update it
      const existingIndex = brandIcons.findIndex(
        icon => icon.name.toLowerCase() === brandName.toLowerCase()
      );

      if (existingIndex >= 0) {
        const updated = [...brandIcons];
        updated[existingIndex] = { name: brandName, image };
        onUpdate(updated);
      } else {
        onUpdate([...brandIcons, { name: brandName, image }]);
      }

      // Reset
      setSelectedBrand('');
      setCustomBrand('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (name: string) => {
    onUpdate(brandIcons.filter(icon => icon.name !== name));
  };

  const handleUploadClick = () => {
    const brandName = selectedBrand === '__custom__' ? customBrand.trim() : selectedBrand;
    if (!brandName) {
      alert('Please select or enter a brand name first');
      return;
    }
    fileInputRef.current?.click();
  };

  // Brands that don't have icons yet
  const missingBrands = KNOWN_BRANDS.filter(
    brand => !brandIcons.some(icon => icon.name.toLowerCase() === brand.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Brand Icons
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({brandIcons.length} uploaded)
          </span>
        </h2>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-500">
            Upload PNG icons for brands. They'll auto-appear next to matching specs.
          </p>

          {/* Upload section */}
          <div className="flex gap-2">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select brand...</option>
              {missingBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
              <option value="__custom__">-- Custom --</option>
            </select>

            {selectedBrand === '__custom__' && (
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="Brand name"
                className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={handleUploadClick}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload
            </button>
          </div>

          {/* Uploaded icons grid */}
          {brandIcons.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {brandIcons.map((icon) => (
                <div
                  key={icon.name}
                  className="relative group flex flex-col items-center p-2 bg-gray-50 rounded-md"
                >
                  <img
                    src={icon.image}
                    alt={icon.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[10px] text-gray-600 mt-1 truncate w-full text-center">
                    {icon.name}
                  </span>
                  <button
                    onClick={() => handleDelete(icon.name)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {brandIcons.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No brand icons uploaded yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
