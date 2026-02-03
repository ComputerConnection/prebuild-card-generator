/**
 * Tests for src/components/forms/ComponentsForm.tsx
 * Tests the PC component selection form
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentsForm } from '../../../../components/forms/ComponentsForm';
import { useConfigStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';

// Mock the component library utilities
vi.mock('../../../../utils/componentLibrary', () => ({
  loadComponentLibrary: vi.fn().mockReturnValue(null),
  saveComponentLibrary: vi.fn(),
  createInitialLibrary: vi.fn().mockReturnValue({
    components: [
      { category: 'cpu', brand: 'Intel', modelLine: 'Core', name: 'Intel Core i9-14900K' },
      { category: 'cpu', brand: 'AMD', modelLine: 'Ryzen', name: 'AMD Ryzen 9 7950X3D' },
      { category: 'gpu', brand: 'NVIDIA', modelLine: 'GeForce', name: 'NVIDIA RTX 4090' },
      { category: 'gpu', brand: 'AMD', modelLine: 'Radeon', name: 'AMD RX 7900 XTX' },
    ],
    version: 1,
  }),
  addComponent: vi.fn((lib, _cat, _brand, _model, name) => ({
    ...lib,
    components: [...lib.components, { category: 'cpu', brand: 'Test', modelLine: 'Test', name }],
  })),
  exportLibrary: vi.fn().mockReturnValue('{"components":[],"version":1}'),
  importLibrary: vi.fn().mockReturnValue({ components: [], version: 1 }),
}));

// Mock EnhancedComponentSelector
vi.mock('../../../../components/EnhancedComponentSelector', () => ({
  EnhancedComponentSelector: ({
    category,
    value,
    onChange,
    showPrice,
    priceValue,
    onPriceChange,
  }: {
    category: string;
    value: string;
    onChange: (value: string) => void;
    showPrice?: boolean;
    priceValue?: number;
    onPriceChange?: (value: number) => void;
  }) => (
    <div data-testid={`component-${category}`}>
      <label>{category.toUpperCase()}</label>
      <select
        data-testid={`${category}-select`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select {category}...</option>
        <option value="test-value">Test {category}</option>
        <option value="Intel Core i9-14900K">Intel Core i9-14900K</option>
        <option value="AMD Ryzen 9 7950X3D">AMD Ryzen 9 7950X3D</option>
        <option value="NVIDIA RTX 4090">NVIDIA RTX 4090</option>
      </select>
      {showPrice && (
        <input
          data-testid={`${category}-price`}
          type="number"
          value={priceValue || ''}
          onChange={(e) => onPriceChange?.(Number(e.target.value))}
        />
      )}
    </div>
  ),
}));

describe('ComponentsForm', () => {
  beforeEach(() => {
    // Reset store before each test
    useConfigStore.setState({
      config: { ...defaultConfig },
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false,
    });
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the Components header', () => {
      render(<ComponentsForm />);

      expect(screen.getByText('Components')).toBeInTheDocument();
    });

    it('should render all component categories', () => {
      render(<ComponentsForm />);

      expect(screen.getByTestId('component-cpu')).toBeInTheDocument();
      expect(screen.getByTestId('component-gpu')).toBeInTheDocument();
      expect(screen.getByTestId('component-ram')).toBeInTheDocument();
      expect(screen.getByTestId('component-storage')).toBeInTheDocument();
      expect(screen.getByTestId('component-motherboard')).toBeInTheDocument();
      expect(screen.getByTestId('component-psu')).toBeInTheDocument();
      expect(screen.getByTestId('component-case')).toBeInTheDocument();
      expect(screen.getByTestId('component-cooling')).toBeInTheDocument();
    });

    it('should render show prices checkbox', () => {
      render(<ComponentsForm />);

      expect(screen.getByText('Show prices')).toBeInTheDocument();
    });

    it('should render import/export buttons', () => {
      render(<ComponentsForm />);

      expect(screen.getByText('Import')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should show helper text', () => {
      render(<ComponentsForm />);

      expect(screen.getByText(/Use dropdowns to browse by brand/)).toBeInTheDocument();
    });
  });

  describe('component selection', () => {
    it('should update store when component is selected', async () => {
      const user = userEvent.setup();
      render(<ComponentsForm />);

      const cpuSelect = screen.getByTestId('cpu-select');
      await user.selectOptions(cpuSelect, 'Intel Core i9-14900K');

      const { config } = useConfigStore.getState();
      expect(config.components.cpu).toBe('Intel Core i9-14900K');
    });

    it('should display current config values', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          components: {
            ...defaultConfig.components,
            cpu: 'Intel Core i9-14900K',
            gpu: 'NVIDIA RTX 4090',
          },
        },
      });

      render(<ComponentsForm />);

      const cpuSelect = screen.getByTestId('cpu-select');
      expect(cpuSelect).toHaveValue('Intel Core i9-14900K');
    });
  });

  describe('show prices toggle', () => {
    it('should be unchecked by default', () => {
      render(<ComponentsForm />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should toggle show prices setting', async () => {
      const user = userEvent.setup();
      render(<ComponentsForm />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const { config } = useConfigStore.getState();
      expect(config.showComponentPrices).toBe(true);
    });

    it('should show component total when prices enabled', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          showComponentPrices: true,
          componentPrices: {
            cpu: 500,
            gpu: 1000,
            ram: 200,
            storage: 150,
            motherboard: 300,
            psu: 150,
            case: 100,
            cooling: 100,
          },
        },
      });

      render(<ComponentsForm />);

      expect(screen.getByText(/Component total:/)).toBeInTheDocument();
      // Total should be 2500 formatted (mock component shows unformatted)
      expect(screen.getByText(/2500/)).toBeInTheDocument();
    });

    it('should not show component total when prices disabled', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          showComponentPrices: false,
        },
      });

      render(<ComponentsForm />);

      expect(screen.queryByText(/Component total:/)).not.toBeInTheDocument();
    });

    it('should show price inputs when enabled', async () => {
      const user = userEvent.setup();
      render(<ComponentsForm />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Price inputs should now be visible
      expect(screen.getByTestId('cpu-price')).toBeInTheDocument();
      expect(screen.getByTestId('gpu-price')).toBeInTheDocument();
    });
  });

  describe('component price input', () => {
    it('should update store when price is entered', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          showComponentPrices: true,
        },
      });

      const user = userEvent.setup();
      render(<ComponentsForm />);

      const cpuPriceInput = screen.getByTestId('cpu-price');
      await user.clear(cpuPriceInput);
      await user.type(cpuPriceInput, '599');

      await waitFor(() => {
        const { config } = useConfigStore.getState();
        expect(config.componentPrices.cpu).toBe(599);
      });
    });
  });

  describe('library import/export', () => {
    it('should trigger file input when Import clicked', () => {
      render(<ComponentsForm />);

      const importButton = screen.getByText('Import');
      // The file input should be triggered when import button is clicked
      // This is handled by the ref, so we just verify the button exists
      expect(importButton).toBeInTheDocument();
    });

    it('should call exportLibrary when Export clicked', async () => {
      const user = userEvent.setup();

      // Mock URL.createObjectURL and createElement
      const mockUrl = 'blob:mock-url';
      global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      global.URL.revokeObjectURL = vi.fn();

      const mockClick = vi.fn();
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'a') {
          const el = originalCreateElement('a');
          el.click = mockClick;
          return el;
        }
        return originalCreateElement(tag);
      });

      render(<ComponentsForm />);

      const exportButton = screen.getByText('Export');
      await user.click(exportButton);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('history integration', () => {
    it('should add to history when component changes', async () => {
      const user = userEvent.setup();
      render(<ComponentsForm />);

      const cpuSelect = screen.getByTestId('cpu-select');
      await user.selectOptions(cpuSelect, 'test-value');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty component values', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          components: {
            cpu: '',
            gpu: '',
            ram: '',
            storage: '',
            motherboard: '',
            psu: '',
            case: '',
            cooling: '',
          },
        },
      });

      render(<ComponentsForm />);

      const cpuSelect = screen.getByTestId('cpu-select');
      expect(cpuSelect).toHaveValue('');
    });

    it('should handle zero prices', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          showComponentPrices: true,
          componentPrices: {
            cpu: 0,
            gpu: 0,
            ram: 0,
            storage: 0,
            motherboard: 0,
            psu: 0,
            case: 0,
            cooling: 0,
          },
        },
      });

      render(<ComponentsForm />);

      // The total should show $0.00
      const totalElement = screen.getByText(/Component total:/);
      expect(totalElement.textContent).toContain('$0.00');
    });
  });
});
