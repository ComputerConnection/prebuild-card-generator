/**
 * Tests for ColorThemeSelector component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorThemeSelector } from '../../../../components/forms/ColorThemeSelector';
import { useConfigStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';
import { THEME_PRESETS } from '../../../../types';

describe('ColorThemeSelector', () => {
  beforeEach(() => {
    // Reset store before each test
    useConfigStore.setState({
      config: { ...defaultConfig },
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false,
    });
  });

  describe('rendering', () => {
    it('should render all theme options', () => {
      render(<ColorThemeSelector />);

      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Gaming')).toBeInTheDocument();
      expect(screen.getByText('Workstation')).toBeInTheDocument();
      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });

    it('should render heading', () => {
      render(<ColorThemeSelector />);
      expect(screen.getByText('Color Theme')).toBeInTheDocument();
    });

    it('should show selected theme with highlighted border', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, colorTheme: 'gaming' },
      });

      render(<ColorThemeSelector />);

      const gamingButton = screen.getByText('Gaming').closest('button');
      expect(gamingButton).toHaveClass('border-blue-500');
    });
  });

  describe('theme selection', () => {
    it('should update config when selecting gaming theme', () => {
      render(<ColorThemeSelector />);

      const gamingButton = screen.getByText('Gaming');
      fireEvent.click(gamingButton);

      const { config } = useConfigStore.getState();
      expect(config.colorTheme).toBe('gaming');
      expect(config.customColors).toEqual(THEME_PRESETS.gaming);
    });

    it('should update config when selecting workstation theme', () => {
      render(<ColorThemeSelector />);

      const workstationButton = screen.getByText('Workstation');
      fireEvent.click(workstationButton);

      const { config } = useConfigStore.getState();
      expect(config.colorTheme).toBe('workstation');
      expect(config.customColors).toEqual(THEME_PRESETS.workstation);
    });

    it('should update config when selecting budget theme', () => {
      render(<ColorThemeSelector />);

      const budgetButton = screen.getByText('Budget');
      fireEvent.click(budgetButton);

      const { config } = useConfigStore.getState();
      expect(config.colorTheme).toBe('budget');
      expect(config.customColors).toEqual(THEME_PRESETS.budget);
    });

    it('should update config when selecting minimal theme', () => {
      render(<ColorThemeSelector />);

      const minimalButton = screen.getByText('Minimal');
      fireEvent.click(minimalButton);

      const { config } = useConfigStore.getState();
      expect(config.colorTheme).toBe('minimal');
      expect(config.customColors).toEqual(THEME_PRESETS.minimal);
    });

    it('should preserve custom colors when selecting custom theme', () => {
      const customColors = { primary: '#123456', accent: '#654321', priceColor: '#abcdef' };
      useConfigStore.setState({
        config: { ...defaultConfig, customColors },
      });

      render(<ColorThemeSelector />);

      const customButton = screen.getByText('Custom');
      fireEvent.click(customButton);

      const { config } = useConfigStore.getState();
      expect(config.colorTheme).toBe('custom');
      expect(config.customColors).toEqual(customColors);
    });
  });

  describe('custom color pickers', () => {
    // Helper to find color input by label text (labels aren't associated via htmlFor)
    const getColorInputByLabel = (labelText: string) => {
      const label = screen.getByText(labelText);
      const container = label.closest('div');
      return container?.querySelector('input[type="color"]') as HTMLInputElement;
    };

    it('should not show color pickers when non-custom theme is selected', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, colorTheme: 'gaming' },
      });

      render(<ColorThemeSelector />);

      expect(screen.queryByText('Primary')).not.toBeInTheDocument();
      expect(screen.queryByText('Accent')).not.toBeInTheDocument();
      expect(screen.queryByText('Price Color')).not.toBeInTheDocument();
    });

    it('should show color pickers when custom theme is selected', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, colorTheme: 'custom' },
      });

      render(<ColorThemeSelector />);

      expect(screen.getByText('Primary')).toBeInTheDocument();
      expect(screen.getByText('Accent')).toBeInTheDocument();
      expect(screen.getByText('Price Color')).toBeInTheDocument();

      // Verify color inputs exist
      expect(getColorInputByLabel('Primary')).toBeInTheDocument();
      expect(getColorInputByLabel('Accent')).toBeInTheDocument();
      expect(getColorInputByLabel('Price Color')).toBeInTheDocument();
    });

    it('should update primary color when color picker changes', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          colorTheme: 'custom',
          customColors: { primary: '#000000', accent: '#111111', priceColor: '#222222' },
        },
      });

      render(<ColorThemeSelector />);

      const primaryInput = getColorInputByLabel('Primary');
      fireEvent.change(primaryInput, { target: { value: '#ff0000' } });

      const { config } = useConfigStore.getState();
      expect(config.customColors.primary).toBe('#ff0000');
    });

    it('should update accent color when color picker changes', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          colorTheme: 'custom',
          customColors: { primary: '#000000', accent: '#111111', priceColor: '#222222' },
        },
      });

      render(<ColorThemeSelector />);

      const accentInput = getColorInputByLabel('Accent');
      fireEvent.change(accentInput, { target: { value: '#00ff00' } });

      const { config } = useConfigStore.getState();
      expect(config.customColors.accent).toBe('#00ff00');
    });

    it('should update price color when color picker changes', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          colorTheme: 'custom',
          customColors: { primary: '#000000', accent: '#111111', priceColor: '#222222' },
        },
      });

      render(<ColorThemeSelector />);

      const priceColorInput = getColorInputByLabel('Price Color');
      fireEvent.change(priceColorInput, { target: { value: '#0000ff' } });

      const { config } = useConfigStore.getState();
      expect(config.customColors.priceColor).toBe('#0000ff');
    });
  });

  describe('history integration', () => {
    it('should add to history when theme changes', () => {
      render(<ColorThemeSelector />);

      const gamingButton = screen.getByText('Gaming');
      fireEvent.click(gamingButton);

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });
});
