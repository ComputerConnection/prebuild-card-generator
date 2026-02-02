/**
 * Config Store - Manages PrebuildConfig state with undo/redo history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  PrebuildConfig,
  ComponentCategory,
  ColorTheme,
  StockStatus,
  ConditionType,
  VisualSettings,
  SaleInfo,
  FinancingInfo,
  ThemeColors,
} from '../types';
import { defaultConfig } from '../data/componentOptions';
import { env } from '../config/env';

interface HistoryState {
  past: PrebuildConfig[];
  future: PrebuildConfig[];
}

interface ConfigState {
  // Current config
  config: PrebuildConfig;

  // History for undo/redo
  history: HistoryState;
  maxHistorySize: number;

  // Computed
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setConfig: (config: Partial<PrebuildConfig>) => void;
  resetConfig: () => void;
  loadConfig: (config: PrebuildConfig) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Field-specific setters
  setModelName: (name: string) => void;
  setPrice: (price: number) => void;
  setComponent: (category: ComponentCategory, value: string) => void;
  setComponentPrice: (category: ComponentCategory, price: number) => void;
  setStoreName: (name: string) => void;
  setStoreLogo: (logo: string | null) => void;
  setSku: (sku: string) => void;
  setOs: (os: string) => void;
  setWarranty: (warranty: string) => void;
  setWifi: (wifi: string) => void;
  setBuildTier: (tier: string) => void;
  setFeatures: (features: string[]) => void;
  toggleFeature: (feature: string) => void;
  setDescription: (description: string) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setCustomColors: (colors: ThemeColors) => void;
  setShowComponentPrices: (show: boolean) => void;
  setStockStatus: (status: StockStatus | null) => void;
  setStockQuantity: (quantity: string) => void;
  setCondition: (condition: ConditionType | null) => void;
  setSaleInfo: (info: Partial<SaleInfo>) => void;
  setFinancingInfo: (info: Partial<FinancingInfo>) => void;
  setVisualSettings: (settings: Partial<VisualSettings>) => void;
}

const pushToHistory = (
  state: ConfigState,
  _newConfig: PrebuildConfig
): HistoryState => {
  // _newConfig is passed for reference but we save current state before update
  void _newConfig;
  const newPast = [...state.history.past, state.config];
  // Limit history size
  if (newPast.length > state.maxHistorySize) {
    newPast.shift();
  }
  return {
    past: newPast,
    future: [], // Clear future on new change
  };
};

export const useConfigStore = create<ConfigState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      config: { ...defaultConfig } as PrebuildConfig,
      history: { past: [], future: [] },
      maxHistorySize: env.maxHistorySize,
      canUndo: false,
      canRedo: false,

      // Set partial config with history
      setConfig: (partial) =>
        set((state) => {
          const newConfig = { ...state.config, ...partial };
          const newHistory = pushToHistory(state, newConfig);
          state.config = newConfig;
          state.history = newHistory;
          state.canUndo = newHistory.past.length > 0;
          state.canRedo = false;
        }),

      // Reset to default
      resetConfig: () =>
        set((state) => {
          const newHistory = pushToHistory(state, { ...defaultConfig } as PrebuildConfig);
          state.config = { ...defaultConfig } as PrebuildConfig;
          state.history = newHistory;
          state.canUndo = newHistory.past.length > 0;
          state.canRedo = false;
        }),

      // Load config from preset (with history)
      loadConfig: (config) =>
        set((state) => {
          const newHistory = pushToHistory(state, config);
          state.config = config;
          state.history = newHistory;
          state.canUndo = newHistory.past.length > 0;
          state.canRedo = false;
        }),

      // Undo
      undo: () =>
        set((state) => {
          if (state.history.past.length === 0) return;
          const previous = state.history.past[state.history.past.length - 1];
          const newPast = state.history.past.slice(0, -1);
          const newFuture = [state.config, ...state.history.future];

          state.config = previous;
          state.history = { past: newPast, future: newFuture };
          state.canUndo = newPast.length > 0;
          state.canRedo = true;
        }),

      // Redo
      redo: () =>
        set((state) => {
          if (state.history.future.length === 0) return;
          const next = state.history.future[0];
          const newFuture = state.history.future.slice(1);
          const newPast = [...state.history.past, state.config];

          state.config = next;
          state.history = { past: newPast, future: newFuture };
          state.canUndo = true;
          state.canRedo = newFuture.length > 0;
        }),

      // Field-specific setters (all go through setConfig for history)
      setModelName: (name) => get().setConfig({ modelName: name }),
      setPrice: (price) => get().setConfig({ price }),
      setComponent: (category, value) =>
        get().setConfig({
          components: { ...get().config.components, [category]: value },
        }),
      setComponentPrice: (category, price) =>
        get().setConfig({
          componentPrices: { ...get().config.componentPrices, [category]: price },
        }),
      setStoreName: (name) => get().setConfig({ storeName: name }),
      setStoreLogo: (logo) => get().setConfig({ storeLogo: logo }),
      setSku: (sku) => get().setConfig({ sku }),
      setOs: (os) => get().setConfig({ os }),
      setWarranty: (warranty) => get().setConfig({ warranty }),
      setWifi: (wifi) => get().setConfig({ wifi }),
      setBuildTier: (tier) => get().setConfig({ buildTier: tier }),
      setFeatures: (features) => get().setConfig({ features }),
      toggleFeature: (feature) => {
        const current = get().config.features;
        const newFeatures = current.includes(feature)
          ? current.filter((f) => f !== feature)
          : [...current, feature];
        get().setConfig({ features: newFeatures });
      },
      setDescription: (description) => get().setConfig({ description }),
      setColorTheme: (theme) => get().setConfig({ colorTheme: theme }),
      setCustomColors: (colors) => get().setConfig({ customColors: colors }),
      setShowComponentPrices: (show) => get().setConfig({ showComponentPrices: show }),
      setStockStatus: (status) => get().setConfig({ stockStatus: status }),
      setStockQuantity: (quantity) => get().setConfig({ stockQuantity: quantity }),
      setCondition: (condition) => get().setConfig({ condition }),
      setSaleInfo: (info) =>
        get().setConfig({
          saleInfo: { ...get().config.saleInfo, ...info },
        }),
      setFinancingInfo: (info) =>
        get().setConfig({
          financingInfo: { ...get().config.financingInfo, ...info },
        }),
      setVisualSettings: (settings) =>
        get().setConfig({
          visualSettings: { ...get().config.visualSettings, ...settings },
        }),
    })),
    {
      name: 'prebuild-config-store',
      partialize: (state) => ({
        config: state.config,
        // Don't persist history to keep storage small
      }),
    }
  )
);
