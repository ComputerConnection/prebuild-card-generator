/**
 * Tests for PrintQueue component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrintQueue } from '../../../components/PrintQueue';
import { usePrintQueueStore } from '../../../stores/printQueueStore';
import { useBrandIconsStore } from '../../../stores/brandIconsStore';
import { Preset, PrebuildConfig } from '../../../types';

// Mock the PDF generator
vi.mock('../../../utils/pdfGenerator', () => ({
  generatePDF: vi.fn().mockResolvedValue({}),
  downloadPDF: vi.fn(),
}));

// Create a mock preset for testing
const createMockPreset = (id: string, name: string, price: number = 1000): Preset => ({
  id,
  name,
  config: {
    modelName: name,
    price,
    components: {
      cpu: 'Test CPU',
      gpu: 'Test GPU',
      ram: '16GB',
      storage: '1TB SSD',
      motherboard: 'Test MB',
      psu: '650W',
      case: 'Test Case',
      cooling: 'Air Cooler',
    },
    storeName: 'Test Store',
    storeLogo: null,
    sku: 'TEST-001',
    os: 'Windows 11',
    warranty: '1 Year',
    wifi: 'Wi-Fi 6',
    buildTier: 'PRO',
    features: [],
    description: '',
    colorTheme: 'gaming',
    customColors: { primary: '#dc2626', accent: '#1f2937', priceColor: '#dc2626' },
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
    showComponentPrices: false,
    stockStatus: null,
    stockQuantity: '',
    saleInfo: { enabled: false, originalPrice: 0, badgeText: 'SALE' },
    financingInfo: { enabled: false, months: 12, apr: 0 },
    visualSettings: {
      backgroundPattern: 'solid',
      cardTemplate: 'default',
      fontFamily: 'helvetica',
      showQrCode: false,
      qrCodeUrl: '',
      productImage: null,
    },
    condition: null,
  } as PrebuildConfig,
  createdAt: Date.now(),
});

describe('PrintQueue', () => {
  beforeEach(() => {
    // Reset print queue store
    usePrintQueueStore.setState({
      queue: [],
      isProcessing: false,
      progress: null,
      error: null,
    });

    // Reset brand icons store
    useBrandIconsStore.setState({
      icons: [],
      profiles: [],
      activeProfileId: null,
    });
  });

  describe('rendering', () => {
    it('should not render when queue is empty', () => {
      render(<PrintQueue />);
      expect(screen.queryByText('Print Queue')).not.toBeInTheDocument();
    });

    it('should render when queue has items', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
      });

      render(<PrintQueue />);
      expect(screen.getByText(/Print Queue/)).toBeInTheDocument();
    });

    it('should display queue count in header', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')],
      });

      render(<PrintQueue />);
      expect(screen.getByText(/Print Queue \(2\)/)).toBeInTheDocument();
    });

    it('should display preset names in queue', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')],
      });

      render(<PrintQueue />);
      expect(screen.getByText('Gaming PC')).toBeInTheDocument();
      expect(screen.getByText('Workstation')).toBeInTheDocument();
    });

    it('should display preset prices', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC', 1499)],
      });

      render(<PrintQueue />);
      expect(screen.getByText('$1,499.00')).toBeInTheDocument();
    });

    it('should show card size selector', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
      });

      render(<PrintQueue />);
      expect(screen.getByText('Card Size')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should show download button with count', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')],
      });

      render(<PrintQueue />);
      expect(screen.getByText('Download 2 PDFs')).toBeInTheDocument();
    });

    it('should show singular PDF text for single item', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
      });

      render(<PrintQueue />);
      expect(screen.getByText('Download 1 PDF')).toBeInTheDocument();
    });
  });

  describe('clear all', () => {
    it('should show clear all button when queue has items', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
      });

      render(<PrintQueue />);
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should clear queue when clear all is clicked', async () => {
      const user = userEvent.setup();
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')],
      });

      render(<PrintQueue />);

      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(0);
    });
  });

  describe('remove individual items', () => {
    it('should remove preset when remove button is clicked', async () => {
      const user = userEvent.setup();
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')],
      });

      render(<PrintQueue />);

      // Find remove buttons by aria-label (there should be 2)
      const removeButtons = screen.getAllByRole('button', { name: /Remove .* from queue/ });
      await user.click(removeButtons[0]);

      const { queue } = usePrintQueueStore.getState();
      expect(queue).toHaveLength(1);
      expect(queue[0].name).toBe('Workstation');
    });
  });

  describe('card size selection', () => {
    it('should have all card size options', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
      });

      render(<PrintQueue />);

      const select = screen.getByRole('combobox');
      expect(select.querySelector('option[value="shelf"]')).toBeInTheDocument();
      expect(select.querySelector('option[value="price"]')).toBeInTheDocument();
      expect(select.querySelector('option[value="poster"]')).toBeInTheDocument();
    });

    it('should default to price card size', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
      });

      render(<PrintQueue />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('price');
    });
  });

  describe('error display', () => {
    it('should show error when error state is set', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        error: 'Failed to generate PDFs',
      });

      render(<PrintQueue />);
      expect(screen.getByText('Failed to generate PDFs')).toBeInTheDocument();
    });

    it('should clear error when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        error: 'Failed to generate PDFs',
      });

      render(<PrintQueue />);

      // Find the error dismiss button (the X button)
      const errorContainer = screen.getByText('Failed to generate PDFs').closest('div');
      const dismissButton = errorContainer?.querySelector('button');
      expect(dismissButton).toBeTruthy();

      await user.click(dismissButton!);

      const { error } = usePrintQueueStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('processing state', () => {
    it('should show progress indicator when processing', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        isProcessing: true,
        progress: {
          current: 1,
          total: 3,
          currentPresetName: 'Gaming PC',
        },
      });

      render(<PrintQueue />);
      expect(screen.getByText(/Generating PDFs/)).toBeInTheDocument();
      // Progress numbers are split across elements, check for their presence in the container
      const progressContainer = screen.getByText(/Generating PDFs/).closest('div');
      expect(progressContainer?.textContent).toContain('1');
      expect(progressContainer?.textContent).toContain('3');
      expect(screen.getByText('Gaming PC')).toBeInTheDocument();
    });

    it('should show cancel button during processing', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        isProcessing: true,
        progress: {
          current: 1,
          total: 3,
          currentPresetName: 'Gaming PC',
        },
      });

      render(<PrintQueue />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should hide card size selector during processing', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        isProcessing: true,
        progress: {
          current: 1,
          total: 3,
          currentPresetName: 'Gaming PC',
        },
      });

      render(<PrintQueue />);
      expect(screen.queryByText('Card Size')).not.toBeInTheDocument();
    });

    it('should hide download button during processing', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        isProcessing: true,
        progress: {
          current: 1,
          total: 3,
          currentPresetName: 'Gaming PC',
        },
      });

      render(<PrintQueue />);
      // Check that the download button specifically is not shown
      expect(screen.queryByRole('button', { name: /Download.*PDF/ })).not.toBeInTheDocument();
    });

    it('should hide clear all button during processing', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC')],
        isProcessing: true,
        progress: {
          current: 1,
          total: 3,
          currentPresetName: 'Gaming PC',
        },
      });

      render(<PrintQueue />);
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });
  });

  describe('drag and drop', () => {
    it('should have draggable items', () => {
      usePrintQueueStore.setState({
        queue: [createMockPreset('1', 'Gaming PC'), createMockPreset('2', 'Workstation')],
      });

      render(<PrintQueue />);

      const items = screen.getByText('Gaming PC').closest('[draggable]');
      expect(items).toHaveAttribute('draggable', 'true');
    });
  });
});
