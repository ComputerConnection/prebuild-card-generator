/**
 * App - Main application component
 * Simplified to ~50 lines by extracting forms and layout
 */

import { useCallback, useEffect, useState } from 'react';
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
import { CardPreview } from './components/CardPreview';
import { PDFExporter } from './components/PDFExporter';
import { BrandIconManager } from './components/BrandIconManager';
import { VisualSettingsComponent } from './components/VisualSettings';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useConfigStore, useUIStore, useBrandIconsStore } from './stores';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { BrandIcon } from './types';

function App() {
  const { config, loadConfig, resetConfig, undo, redo } = useConfigStore();
  const { cardSize, setCardSize } = useUIStore();
  const { icons } = useBrandIconsStore();

  // Legacy brand icons support
  const [legacyBrandIcons, setLegacyBrandIcons] = useState<BrandIcon[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('prebuild-card-brand-icons');
    if (stored) {
      try {
        setLegacyBrandIcons(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Merge store icons with legacy
  const allBrandIcons = [...legacyBrandIcons, ...icons];

  const handleBrandIconsUpdate = useCallback((newIcons: BrandIcon[]) => {
    setLegacyBrandIcons(newIcons);
    localStorage.setItem('prebuild-card-brand-icons', JSON.stringify(newIcons));
  }, []);

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
              onPrintQueue={(presets) => {
                alert(
                  `Print queue with ${presets.length} presets. This would batch generate PDFs for: ${presets.map((p) => p.name).join(', ')}`
                );
              }}
            />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <VisualSettingsComponent
              settings={config.visualSettings}
              sku={config.sku}
              onChange={(settings) => useConfigStore.getState().setVisualSettings(settings)}
            />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <BrandIconManager brandIcons={allBrandIcons} onUpdate={handleBrandIconsUpdate} />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <CardPreview config={config} cardSize={cardSize} brandIcons={allBrandIcons} />
          </ErrorBoundary>
          <ErrorBoundary compact>
            <PDFExporter
              config={config}
              cardSize={cardSize}
              onCardSizeChange={setCardSize}
              brandIcons={allBrandIcons}
            />
          </ErrorBoundary>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
