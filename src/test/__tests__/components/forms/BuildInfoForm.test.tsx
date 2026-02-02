/**
 * Tests for BuildInfoForm component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildInfoForm } from '../../../../components/forms/BuildInfoForm';
import { useConfigStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';

// Helper to get input by its associated label text
const getInputByLabel = (labelText: string) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div');
  return container?.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
};

describe('BuildInfoForm', () => {
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
    it('should render all form fields', () => {
      render(<BuildInfoForm />);

      expect(screen.getByText('Build Info')).toBeInTheDocument();
      expect(screen.getByText('Model Name')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('SKU / Product Code')).toBeInTheDocument();
      expect(screen.getByText('Build Tier')).toBeInTheDocument();
    });

    it('should display current config values', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          modelName: 'Gaming PC Pro',
          price: 1499.99,
          sku: 'GPC-001',
          buildTier: 'High-End Gaming',
        },
      });

      render(<BuildInfoForm />);

      expect(screen.getByPlaceholderText('e.g., Gaming Pro X')).toHaveValue('Gaming PC Pro');
      expect(screen.getByPlaceholderText('e.g., PC-GAM-001')).toHaveValue('GPC-001');
      expect(screen.getByDisplayValue('High-End Gaming')).toBeInTheDocument();
    });

    it('should show build tier options', () => {
      render(<BuildInfoForm />);

      expect(screen.getByText('Select Build Tier...')).toBeInTheDocument();
    });
  });

  describe('model name input', () => {
    it('should update config when model name changes', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const modelInput = screen.getByPlaceholderText('e.g., Gaming Pro X');
      await user.clear(modelInput);
      await user.type(modelInput, 'Ultra Gaming Beast');

      const { config } = useConfigStore.getState();
      expect(config.modelName).toBe('Ultra Gaming Beast');
    });

    it('should handle empty model name', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, modelName: 'Test PC' },
      });

      render(<BuildInfoForm />);

      const modelInput = screen.getByPlaceholderText('e.g., Gaming Pro X');
      await user.clear(modelInput);

      const { config } = useConfigStore.getState();
      expect(config.modelName).toBe('');
    });
  });

  describe('price input', () => {
    it('should update config when price changes', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const priceInput = screen.getByPlaceholderText('1,499');
      await user.clear(priceInput);
      await user.type(priceInput, '1999');

      const { config } = useConfigStore.getState();
      expect(config.price).toBe(1999);
    });

    it('should handle formatted price input with commas', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const priceInput = screen.getByPlaceholderText('1,499');
      await user.clear(priceInput);
      await user.type(priceInput, '1,499');

      const { config } = useConfigStore.getState();
      expect(config.price).toBe(1499);
    });

    it('should display formatted price with commas', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, price: 10000 },
      });

      render(<BuildInfoForm />);

      const priceInput = screen.getByPlaceholderText('1,499');
      expect(priceInput).toHaveValue('10,000');
    });

    it('should show validation error for excessive price', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const priceInput = screen.getByPlaceholderText('1,499');
      await user.clear(priceInput);
      await user.type(priceInput, '2000000');
      fireEvent.blur(priceInput);

      await waitFor(() => {
        expect(screen.getByText(/Price exceeds maximum/i)).toBeInTheDocument();
      });
    });
  });

  describe('SKU input', () => {
    it('should update config when SKU changes', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const skuInput = screen.getByPlaceholderText('e.g., PC-GAM-001');
      await user.clear(skuInput);
      await user.type(skuInput, 'PC-GAM-001');

      const { config } = useConfigStore.getState();
      expect(config.sku).toBe('PC-GAM-001');
    });

    it('should show validation error for SKU that is too long', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const skuInput = screen.getByPlaceholderText('e.g., PC-GAM-001');
      const longSku = 'A'.repeat(85);
      await user.clear(skuInput);
      await user.type(skuInput, longSku);
      fireEvent.blur(skuInput);

      await waitFor(() => {
        expect(screen.getByText(/SKU too long for barcode/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for non-ASCII characters in SKU', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const skuInput = screen.getByPlaceholderText('e.g., PC-GAM-001');
      await user.clear(skuInput);
      await user.type(skuInput, 'SKU-émoji');
      fireEvent.blur(skuInput);

      await waitFor(() => {
        expect(screen.getByText(/invalid characters for barcode/i)).toBeInTheDocument();
      });
    });

    it('should accept valid SKU without error', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const skuInput = screen.getByPlaceholderText('e.g., PC-GAM-001');
      await user.clear(skuInput);
      await user.type(skuInput, 'VALID-SKU-123');
      fireEvent.blur(skuInput);

      // No error message should appear
      expect(screen.queryByText(/SKU is too long/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ASCII characters only/i)).not.toBeInTheDocument();
    });
  });

  describe('build tier select', () => {
    it('should update config when build tier changes', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const tierSelect = getInputByLabel('Build Tier');
      await user.selectOptions(tierSelect, 'High-End Gaming');

      const { config } = useConfigStore.getState();
      expect(config.buildTier).toBe('High-End Gaming');
    });

    it('should allow clearing build tier', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, buildTier: 'High-End Gaming' },
      });

      render(<BuildInfoForm />);

      const tierSelect = getInputByLabel('Build Tier');
      await user.selectOptions(tierSelect, '');

      const { config } = useConfigStore.getState();
      expect(config.buildTier).toBe('');
    });
  });

  describe('history integration', () => {
    it('should add to history when model name changes', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const modelInput = screen.getByPlaceholderText('e.g., Gaming Pro X');
      await user.type(modelInput, 'A');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });

    it('should add to history when price changes', async () => {
      const user = userEvent.setup();
      render(<BuildInfoForm />);

      const priceInput = screen.getByPlaceholderText('1,499');
      await user.type(priceInput, '1');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });
});
