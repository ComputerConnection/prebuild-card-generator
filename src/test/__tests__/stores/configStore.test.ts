/**
 * Tests for configStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigStore } from '../../../stores/configStore';
import { defaultConfig } from '../../../data/componentOptions';

describe('configStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useConfigStore.setState({
      config: { ...defaultConfig },
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false,
    });
  });

  describe('initial state', () => {
    it('should have default config values', () => {
      const { config } = useConfigStore.getState();
      expect(config.modelName).toBe('');
      expect(config.price).toBe(0);
      expect(config.colorTheme).toBe('minimal');
    });

    it('should have empty history', () => {
      const { history, canUndo, canRedo } = useConfigStore.getState();
      expect(history.past).toHaveLength(0);
      expect(history.future).toHaveLength(0);
      expect(canUndo).toBe(false);
      expect(canRedo).toBe(false);
    });
  });

  describe('setConfig', () => {
    it('should update config values', () => {
      const { setConfig } = useConfigStore.getState();
      setConfig({ modelName: 'Gaming Beast', price: 1499 });

      const { config } = useConfigStore.getState();
      expect(config.modelName).toBe('Gaming Beast');
      expect(config.price).toBe(1499);
    });

    it('should add to history when changing', () => {
      const { setConfig } = useConfigStore.getState();
      setConfig({ modelName: 'Test Build' });

      const { history, canUndo } = useConfigStore.getState();
      expect(history.past).toHaveLength(1);
      expect(canUndo).toBe(true);
    });

    it('should clear future on new change', () => {
      const store = useConfigStore.getState();
      store.setConfig({ modelName: 'First' });
      store.setConfig({ modelName: 'Second' });
      store.undo();

      // Now we have a future
      expect(useConfigStore.getState().canRedo).toBe(true);

      // Make a new change
      store.setConfig({ modelName: 'Third' });

      // Future should be cleared
      expect(useConfigStore.getState().history.future).toHaveLength(0);
      expect(useConfigStore.getState().canRedo).toBe(false);
    });
  });

  describe('field-specific setters', () => {
    it('should update model name', () => {
      useConfigStore.getState().setModelName('My Build');
      expect(useConfigStore.getState().config.modelName).toBe('My Build');
    });

    it('should update price', () => {
      useConfigStore.getState().setPrice(2000);
      expect(useConfigStore.getState().config.price).toBe(2000);
    });

    it('should update component', () => {
      useConfigStore.getState().setComponent('cpu', 'Intel Core i9-14900K');
      expect(useConfigStore.getState().config.components.cpu).toBe('Intel Core i9-14900K');
    });

    it('should toggle feature', () => {
      useConfigStore.getState().toggleFeature('VR Ready');
      expect(useConfigStore.getState().config.features).toContain('VR Ready');

      useConfigStore.getState().toggleFeature('VR Ready');
      expect(useConfigStore.getState().config.features).not.toContain('VR Ready');
    });
  });

  describe('undo/redo', () => {
    it('should undo changes', () => {
      const store = useConfigStore.getState();
      store.setConfig({ modelName: 'Before' });
      store.setConfig({ modelName: 'After' });

      expect(useConfigStore.getState().config.modelName).toBe('After');

      store.undo();
      expect(useConfigStore.getState().config.modelName).toBe('Before');
    });

    it('should redo changes', () => {
      const store = useConfigStore.getState();
      store.setConfig({ modelName: 'Before' });
      store.setConfig({ modelName: 'After' });
      store.undo();

      expect(useConfigStore.getState().config.modelName).toBe('Before');

      store.redo();
      expect(useConfigStore.getState().config.modelName).toBe('After');
    });

    it('should not undo when no history', () => {
      const initialConfig = useConfigStore.getState().config;
      useConfigStore.getState().undo();
      expect(useConfigStore.getState().config).toEqual(initialConfig);
    });

    it('should not redo when no future', () => {
      useConfigStore.getState().setConfig({ modelName: 'Test' });
      const currentConfig = useConfigStore.getState().config;
      useConfigStore.getState().redo();
      expect(useConfigStore.getState().config).toEqual(currentConfig);
    });
  });

  describe('resetConfig', () => {
    it('should reset to default values', () => {
      const store = useConfigStore.getState();
      store.setConfig({ modelName: 'Test', price: 999 });
      store.resetConfig();

      const { config } = useConfigStore.getState();
      expect(config.modelName).toBe('');
      expect(config.price).toBe(0);
    });

    it('should add to history when resetting', () => {
      const store = useConfigStore.getState();
      store.setConfig({ modelName: 'Test' });
      const historyBefore = useConfigStore.getState().history.past.length;

      store.resetConfig();

      expect(useConfigStore.getState().history.past.length).toBe(historyBefore + 1);
    });
  });

  describe('loadConfig', () => {
    it('should load a preset config', () => {
      const presetConfig = {
        ...defaultConfig,
        modelName: 'Preset Build',
        price: 1999,
        colorTheme: 'gaming' as const,
      };

      useConfigStore.getState().loadConfig(presetConfig);

      const { config } = useConfigStore.getState();
      expect(config.modelName).toBe('Preset Build');
      expect(config.price).toBe(1999);
      expect(config.colorTheme).toBe('gaming');
    });
  });
});
