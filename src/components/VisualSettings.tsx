import { useRef, useState, useEffect, useCallback } from 'react';
import {
  VisualSettings as VisualSettingsType,
  BACKGROUND_PATTERNS,
  CARD_TEMPLATES,
  FONT_FAMILIES,
  BackgroundPattern,
  CardTemplate,
  FontFamily,
} from '../types';
import { generateQRCodeDataUrl } from '../utils/qrcode';
import { generateBarcodeDataUrl, isValidBarcode } from '../utils/barcode';
import { validateUrl, validateImageFile } from '../utils/validation';

interface VisualSettingsProps {
  settings: VisualSettingsType;
  sku: string;
  onChange: (settings: VisualSettingsType) => void;
}

interface FormErrors {
  qrCodeUrl?: string;
  productImage?: string;
}

export function VisualSettingsComponent({ settings, sku, onChange }: VisualSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [qrPreview, setQrPreview] = useState<string>('');
  const [barcodePreview, setBarcodePreview] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const productImageRef = useRef<HTMLInputElement>(null);

  // Generate QR preview when URL changes
  useEffect(() => {
    if (settings.showQrCode && settings.qrCodeUrl) {
      generateQRCodeDataUrl(settings.qrCodeUrl, 80).then(setQrPreview);
    } else {
      setQrPreview('');
    }
  }, [settings.showQrCode, settings.qrCodeUrl]);

  // Generate barcode preview when SKU changes
  useEffect(() => {
    if (sku && isValidBarcode(sku)) {
      setBarcodePreview(generateBarcodeDataUrl(sku, { height: 30, displayValue: false }));
    } else {
      setBarcodePreview('');
    }
  }, [sku]);

  const handleQrUrlChange = useCallback(
    (url: string) => {
      onChange({ ...settings, qrCodeUrl: url });
      if (url) {
        const validation = validateUrl(url);
        setErrors((prev) => ({ ...prev, qrCodeUrl: validation.error }));
      } else {
        setErrors((prev) => ({ ...prev, qrCodeUrl: undefined }));
      }
    },
    [settings, onChange]
  );

  const handleQrUrlBlur = useCallback(() => {
    if (settings.qrCodeUrl) {
      const validation = validateUrl(settings.qrCodeUrl);
      setErrors((prev) => ({ ...prev, qrCodeUrl: validation.error }));
    }
  }, [settings.qrCodeUrl]);

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file before reading
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, productImage: validation.error }));
      return;
    }
    setErrors((prev) => ({ ...prev, productImage: undefined }));

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({ ...settings, productImage: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProductImage = () => {
    onChange({ ...settings, productImage: null });
    if (productImageRef.current) {
      productImageRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-gray-800">Visual Settings</h2>
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
        <div className="mt-4 space-y-4">
          {/* Card Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Template</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CARD_TEMPLATES) as CardTemplate[]).map((template) => (
                <button
                  key={template}
                  onClick={() => onChange({ ...settings, cardTemplate: template })}
                  className={`p-2 text-left rounded-md border-2 transition-colors ${
                    settings.cardTemplate === template
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{CARD_TEMPLATES[template].name}</p>
                  <p className="text-xs text-gray-500">{CARD_TEMPLATES[template].description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Background Pattern */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Pattern
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(BACKGROUND_PATTERNS) as BackgroundPattern[]).map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => onChange({ ...settings, backgroundPattern: pattern })}
                  className={`px-3 py-1.5 text-sm rounded-md border-2 transition-colors ${
                    settings.backgroundPattern === pattern
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {BACKGROUND_PATTERNS[pattern].name}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
            <select
              value={settings.fontFamily}
              onChange={(e) => onChange({ ...settings, fontFamily: e.target.value as FontFamily })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {(Object.keys(FONT_FAMILIES) as FontFamily[]).map((font) => (
                <option key={font} value={font} style={{ fontFamily: FONT_FAMILIES[font].name }}>
                  {FONT_FAMILIES[font].name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <input
              ref={productImageRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleProductImageUpload}
              className="hidden"
            />
            {settings.productImage ? (
              <div className="flex items-center gap-3">
                <img
                  src={settings.productImage}
                  alt="Product"
                  className="w-20 h-20 object-contain border rounded"
                />
                <button
                  onClick={handleRemoveProductImage}
                  className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => productImageRef.current?.click()}
                className={`px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border ${
                  errors.productImage ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                Upload Product Image
              </button>
            )}
            {errors.productImage ? (
              <p className="text-xs text-red-600 mt-1">{errors.productImage}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Shown on Price Cards and Posters (max 5MB)
              </p>
            )}
          </div>

          {/* QR Code */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={settings.showQrCode}
                onChange={(e) => onChange({ ...settings, showQrCode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Show QR Code</span>
            </label>
            {settings.showQrCode && (
              <div>
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={settings.qrCodeUrl}
                    onChange={(e) => handleQrUrlChange(e.target.value)}
                    onBlur={handleQrUrlBlur}
                    placeholder="https://example.com/product"
                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.qrCodeUrl ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {qrPreview && !errors.qrCodeUrl && (
                    <img src={qrPreview} alt="QR Preview" className="w-12 h-12" />
                  )}
                </div>
                {errors.qrCodeUrl && (
                  <p className="mt-1 text-xs text-red-600">{errors.qrCodeUrl}</p>
                )}
              </div>
            )}
          </div>

          {/* Barcode Preview */}
          {sku && barcodePreview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode (from SKU)
              </label>
              <div className="flex items-center gap-3">
                <img src={barcodePreview} alt="Barcode Preview" className="h-10" />
                <span className="text-xs text-gray-500">Auto-generated from SKU</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
