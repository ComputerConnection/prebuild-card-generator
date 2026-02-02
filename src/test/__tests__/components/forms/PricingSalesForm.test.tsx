/**
 * Tests for PricingSalesForm component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingSalesForm } from '../../../../components/forms/PricingSalesForm';
import { useConfigStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';

// Helper to get input/select by its associated label text
const getInputByLabel = (labelText: string) => {
  const label = screen.getByText(labelText);
  const container = label.closest('div');
  return container?.querySelector('input, select') as HTMLInputElement | HTMLSelectElement;
};

describe('PricingSalesForm', () => {
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
    it('should render heading', () => {
      render(<PricingSalesForm />);
      expect(screen.getByText('Pricing & Sales')).toBeInTheDocument();
    });

    it('should render sale toggle checkbox', () => {
      render(<PricingSalesForm />);
      expect(screen.getByText('This item is on sale')).toBeInTheDocument();
    });

    it('should render financing toggle checkbox', () => {
      render(<PricingSalesForm />);
      expect(screen.getByText('Show financing option')).toBeInTheDocument();
    });
  });

  describe('sale toggle', () => {
    it('should not show sale fields when disabled', () => {
      render(<PricingSalesForm />);

      expect(screen.queryByText('Original Price')).not.toBeInTheDocument();
      expect(screen.queryByText('Sale Badge Text')).not.toBeInTheDocument();
    });

    it('should show sale fields when enabled', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const saleToggle = screen.getByRole('checkbox', { name: /this item is on sale/i });
      await user.click(saleToggle);

      expect(screen.getByText('Original Price')).toBeInTheDocument();
      expect(screen.getByText('Sale Badge Text')).toBeInTheDocument();
    });

    it('should update config when sale toggle changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const saleToggle = screen.getByRole('checkbox', { name: /this item is on sale/i });
      await user.click(saleToggle);

      const { config } = useConfigStore.getState();
      expect(config.saleInfo.enabled).toBe(true);
    });

    it('should preserve sale info when toggling on/off', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          saleInfo: { enabled: false, originalPrice: 1999, badgeText: 'HOT DEAL' },
        },
      });

      render(<PricingSalesForm />);

      const saleToggle = screen.getByRole('checkbox', { name: /this item is on sale/i });
      await user.click(saleToggle);

      const { config } = useConfigStore.getState();
      expect(config.saleInfo.originalPrice).toBe(1999);
      expect(config.saleInfo.badgeText).toBe('HOT DEAL');
    });
  });

  describe('original price input', () => {
    beforeEach(async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          saleInfo: { enabled: true, originalPrice: 0, badgeText: 'SALE' },
        },
      });
    });

    it('should update config when original price changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const priceInput = screen.getByPlaceholderText('1,799');
      await user.clear(priceInput);
      await user.type(priceInput, '1999');

      const { config } = useConfigStore.getState();
      expect(config.saleInfo.originalPrice).toBe(1999);
    });

    it('should handle formatted price with commas', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const priceInput = screen.getByPlaceholderText('1,799');
      await user.clear(priceInput);
      await user.type(priceInput, '1,999');

      const { config } = useConfigStore.getState();
      expect(config.saleInfo.originalPrice).toBe(1999);
    });

    it('should show discount percentage when prices are valid', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          price: 1000,
          saleInfo: { enabled: true, originalPrice: 1250, badgeText: 'SALE' },
        },
      });

      render(<PricingSalesForm />);

      expect(screen.getByText('20% off')).toBeInTheDocument();
    });

    it('should show validation error when sale price >= original price', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          price: 1500,
          saleInfo: { enabled: true, originalPrice: 1000, badgeText: 'SALE' },
        },
      });

      render(<PricingSalesForm />);

      await waitFor(() => {
        expect(
          screen.getByText(/Sale price must be less than original price/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('sale badge select', () => {
    beforeEach(async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          saleInfo: { enabled: true, originalPrice: 1999, badgeText: 'SALE' },
        },
      });
    });

    it('should display current badge text', () => {
      render(<PricingSalesForm />);

      const badgeSelect = getInputByLabel('Sale Badge Text') as HTMLSelectElement;
      expect(badgeSelect).toHaveValue('SALE');
    });

    it('should update config when badge text changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const badgeSelect = getInputByLabel('Sale Badge Text');
      await user.selectOptions(badgeSelect, 'HOT DEAL');

      const { config } = useConfigStore.getState();
      expect(config.saleInfo.badgeText).toBe('HOT DEAL');
    });
  });

  describe('financing toggle', () => {
    it('should not show financing fields when disabled', () => {
      render(<PricingSalesForm />);

      expect(screen.queryByText('Term (Months)')).not.toBeInTheDocument();
      expect(screen.queryByText('APR %')).not.toBeInTheDocument();
    });

    it('should show financing fields when enabled', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const financingToggle = screen.getByRole('checkbox', { name: /show financing option/i });
      await user.click(financingToggle);

      expect(screen.getByText('Term (Months)')).toBeInTheDocument();
      expect(screen.getByText('APR %')).toBeInTheDocument();
      expect(screen.getByText('Monthly Payment')).toBeInTheDocument();
    });

    it('should update config when financing toggle changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const financingToggle = screen.getByRole('checkbox', { name: /show financing option/i });
      await user.click(financingToggle);

      const { config } = useConfigStore.getState();
      expect(config.financingInfo.enabled).toBe(true);
    });
  });

  describe('financing term select', () => {
    beforeEach(async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          financingInfo: { enabled: true, months: 12, apr: 0 },
        },
      });
    });

    it('should display current term', () => {
      render(<PricingSalesForm />);

      const termSelect = getInputByLabel('Term (Months)') as HTMLSelectElement;
      expect(termSelect).toHaveValue('12');
    });

    it('should update config when term changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const termSelect = getInputByLabel('Term (Months)');
      await user.selectOptions(termSelect, '24');

      const { config } = useConfigStore.getState();
      expect(config.financingInfo.months).toBe(24);
    });
  });

  describe('APR input', () => {
    beforeEach(async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          financingInfo: { enabled: true, months: 12, apr: 0 },
        },
      });
    });

    it('should update config when APR changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const aprInput = screen.getByPlaceholderText('0 for 0% APR');
      await user.clear(aprInput);
      await user.type(aprInput, '9.99');

      const { config } = useConfigStore.getState();
      expect(config.financingInfo.apr).toBe(9.99);
    });

    it('should show validation error for excessive APR', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const aprInput = screen.getByPlaceholderText('0 for 0% APR');
      await user.clear(aprInput);
      await user.type(aprInput, '150');
      fireEvent.blur(aprInput);

      await waitFor(() => {
        expect(screen.getByText(/APR cannot exceed 100%/i)).toBeInTheDocument();
      });
    });
  });

  describe('monthly payment calculation', () => {
    it('should display calculated monthly payment', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          price: 1200,
          financingInfo: { enabled: true, months: 12, apr: 0 },
        },
      });

      render(<PricingSalesForm />);

      // $1200 / 12 months = $100/mo
      expect(screen.getByText('$100.00/mo')).toBeInTheDocument();
    });

    it('should update payment when price changes', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          price: 2400,
          financingInfo: { enabled: true, months: 24, apr: 0 },
        },
      });

      render(<PricingSalesForm />);

      // $2400 / 24 months = $100/mo
      expect(screen.getByText('$100.00/mo')).toBeInTheDocument();
    });

    it('should handle APR in calculation', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          price: 1200,
          financingInfo: { enabled: true, months: 12, apr: 12 },
        },
      });

      render(<PricingSalesForm />);

      // With APR, payment should be higher than simple division
      const paymentText = screen.getByText(/\/mo$/);
      const payment = parseFloat(
        paymentText.textContent?.replace('$', '').replace('/mo', '') || '0'
      );
      expect(payment).toBeGreaterThan(100); // Should be > $100 due to interest
    });
  });

  describe('history integration', () => {
    it('should add to history when sale info changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const saleToggle = screen.getByLabelText('This item is on sale');
      await user.click(saleToggle);

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });

    it('should add to history when financing info changes', async () => {
      const user = userEvent.setup();
      render(<PricingSalesForm />);

      const financingToggle = screen.getByLabelText('Show financing option');
      await user.click(financingToggle);

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });
});
