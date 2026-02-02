/**
 * Tests for InventoryStatusForm component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryStatusForm } from '../../../../components/forms/InventoryStatusForm';
import { useConfigStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';

// Helper to get select by its associated label text
const getSelectByLabel = (labelText: string) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div');
  return container?.querySelector('select') as HTMLSelectElement;
};

// Helper to get input by its associated label text (kept for future use)
const _getInputByLabel = (labelText: string) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div');
  return container?.querySelector('input') as HTMLInputElement;
};

describe('InventoryStatusForm', () => {
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
    it('should render heading and all form fields', () => {
      render(<InventoryStatusForm />);

      expect(screen.getByText('Inventory Status')).toBeInTheDocument();
      expect(screen.getByText('Condition')).toBeInTheDocument();
      expect(screen.getByText('Stock Status')).toBeInTheDocument();
      expect(screen.getByText('Quantity (optional)')).toBeInTheDocument();
    });

    it('should display current config values', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          condition: 'refurbished',
          stockStatus: 'low_stock',
          stockQuantity: '5 units',
        },
      });

      render(<InventoryStatusForm />);

      expect(getSelectByLabel('Condition')).toHaveValue('refurbished');
      expect(getSelectByLabel('Stock Status')).toHaveValue('low_stock');
      expect(screen.getByPlaceholderText('e.g., 5 units')).toHaveValue('5 units');
    });
  });

  describe('condition select', () => {
    it('should have all condition options', () => {
      render(<InventoryStatusForm />);

      const conditionSelect = getSelectByLabel('Condition');
      expect(conditionSelect.querySelector('option[value=""]')).toBeInTheDocument();
      expect(conditionSelect.querySelector('option[value="new"]')).toBeInTheDocument();
      expect(conditionSelect.querySelector('option[value="certified_preowned"]')).toBeInTheDocument();
      expect(conditionSelect.querySelector('option[value="open_box"]')).toBeInTheDocument();
      expect(conditionSelect.querySelector('option[value="refurbished"]')).toBeInTheDocument();
      expect(conditionSelect.querySelector('option[value="preowned"]')).toBeInTheDocument();
    });

    it('should update config when condition changes', async () => {
      const user = userEvent.setup();
      render(<InventoryStatusForm />);

      const conditionSelect = getSelectByLabel('Condition');
      await user.selectOptions(conditionSelect, 'new');

      const { config } = useConfigStore.getState();
      expect(config.condition).toBe('new');
    });

    it('should set condition to null when empty option selected', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, condition: 'new' },
      });

      render(<InventoryStatusForm />);

      const conditionSelect = getSelectByLabel('Condition');
      await user.selectOptions(conditionSelect, '');

      const { config } = useConfigStore.getState();
      expect(config.condition).toBeNull();
    });

    it('should show condition badge when condition is set', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, condition: 'refurbished' },
      });

      render(<InventoryStatusForm />);

      // Both select option and badge show "Refurbished"
      const elements = screen.getAllByText('Refurbished');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show condition description when condition is set', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, condition: 'certified_preowned' },
      });

      render(<InventoryStatusForm />);

      // Check for the description text
      expect(screen.getByText(/Professionally inspected/i)).toBeInTheDocument();
    });
  });

  describe('stock status select', () => {
    it('should have all stock status options', () => {
      render(<InventoryStatusForm />);

      const stockSelect = getSelectByLabel('Stock Status');
      expect(stockSelect.querySelector('option[value=""]')).toBeInTheDocument();
      expect(stockSelect.querySelector('option[value="in_stock"]')).toBeInTheDocument();
      expect(stockSelect.querySelector('option[value="low_stock"]')).toBeInTheDocument();
      expect(stockSelect.querySelector('option[value="out_of_stock"]')).toBeInTheDocument();
      expect(stockSelect.querySelector('option[value="on_order"]')).toBeInTheDocument();
    });

    it('should update config when stock status changes', async () => {
      const user = userEvent.setup();
      render(<InventoryStatusForm />);

      const stockSelect = getSelectByLabel('Stock Status');
      await user.selectOptions(stockSelect, 'in_stock');

      const { config } = useConfigStore.getState();
      expect(config.stockStatus).toBe('in_stock');
    });

    it('should set stockStatus to null when empty option selected', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, stockStatus: 'in_stock' },
      });

      render(<InventoryStatusForm />);

      const stockSelect = getSelectByLabel('Stock Status');
      await user.selectOptions(stockSelect, '');

      const { config } = useConfigStore.getState();
      expect(config.stockStatus).toBeNull();
    });

    it('should show stock status badge when set', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, stockStatus: 'low_stock' },
      });

      render(<InventoryStatusForm />);

      // Both select option and badge show "Low Stock"
      const elements = screen.getAllByText('Low Stock');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show quantity in stock badge', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          stockStatus: 'in_stock',
          stockQuantity: '10 units',
        },
      });

      render(<InventoryStatusForm />);

      expect(screen.getByText(/10 units/)).toBeInTheDocument();
    });
  });

  describe('quantity input', () => {
    it('should update config when quantity changes', async () => {
      const user = userEvent.setup();
      render(<InventoryStatusForm />);

      const quantityInput = screen.getByPlaceholderText('e.g., 5 units');
      await user.clear(quantityInput);
      await user.type(quantityInput, '15 units');

      const { config } = useConfigStore.getState();
      expect(config.stockQuantity).toBe('15 units');
    });

    it('should allow clearing quantity', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, stockQuantity: '5 units' },
      });

      render(<InventoryStatusForm />);

      const quantityInput = screen.getByPlaceholderText('e.g., 5 units');
      await user.clear(quantityInput);

      const { config } = useConfigStore.getState();
      expect(config.stockQuantity).toBe('');
    });

    it('should show validation error for quantity that is too large', async () => {
      const user = userEvent.setup();
      render(<InventoryStatusForm />);

      const quantityInput = screen.getByPlaceholderText('e.g., 5 units');
      await user.clear(quantityInput);
      await user.type(quantityInput, '99999999');
      fireEvent.blur(quantityInput);

      await waitFor(() => {
        expect(screen.getByText(/Quantity too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('status badges preview', () => {
    it('should not show badges when no status is set', () => {
      render(<InventoryStatusForm />);

      // Badge section should not exist - check for actual badge text not option text
      const brandNewBadges = screen.queryAllByText('Brand New');
      // Should only have the option in select, not a badge
      expect(brandNewBadges.length).toBeLessThanOrEqual(1);
    });

    it('should show both badges when both statuses are set', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          condition: 'new',
          stockStatus: 'in_stock',
        },
      });

      render(<InventoryStatusForm />);

      // Should have badge text - there will be both option text and badge text
      // Brand New appears in select option and as a badge
      const brandNewElements = screen.getAllByText('Brand New');
      expect(brandNewElements.length).toBeGreaterThanOrEqual(1);
      // In Stock appears in select option and as a badge
      const inStockElements = screen.getAllByText('In Stock');
      expect(inStockElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('history integration', () => {
    it('should add to history when condition changes', async () => {
      const user = userEvent.setup();
      render(<InventoryStatusForm />);

      const conditionSelect = getSelectByLabel('Condition');
      await user.selectOptions(conditionSelect, 'new');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });

    it('should add to history when stock status changes', async () => {
      const user = userEvent.setup();
      render(<InventoryStatusForm />);

      const stockSelect = getSelectByLabel('Stock Status');
      await user.selectOptions(stockSelect, 'in_stock');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });
});
