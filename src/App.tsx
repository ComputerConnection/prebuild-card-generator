/**
 * App - Main application component
 * Simplified by extracting forms and layout
 * Optimized with shallow selectors to prevent unnecessary re-renders
 */

import { useCallback } from 'react';
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
import { PresetManager } from './components/PresetManager';
import { PrintQueue } from './components/PrintQueue';
import { CardPreview } from './components/CardPreview';
import { PDFExporter } from './components/PDFExporter';
import { BrandIconManager } from './components/BrandIconManager';
import { VisualSettingsComponent } from './components/VisualSettings';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useConfigStore, useUIStore, useBrandIconsStore, usePrintQueueStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { VisualSettings } from './types';

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
  const brandIcons = useBrandIconsStore((state) => state.icons);
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
            <PresetManager
              currentConfig={config}
              onLoadPreset={loadConfig}
              onPrintQueue={addMultipleToQueue}
            />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <PrintQueue />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <VisualSettingsComponent
              settings={config.visualSettings}
              sku={config.sku}
              onChange={handleVisualSettingsChange}
            />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <BrandIconManager />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <CardPreview config={config} cardSize={cardSize} brandIcons={brandIcons} />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <PDFExporter
              config={config}
              cardSize={cardSize}
              onCardSizeChange={setCardSize}
              brandIcons={brandIcons}
            />
          </ErrorBoundary>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
