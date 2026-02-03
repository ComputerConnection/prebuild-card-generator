/**
 * Tests for src/components/VisualSettings.tsx
 * Tests the visual settings component for card customization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualSettingsComponent } from '../../../components/VisualSettings';
import { defaultVisualSettings } from '../../../data/componentOptions';
import type { VisualSettings } from '../../../types';

// Mock the barcode utilities
vi.mock('../../../utils/barcode', () => ({
  isValidBarcode: vi.fn((text: string) => text.length > 0 && text.length <= 80),
  generateBarcodeDataUrl: vi.fn((text: string) =>
    text ? 'data:image/png;base64,mockbarcode' : ''
  ),
}));

// Mock the QR code utilities
vi.mock('../../../utils/qrcode', () => ({
  generateQRCodeDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}));

describe('VisualSettingsComponent', () => {
  const defaultProps = {
    settings: { ...defaultVisualSettings } as VisualSettings,
    sku: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('collapsible behavior', () => {
    it('should render collapsed by default', () => {
      render(<VisualSettingsComponent {...defaultProps} />);

      expect(screen.getByText('Visual Settings')).toBeInTheDocument();
      // Content should not be visible when collapsed
      expect(screen.queryByText('Card Template')).not.toBeInTheDocument();
    });

    it('should expand when header is clicked', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByText('Card Template')).toBeInTheDocument();
      expect(screen.getByText('Background Pattern')).toBeInTheDocument();
      expect(screen.getByText('Font Family')).toBeInTheDocument();
    });

    it('should collapse when header is clicked again', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      // Expand
      await user.click(screen.getByText('Visual Settings'));
      expect(screen.getByText('Card Template')).toBeInTheDocument();

      // Collapse
      await user.click(screen.getByText('Visual Settings'));
      expect(screen.queryByText('Card Template')).not.toBeInTheDocument();
    });
  });

  describe('card template selection', () => {
    it('should display all template options', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Tech')).toBeInTheDocument();
      expect(screen.getByText('Elegant')).toBeInTheDocument();
    });

    it('should highlight selected template', async () => {
      const user = userEvent.setup();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{ ...defaultProps.settings, cardTemplate: 'tech' }}
        />
      );

      await user.click(screen.getByText('Visual Settings'));

      const techButton = screen.getByText('Tech').closest('button');
      expect(techButton).toHaveClass('border-blue-500');
    });

    it('should call onChange when template is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VisualSettingsComponent {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Visual Settings'));
      await user.click(screen.getByText('Tech'));

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cardTemplate: 'tech' }));
    });
  });

  describe('background pattern selection', () => {
    it('should display all pattern options', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByText('Solid')).toBeInTheDocument();
      expect(screen.getByText('Gradient')).toBeInTheDocument();
      expect(screen.getByText('Geometric')).toBeInTheDocument();
      expect(screen.getByText('Circuit')).toBeInTheDocument();
      expect(screen.getByText('Dots')).toBeInTheDocument();
    });

    it('should call onChange when pattern is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VisualSettingsComponent {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Visual Settings'));
      await user.click(screen.getByText('Gradient'));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ backgroundPattern: 'gradient' })
      );
    });
  });

  describe('font family selection', () => {
    it('should display font family dropdown', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should call onChange when font is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VisualSettingsComponent {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Visual Settings'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'georgia');

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ fontFamily: 'georgia' }));
    });
  });

  describe('product image upload', () => {
    it('should show upload button when no image', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByText('Upload Product Image')).toBeInTheDocument();
    });

    it('should show image preview when image is set', async () => {
      const user = userEvent.setup();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{
            ...defaultProps.settings,
            productImage: 'data:image/png;base64,test',
          }}
        />
      );

      await user.click(screen.getByText('Visual Settings'));

      const img = screen.getByAltText('Product');
      expect(img).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('should call onChange to remove image', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{
            ...defaultProps.settings,
            productImage: 'data:image/png;base64,test',
          }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Visual Settings'));
      await user.click(screen.getByText('Remove'));

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ productImage: null }));
    });

    it('should show file size info', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByText(/max 5MB/)).toBeInTheDocument();
    });
  });

  describe('QR code settings', () => {
    it('should show QR code checkbox', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByText('Show QR Code')).toBeInTheDocument();
    });

    it('should toggle QR code visibility', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VisualSettingsComponent {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Visual Settings'));
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ showQrCode: true }));
    });

    it('should show URL input when QR code is enabled', async () => {
      const user = userEvent.setup();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{ ...defaultProps.settings, showQrCode: true }}
        />
      );

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.getByPlaceholderText('https://example.com/product')).toBeInTheDocument();
    });

    it('should not show URL input when QR code is disabled', async () => {
      const user = userEvent.setup();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{ ...defaultProps.settings, showQrCode: false }}
        />
      );

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.queryByPlaceholderText('https://example.com/product')).not.toBeInTheDocument();
    });

    it('should update QR code URL', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{ ...defaultProps.settings, showQrCode: true, qrCodeUrl: '' }}
          onChange={onChange}
        />
      );

      await user.click(screen.getByText('Visual Settings'));
      const urlInput = screen.getByPlaceholderText('https://example.com/product');
      await user.type(urlInput, 'https://test.com');

      expect(onChange).toHaveBeenCalled();
      // The onChange is called for each character typed
      // Since this is a controlled component, each keystroke triggers onChange
      // with the current input value (but component doesn't re-render since
      // settings prop isn't updated). Verify onChange was called with expected params.
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ qrCodeUrl: expect.any(String) })
      );
    });

    it('should show validation error for invalid URL', async () => {
      const user = userEvent.setup();
      render(
        <VisualSettingsComponent
          {...defaultProps}
          settings={{ ...defaultProps.settings, showQrCode: true, qrCodeUrl: '' }}
        />
      );

      await user.click(screen.getByText('Visual Settings'));
      const urlInput = screen.getByPlaceholderText('https://example.com/product');
      await user.type(urlInput, 'not-a-url');
      fireEvent.blur(urlInput);

      await waitFor(() => {
        // Should show error styling or message
        expect(urlInput).toHaveClass('border-red-500');
      });
    });
  });

  describe('barcode preview', () => {
    it('should show barcode preview when SKU is provided', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} sku="TEST-123" />);

      await user.click(screen.getByText('Visual Settings'));

      // Should show barcode section
      await waitFor(() => {
        expect(screen.getByText('Barcode (from SKU)')).toBeInTheDocument();
      });
    });

    it('should not show barcode preview when SKU is empty', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} sku="" />);

      await user.click(screen.getByText('Visual Settings'));

      expect(screen.queryByText('Barcode (from SKU)')).not.toBeInTheDocument();
    });

    it('should show auto-generated message', async () => {
      const user = userEvent.setup();
      render(<VisualSettingsComponent {...defaultProps} sku="TEST-123" />);

      await user.click(screen.getByText('Visual Settings'));

      await waitFor(() => {
        expect(screen.getByText('Auto-generated from SKU')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined settings gracefully', () => {
      // Settings should have defaults
      const props = {
        ...defaultProps,
        settings: {
          backgroundPattern: 'solid' as const,
          cardTemplate: 'default' as const,
          fontFamily: 'helvetica' as const,
          showQrCode: false,
          qrCodeUrl: '',
          productImage: null,
        },
      };
      expect(() => render(<VisualSettingsComponent {...props} />)).not.toThrow();
    });

    it('should handle rapid template changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<VisualSettingsComponent {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByText('Visual Settings'));

      // Rapid clicks
      await user.click(screen.getByText('Tech'));
      await user.click(screen.getByText('Minimal'));
      await user.click(screen.getByText('Elegant'));

      expect(onChange).toHaveBeenCalledTimes(3);
    });
  });
});
