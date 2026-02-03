/**
 * Tests for src/components/forms/AdditionalDetailsForm.tsx
 * Tests the additional details form (OS, warranty, connectivity, features)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdditionalDetailsForm } from '../../../../components/forms/AdditionalDetailsForm';
import { useConfigStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';

describe('AdditionalDetailsForm', () => {
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
    it('should render the Additional Details header', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('Additional Details')).toBeInTheDocument();
    });

    it('should render helper text', () => {
      render(<AdditionalDetailsForm />);

      expect(
        screen.getByText(/These fields appear on Price Cards and Posters/)
      ).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('Operating System')).toBeInTheDocument();
      expect(screen.getByText('Warranty')).toBeInTheDocument();
      expect(screen.getByText('Connectivity')).toBeInTheDocument();
      expect(screen.getByText('Description (Poster only)')).toBeInTheDocument();
      expect(screen.getByText('Feature Badges (Poster only)')).toBeInTheDocument();
    });
  });

  // Helper to get select by its label text
  const getSelectByLabel = (labelText: string) => {
    const label = screen.getByText(labelText);
    const container = label.closest('div');
    return container?.querySelector('select') as HTMLSelectElement;
  };

  describe('Operating System select', () => {
    it('should have OS dropdown', () => {
      render(<AdditionalDetailsForm />);

      const osSelect = getSelectByLabel('Operating System');
      expect(osSelect).toBeInTheDocument();
    });

    it('should show Select OS placeholder', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('Select OS...')).toBeInTheDocument();
    });

    it('should have OS options', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('Windows 11 Pro')).toBeInTheDocument();
      expect(screen.getByText('Windows 11 Home')).toBeInTheDocument();
      expect(screen.getByText('No OS Included')).toBeInTheDocument();
    });

    it('should update config when OS is selected', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const osSelect = getSelectByLabel('Operating System');
      await user.selectOptions(osSelect, 'Windows 11 Pro');

      const { config } = useConfigStore.getState();
      expect(config.os).toBe('Windows 11 Pro');
    });

    it('should display current OS value', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          os: 'Windows 11 Pro',
        },
      });

      render(<AdditionalDetailsForm />);

      const osSelect = getSelectByLabel('Operating System');
      expect(osSelect).toHaveValue('Windows 11 Pro');
    });
  });

  describe('Warranty select', () => {
    it('should have warranty dropdown', () => {
      render(<AdditionalDetailsForm />);

      const warrantySelect = getSelectByLabel('Warranty');
      expect(warrantySelect).toBeInTheDocument();
    });

    it('should show Select Warranty placeholder', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('Select Warranty...')).toBeInTheDocument();
    });

    it('should have warranty options', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('3 Year Parts & Labor')).toBeInTheDocument();
      expect(screen.getByText('1 Year Parts & Labor')).toBeInTheDocument();
      expect(screen.getByText('90 Day Warranty')).toBeInTheDocument();
    });

    it('should update config when warranty is selected', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const warrantySelect = getSelectByLabel('Warranty');
      await user.selectOptions(warrantySelect, '2 Year Parts & Labor');

      const { config } = useConfigStore.getState();
      expect(config.warranty).toBe('2 Year Parts & Labor');
    });
  });

  describe('Connectivity select', () => {
    it('should have connectivity dropdown', () => {
      render(<AdditionalDetailsForm />);

      const connectivitySelect = getSelectByLabel('Connectivity');
      expect(connectivitySelect).toBeInTheDocument();
    });

    it('should show Select Connectivity placeholder', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('Select Connectivity...')).toBeInTheDocument();
    });

    it('should have connectivity options', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('WiFi 7 + Bluetooth 5.4')).toBeInTheDocument();
      expect(screen.getByText('WiFi 6E + Bluetooth 5.3')).toBeInTheDocument();
      expect(screen.getByText('2.5Gb Ethernet Only')).toBeInTheDocument();
    });

    it('should update config when connectivity is selected', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const connectivitySelect = getSelectByLabel('Connectivity');
      await user.selectOptions(connectivitySelect, 'WiFi 6E + Bluetooth 5.3');

      const { config } = useConfigStore.getState();
      expect(config.wifi).toBe('WiFi 6E + Bluetooth 5.3');
    });
  });

  describe('Description textarea', () => {
    it('should have description textarea', () => {
      render(<AdditionalDetailsForm />);

      const textarea = screen.getByPlaceholderText('Brief description or selling points...');
      expect(textarea).toBeInTheDocument();
    });

    it('should update config when description is entered', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const textarea = screen.getByPlaceholderText('Brief description or selling points...');
      await user.type(textarea, 'Ultimate gaming machine');

      const { config } = useConfigStore.getState();
      expect(config.description).toBe('Ultimate gaming machine');
    });

    it('should display current description value', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          description: 'Test description',
        },
      });

      render(<AdditionalDetailsForm />);

      const textarea = screen.getByPlaceholderText('Brief description or selling points...');
      expect(textarea).toHaveValue('Test description');
    });

    it('should handle multiline description', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const textarea = screen.getByPlaceholderText('Brief description or selling points...');
      await user.type(textarea, 'Line 1{enter}Line 2');

      const { config } = useConfigStore.getState();
      expect(config.description).toContain('Line 1');
      expect(config.description).toContain('Line 2');
    });
  });

  describe('Feature Badges', () => {
    it('should display all feature options', () => {
      render(<AdditionalDetailsForm />);

      expect(screen.getByText('VR Ready')).toBeInTheDocument();
      expect(screen.getByText('4K Gaming')).toBeInTheDocument();
      expect(screen.getByText('Ray Tracing')).toBeInTheDocument();
      expect(screen.getByText('RGB Lighting')).toBeInTheDocument();
      expect(screen.getByText('DDR5 Memory')).toBeInTheDocument();
    });

    it('should toggle feature on click', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      await user.click(screen.getByText('VR Ready'));

      const { config } = useConfigStore.getState();
      expect(config.features).toContain('VR Ready');
    });

    it('should untoggle feature on second click', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          features: ['VR Ready'],
        },
      });

      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      await user.click(screen.getByText('VR Ready'));

      const { config } = useConfigStore.getState();
      expect(config.features).not.toContain('VR Ready');
    });

    it('should highlight selected features', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          features: ['VR Ready', '4K Gaming'],
        },
      });

      render(<AdditionalDetailsForm />);

      const vrButton = screen.getByText('VR Ready');
      expect(vrButton).toHaveClass('bg-blue-600');
      expect(vrButton).toHaveClass('text-white');
    });

    it('should not highlight unselected features', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          features: [],
        },
      });

      render(<AdditionalDetailsForm />);

      const vrButton = screen.getByText('VR Ready');
      expect(vrButton).toHaveClass('bg-white');
      expect(vrButton).toHaveClass('text-gray-700');
    });

    it('should show feature count when features selected', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          features: ['VR Ready', '4K Gaming', 'Ray Tracing'],
        },
      });

      render(<AdditionalDetailsForm />);

      expect(screen.getByText('3 selected (up to 6 shown on poster)')).toBeInTheDocument();
    });

    it('should not show feature count when no features selected', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          features: [],
        },
      });

      render(<AdditionalDetailsForm />);

      expect(screen.queryByText(/selected \(up to/)).not.toBeInTheDocument();
    });

    it('should allow selecting multiple features', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      await user.click(screen.getByText('VR Ready'));
      await user.click(screen.getByText('4K Gaming'));
      await user.click(screen.getByText('Ray Tracing'));

      const { config } = useConfigStore.getState();
      expect(config.features).toContain('VR Ready');
      expect(config.features).toContain('4K Gaming');
      expect(config.features).toContain('Ray Tracing');
      expect(config.features.length).toBe(3);
    });
  });

  describe('history integration', () => {
    it('should add to history when OS changes', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const osSelect = getSelectByLabel('Operating System');
      await user.selectOptions(osSelect, 'Windows 11 Pro');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });

    it('should add to history when feature is toggled', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      await user.click(screen.getByText('VR Ready'));

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle clearing OS selection', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          os: 'Windows 11 Pro',
        },
      });

      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const osSelect = getSelectByLabel('Operating System');
      await user.selectOptions(osSelect, '');

      const { config } = useConfigStore.getState();
      expect(config.os).toBe('');
    });

    it('should handle empty description', async () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          description: 'Test',
        },
      });

      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const textarea = screen.getByPlaceholderText('Brief description or selling points...');
      await user.clear(textarea);

      const { config } = useConfigStore.getState();
      expect(config.description).toBe('');
    });

    it('should handle rapid feature toggling', async () => {
      const user = userEvent.setup();
      render(<AdditionalDetailsForm />);

      const vrButton = screen.getByText('VR Ready');

      // Rapid toggle
      await user.click(vrButton);
      await user.click(vrButton);
      await user.click(vrButton);

      const { config } = useConfigStore.getState();
      // Should end up with feature toggled (odd number of clicks)
      expect(config.features).toContain('VR Ready');
    });

    it('should display all configured values correctly', () => {
      useConfigStore.setState({
        config: {
          ...defaultConfig,
          os: 'Windows 11 Pro',
          warranty: '3 Year Parts & Labor',
          wifi: 'WiFi 6E + Bluetooth 5.3',
          description: 'Premium gaming PC',
          features: ['VR Ready', '4K Gaming'],
        },
      });

      render(<AdditionalDetailsForm />);

      expect(getSelectByLabel('Operating System')).toHaveValue('Windows 11 Pro');
      expect(getSelectByLabel('Warranty')).toHaveValue('3 Year Parts & Labor');
      expect(getSelectByLabel('Connectivity')).toHaveValue('WiFi 6E + Bluetooth 5.3');
      expect(screen.getByPlaceholderText('Brief description or selling points...')).toHaveValue(
        'Premium gaming PC'
      );
      expect(screen.getByText('2 selected (up to 6 shown on poster)')).toBeInTheDocument();
    });
  });
});
