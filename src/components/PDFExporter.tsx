/**
 * PDFExporter - Export PDF cards with lazy loading
 * PDF libraries are loaded on-demand to reduce initial bundle size
 */

import { useState, useCallback, useId, memo } from 'react';
import { PrebuildConfig, CardSize, CARD_SIZES, BrandIcon } from '../types';
import { EmailDialog } from './EmailDialog';
import type { jsPDF } from 'jspdf';

interface PDFExporterProps {
  config: PrebuildConfig;
  cardSize: CardSize;
  onCardSizeChange: (size: CardSize) => void;
  brandIcons: BrandIcon[];
}

const ALL_SIZES: CardSize[] = ['shelf', 'price', 'poster'];

// Module cache for lazy-loaded PDF functions
let pdfModule: typeof import('../utils/pdfGenerator') | null = null;

// Preload PDF module (called on hover)
const preloadPDFModule = async () => {
  if (!pdfModule) {
    pdfModule = await import('../utils/pdfGenerator');
  }
  return pdfModule;
};

export const PDFExporter = memo(function PDFExporter({ config, cardSize, onCardSizeChange, brandIcons }: PDFExporterProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isGeneratingShelfMultiUp, setIsGeneratingShelfMultiUp] = useState(false);
  const [isGeneratingPriceMultiUp, setIsGeneratingPriceMultiUp] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentPdf, setCurrentPdf] = useState<jsPDF | null>(null);
  const [isPreparingEmail, setIsPreparingEmail] = useState(false);
  const [isLoadingModule, setIsLoadingModule] = useState(false);
  const baseId = useId();

  // Lazy load the PDF generator module
  const loadPDFModule = useCallback(async () => {
    if (pdfModule) return pdfModule;
    setIsLoadingModule(true);
    try {
      pdfModule = await import('../utils/pdfGenerator');
      return pdfModule;
    } finally {
      setIsLoadingModule(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { generatePDF, downloadPDF } = await loadPDFModule();
      const doc = await generatePDF(config, cardSize, brandIcons);
      const filename = `${config.modelName || 'PC-Build'}-${CARD_SIZES[cardSize].name.replace(/\s+/g, '-')}.pdf`;
      downloadPDF(doc, filename);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [config, cardSize, brandIcons, loadPDFModule]);

  const handleExportAll = useCallback(async () => {
    setIsGeneratingAll(true);
    setBatchProgress(0);

    try {
      const { generatePDF, downloadPDF } = await loadPDFModule();

      for (let i = 0; i < ALL_SIZES.length; i++) {
        const size = ALL_SIZES[i];
        setBatchProgress(i + 1);

        const doc = await generatePDF(config, size, brandIcons);
        const filename = `${config.modelName || 'PC-Build'}-${CARD_SIZES[size].name.replace(/\s+/g, '-')}.pdf`;
        downloadPDF(doc, filename);

        // Small delay between downloads to prevent browser issues
        if (i < ALL_SIZES.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('Failed to generate PDFs:', error);
      alert('Failed to generate PDFs. Please try again.');
    } finally {
      setIsGeneratingAll(false);
      setBatchProgress(0);
    }
  }, [config, brandIcons, loadPDFModule]);

  const handleExportShelfMultiUp = useCallback(async () => {
    setIsGeneratingShelfMultiUp(true);
    try {
      const { generateShelfTagMultiUp, downloadPDF } = await loadPDFModule();
      const doc = await generateShelfTagMultiUp(config, true, brandIcons);
      const filename = `${config.modelName || 'PC-Build'}-Shelf-Tags-12up.pdf`;
      downloadPDF(doc, filename);
    } catch (error) {
      console.error('Failed to generate multi-up PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingShelfMultiUp(false);
    }
  }, [config, brandIcons, loadPDFModule]);

  const handleExportPriceMultiUp = useCallback(async () => {
    setIsGeneratingPriceMultiUp(true);
    try {
      const { generatePriceCardMultiUp, downloadPDF } = await loadPDFModule();
      const doc = await generatePriceCardMultiUp(config, true, brandIcons);
      const filename = `${config.modelName || 'PC-Build'}-Price-Cards-2up.pdf`;
      downloadPDF(doc, filename);
    } catch (error) {
      console.error('Failed to generate multi-up PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPriceMultiUp(false);
    }
  }, [config, brandIcons, loadPDFModule]);

  const isDisabled = isGenerating || isGeneratingAll || isGeneratingShelfMultiUp || isGeneratingPriceMultiUp || isPreparingEmail || isLoadingModule;

  const handlePrepareEmail = useCallback(async () => {
    setIsPreparingEmail(true);
    try {
      const { generatePDF } = await loadPDFModule();
      const doc = await generatePDF(config, cardSize, brandIcons);
      setCurrentPdf(doc);
      setEmailDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate PDF for email:', error);
      alert('Failed to prepare PDF. Please try again.');
    } finally {
      setIsPreparingEmail(false);
    }
  }, [config, cardSize, brandIcons, loadPDFModule]);

  // Handle preload on mouse enter - memoized to prevent recreation
  const handleMouseEnter = useCallback(() => {
    preloadPDFModule();
  }, []);

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4"
      onMouseEnter={handleMouseEnter}
    >
      <h2 id={`${baseId}-heading`} className="text-lg font-semibold text-gray-800 mb-3">
        Export PDF
      </h2>

      {/* Size Selection */}
      <div className="mb-4">
        <label id={`${baseId}-size-label`} className="block text-sm font-medium text-gray-700 mb-2">
          Card Size
        </label>
        <div className="space-y-2" role="radiogroup" aria-labelledby={`${baseId}-size-label`}>
          {(Object.keys(CARD_SIZES) as CardSize[]).map((size) => {
            const sizeConfig = CARD_SIZES[size];
            return (
              <label
                key={size}
                className={`flex items-center p-3 rounded-md border-2 cursor-pointer transition-colors ${
                  cardSize === size
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="cardSize"
                  value={size}
                  checked={cardSize === size}
                  onChange={() => onCardSizeChange(size)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{sizeConfig.name}</p>
                  <p className="text-xs text-gray-500">
                    {sizeConfig.width}&quot; × {sizeConfig.height}&quot; - {sizeConfig.description}
                  </p>
                </div>
                {cardSize === size && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="space-y-2">
        {/* Single Export Button */}
        <button
          onClick={handleExport}
          disabled={isDisabled}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-describedby={isLoadingModule ? `${baseId}-loading` : undefined}
        >
          {isGenerating || isLoadingModule ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {isLoadingModule ? 'Loading...' : 'Generating...'}
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download {CARD_SIZES[cardSize].name}
            </>
          )}
        </button>
        {isLoadingModule && (
          <p id={`${baseId}-loading`} className="sr-only">
            Loading PDF generator module
          </p>
        )}

        {/* Multi-up Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Multi-up Shelf Tags Button */}
          <button
            onClick={handleExportShelfMultiUp}
            disabled={isDisabled}
            className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Download 12-up shelf tags on letter paper"
          >
            {isGeneratingShelfMultiUp ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  />
                </svg>
                Shelf 12-up
              </>
            )}
          </button>

          {/* Multi-up Price Cards Button */}
          <button
            onClick={handleExportPriceMultiUp}
            disabled={isDisabled}
            className="px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label="Download 2-up price cards on letter paper"
          >
            {isGeneratingPriceMultiUp ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                  />
                </svg>
                Price 2-up
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Multi-up on letter paper with crop marks
        </p>

        {/* Batch Export Button */}
        <button
          onClick={handleExportAll}
          disabled={isDisabled}
          className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Download all three card sizes"
        >
          {isGeneratingAll ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating {batchProgress} of {ALL_SIZES.length}...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download All Sizes
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Downloads Shelf Tag, Price Card, and Poster
        </p>

        {/* Email Button */}
        <button
          onClick={handlePrepareEmail}
          disabled={isDisabled}
          className="w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-label={`Email ${CARD_SIZES[cardSize].name} PDF`}
        >
          {isPreparingEmail ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Preparing...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email {CARD_SIZES[cardSize].name}
            </>
          )}
        </button>
      </div>

      {/* Email Dialog */}
      <EmailDialog
        isOpen={emailDialogOpen}
        onClose={() => {
          setEmailDialogOpen(false);
          setCurrentPdf(null);
        }}
        config={config}
        pdfDoc={currentPdf}
        cardSize={CARD_SIZES[cardSize].name}
      />
    </div>
  );
});
