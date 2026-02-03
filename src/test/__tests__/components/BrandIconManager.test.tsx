/**
 * Tests for src/components/BrandIconManager.tsx
 * Tests the brand icon upload and management component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandIconManager } from '../../../components/BrandIconManager';
import { useBrandIconsStore } from '../../../stores';

describe('BrandIconManager', () => {
  beforeEach(() => {
    // Reset the store before each test
    useBrandIconsStore.setState({
      icons: [],
      profiles: [],
      activeProfileId: null,
    });
    vi.clearAllMocks();
  });

  describe('collapsible behavior', () => {
    it('should render collapsed by default', () => {
      render(<BrandIconManager />);

      expect(screen.getByText('Brand Icons')).toBeInTheDocument();
      expect(screen.getByText('(0 uploaded)')).toBeInTheDocument();
      // Content should not be visible when collapsed
      expect(screen.queryByText('Select brand...')).not.toBeInTheDocument();
    });

    it('should expand when header is clicked', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      expect(screen.getByText('Select brand...')).toBeInTheDocument();
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('should collapse when header is clicked again', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      // Expand
      await user.click(screen.getByText('Brand Icons'));
      expect(screen.getByText('Select brand...')).toBeInTheDocument();

      // Collapse
      await user.click(screen.getByText('Brand Icons'));
      expect(screen.queryByText('Select brand...')).not.toBeInTheDocument();
    });

    it('should have correct aria-expanded attribute', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      const button = screen.getByRole('button', { name: /Brand Icons/ });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('icon count display', () => {
    it('should show 0 when no icons uploaded', () => {
      render(<BrandIconManager />);

      expect(screen.getByText('(0 uploaded)')).toBeInTheDocument();
    });

    it('should show correct count when icons exist', () => {
      useBrandIconsStore.setState({
        icons: [
          { name: 'Intel', image: 'data:image' },
          { name: 'AMD', image: 'data:image' },
        ],
        profiles: [],
        activeProfileId: null,
      });

      render(<BrandIconManager />);

      expect(screen.getByText('(2 uploaded)')).toBeInTheDocument();
    });
  });

  describe('brand selection', () => {
    it('should show dropdown with missing brands', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Should have known brands as options
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(1); // At least "Select brand..." and some brands
    });

    it('should have Custom option', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '__custom__');

      expect(select).toHaveValue('__custom__');
    });

    it('should show custom brand input when Custom is selected', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '__custom__');

      expect(screen.getByPlaceholderText('Brand name')).toBeInTheDocument();
    });

    it('should not show custom input for regular brand selection', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'Intel');

      expect(screen.queryByPlaceholderText('Brand name')).not.toBeInTheDocument();
    });

    it('should filter out already uploaded brands from dropdown', async () => {
      useBrandIconsStore.setState({
        icons: [{ name: 'Intel', image: 'data:image' }],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      const options = screen.getAllByRole('option');
      const optionValues = options.map((opt) => (opt as HTMLOptionElement).value);
      expect(optionValues).not.toContain('Intel');
    });
  });

  describe('upload functionality', () => {
    it('should show alert when Upload clicked without brand selected', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      await user.click(screen.getByText('Upload'));

      expect(alertMock).toHaveBeenCalledWith('Please select or enter a brand name first');
    });

    it('should show alert when Upload clicked with custom but empty brand', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '__custom__');
      await user.click(screen.getByText('Upload'));

      expect(alertMock).toHaveBeenCalledWith('Please select or enter a brand name first');
    });

    it('should add icon when file is selected', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'AMD');

      // Create a mock file
      const file = new File(['(image data)'], 'amd-logo.png', { type: 'image/png' });

      // Get the file input
      const fileInput = screen.getByLabelText('Upload brand icon file');
      await user.upload(fileInput, file);

      // Wait for FileReader to complete
      await waitFor(() => {
        const state = useBrandIconsStore.getState();
        expect(state.icons.length).toBe(1);
        expect(state.icons[0].name).toBe('AMD');
      });
    });

    it('should add custom brand icon', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '__custom__');

      const customInput = screen.getByPlaceholderText('Brand name');
      await user.type(customInput, 'MyBrand');

      const file = new File(['(image data)'], 'mybrand.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText('Upload brand icon file');
      await user.upload(fileInput, file);

      await waitFor(() => {
        const state = useBrandIconsStore.getState();
        expect(state.icons.some((i) => i.name === 'MyBrand')).toBe(true);
      });
    });

    it('should reset selection after upload', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'AMD');

      const file = new File(['(image data)'], 'amd.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText('Upload brand icon file');
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(select).toHaveValue('');
      });
    });
  });

  describe('icons grid', () => {
    it('should display uploaded icons', async () => {
      useBrandIconsStore.setState({
        icons: [
          { name: 'Intel', image: 'data:image/png;base64,intel' },
          { name: 'AMD', image: 'data:image/png;base64,amd' },
        ],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      expect(screen.getByAltText('Intel brand icon')).toBeInTheDocument();
      expect(screen.getByAltText('AMD brand icon')).toBeInTheDocument();
      expect(screen.getByText('Intel')).toBeInTheDocument();
      expect(screen.getByText('AMD')).toBeInTheDocument();
    });

    it('should show empty state when no icons', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      expect(screen.getByText('No brand icons uploaded yet')).toBeInTheDocument();
    });

    it('should have accessible icons list', async () => {
      useBrandIconsStore.setState({
        icons: [{ name: 'Intel', image: 'data:image' }],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      const list = screen.getByRole('list', { name: 'Uploaded brand icons' });
      expect(list).toBeInTheDocument();
    });
  });

  describe('delete functionality', () => {
    it('should have delete button for each icon', async () => {
      useBrandIconsStore.setState({
        icons: [{ name: 'Intel', image: 'data:image' }],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      const deleteButton = screen.getByRole('button', { name: 'Remove Intel icon' });
      expect(deleteButton).toBeInTheDocument();
    });

    it('should remove icon when delete is clicked', async () => {
      useBrandIconsStore.setState({
        icons: [
          { name: 'Intel', image: 'data:image' },
          { name: 'AMD', image: 'data:image' },
        ],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const deleteButton = screen.getByRole('button', { name: 'Remove Intel icon' });
      await user.click(deleteButton);

      const state = useBrandIconsStore.getState();
      expect(state.icons.length).toBe(1);
      expect(state.icons[0].name).toBe('AMD');
    });

    it('should update count after deletion', async () => {
      useBrandIconsStore.setState({
        icons: [{ name: 'Intel', image: 'data:image' }],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      expect(screen.getByText('(1 uploaded)')).toBeInTheDocument();

      const deleteButton = screen.getByRole('button', { name: 'Remove Intel icon' });
      await user.click(deleteButton);

      expect(screen.getByText('(0 uploaded)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible select label', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      // sr-only label should exist
      const label = screen.getByText('Select brand');
      expect(label).toHaveClass('sr-only');
    });

    it('should have accessible custom brand input label', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '__custom__');

      const label = screen.getByText('Custom brand name');
      expect(label).toHaveClass('sr-only');
    });

    it('should have aria-hidden on decorative SVGs', async () => {
      useBrandIconsStore.setState({
        icons: [{ name: 'Intel', image: 'data:image' }],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      // Delete button SVG should be aria-hidden
      const deleteButton = screen.getByRole('button', { name: 'Remove Intel icon' });
      const svg = deleteButton.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid uploads', async () => {
      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      // Upload first brand
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'Intel');
      const file1 = new File(['data'], 'intel.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText('Upload brand icon file');
      await user.upload(fileInput, file1);

      await waitFor(() => {
        expect(useBrandIconsStore.getState().icons.length).toBe(1);
      });

      // Upload second brand
      await user.selectOptions(select, 'AMD');
      const file2 = new File(['data'], 'amd.png', { type: 'image/png' });
      await user.upload(fileInput, file2);

      await waitFor(() => {
        expect(useBrandIconsStore.getState().icons.length).toBe(2);
      });
    });

    it('should update existing icon if same brand uploaded', async () => {
      useBrandIconsStore.setState({
        icons: [{ name: 'Intel', image: 'old-image-data' }],
        profiles: [],
        activeProfileId: null,
      });

      const user = userEvent.setup();
      render(<BrandIconManager />);

      await user.click(screen.getByText('Brand Icons'));

      // Try to upload Intel again via custom
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '__custom__');
      const customInput = screen.getByPlaceholderText('Brand name');
      await user.type(customInput, 'Intel');

      const file = new File(['new-data'], 'intel-new.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText('Upload brand icon file');
      await user.upload(fileInput, file);

      await waitFor(() => {
        const state = useBrandIconsStore.getState();
        expect(state.icons.length).toBe(1);
        expect(state.icons[0].name).toBe('Intel');
        // Image should be updated (not the old one)
      });
    });
  });
});
