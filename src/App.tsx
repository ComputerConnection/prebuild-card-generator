/**
 * App - Main application component
 * Simplified by extracting forms and layout
 * Optimized with shallow selectors to prevent unnecessary re-renders
 */

import { useCallback, lazy, Suspense } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { MainLayout } from './components/layout';
import {
  StoreBrandingForm,
  ColorThemeSelector,
  BuildInfoForm,
  PricingSalesForm,
  InventoryStatusForm,
  ComponentsForm,
  AdditionalDetailsForm,
} from './components/forms';
import { PrintQueue } from './components/PrintQueue';
import { CardPreview } from './components/CardPreview';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy load heavy components that aren't needed for initial render
const PresetManager = lazy(() =>
  import('./components/PresetManager').then((m) => ({ default: m.PresetManager }))
);
const PDFExporter = lazy(() =>
  import('./components/PDFExporter').then((m) => ({ default: m.PDFExporter }))
);
const BrandIconManager = lazy(() =>
  import('./components/BrandIconManager').then((m) => ({ default: m.BrandIconManager }))
);
const VisualSettingsComponent = lazy(() =>
  import('./components/VisualSettings').then((m) => ({ default: m.VisualSettingsComponent }))
);
import { useConfigStore, useUIStore, useBrandIconsStore, usePrintQueueStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { VisualSettings } from './types';

// Fallback for lazy-loaded components
const LazyFallback = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg h-24" />
);

function App() {
  // Use shallow selectors to prevent unnecessary re-renders
  const { config, loadConfig, resetConfig, undo, redo } = useConfigStore(
    useShallow((state) => ({
      config: state.config,
      loadConfig: state.loadConfig,
      resetConfig: state.resetConfig,
      undo: state.undo,
      redo: state.redo,
    }))
  );
  const { cardSize, setCardSize } = useUIStore(
    useShallow((state) => ({
      cardSize: state.cardSize,
      setCardSize: state.setCardSize,
    }))
  );
  const { brandIcons } = useBrandIconsStore(
    useShallow((state) => ({ brandIcons: state.icons }))
  );
  const addMultipleToQueue = usePrintQueueStore((state) => state.addMultipleToQueue);

  // Keyboard shortcuts
  const handleKeyboardSave = useCallback(() => {
    const presetSection = document.querySelector('[data-preset-manager]');
    presetSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleKeyboardNew = useCallback(() => {
    if (confirm('Clear all fields and start fresh?')) {
      resetConfig();
    }
  }, [resetConfig]);

  // Memoize visual settings change handler
  const handleVisualSettingsChange = useCallback((settings: VisualSettings) => {
    useConfigStore.getState().setVisualSettings(settings);
  }, []);

  useKeyboardShortcuts({
    onSave: handleKeyboardSave,
    onNew: handleKeyboardNew,
    onUndo: undo,
    onRedo: redo,
  });

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          <ErrorBoundary compact>
            <StoreBrandingForm />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <ColorThemeSelector />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <BuildInfoForm />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <PricingSalesForm />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <InventoryStatusForm />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <ComponentsForm />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <AdditionalDetailsForm />
          </ErrorBoundary>
        </div>

        {/* Right Column - Preview & Export */}
        <div className="space-y-6">
          <ErrorBoundary compact>
            <Suspense fallback={<LazyFallback />}>
              <PresetManager
                currentConfig={config}
                onLoadPreset={loadConfig}
                onPrintQueue={addMultipleToQueue}
              />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary compact>
            <PrintQueue />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <Suspense fallback={<LazyFallback />}>
              <VisualSettingsComponent
                settings={config.visualSettings}
                sku={config.sku}
                onChange={handleVisualSettingsChange}
              />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary compact>
            <Suspense fallback={<LazyFallback />}>
              <BrandIconManager />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary compact>
            <CardPreview config={config} cardSize={cardSize} brandIcons={brandIcons} />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <Suspense fallback={<LazyFallback />}>
              <PDFExporter
                config={config}
                cardSize={cardSize}
                onCardSizeChange={setCardSize}
                brandIcons={brandIcons}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
