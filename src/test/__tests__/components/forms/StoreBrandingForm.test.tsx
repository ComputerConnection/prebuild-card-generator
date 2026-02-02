/**
 * Tests for StoreBrandingForm component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreBrandingForm } from '../../../../components/forms/StoreBrandingForm';
import { useConfigStore, useBrandIconsStore } from '../../../../stores';
import { defaultConfig } from '../../../../data/componentOptions';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock alert
const alertMock = vi.fn();
global.alert = alertMock;

describe('StoreBrandingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset config store
    useConfigStore.setState({
      config: { ...defaultConfig },
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false,
    });

    // Reset brand icons store
    useBrandIconsStore.setState({
      profiles: [],
      activeProfileId: null,
      brandIcons: [],
    });
  });

  describe('rendering', () => {
    it('should render heading', () => {
      render(<StoreBrandingForm />);
      expect(screen.getByText('Store Branding')).toBeInTheDocument();
    });

    it('should render store name input', () => {
      render(<StoreBrandingForm />);
      expect(screen.getByText('Store Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Your Store Name')).toBeInTheDocument();
    });

    it('should render logo section', () => {
      render(<StoreBrandingForm />);
      expect(screen.getByText('Store Logo')).toBeInTheDocument();
    });

    it('should render save profile button', () => {
      render(<StoreBrandingForm />);
      expect(screen.getByTitle('Save as store profile')).toBeInTheDocument();
    });

    it('should display current store name', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, storeName: 'Tech Paradise' },
      });

      render(<StoreBrandingForm />);

      expect(screen.getByPlaceholderText('Your Store Name')).toHaveValue('Tech Paradise');
    });
  });

  describe('store name input', () => {
    it('should update config when store name changes', async () => {
      const user = userEvent.setup();
      render(<StoreBrandingForm />);

      const nameInput = screen.getByPlaceholderText('Your Store Name');
      await user.clear(nameInput);
      await user.type(nameInput, 'My Computer Shop');

      const { config } = useConfigStore.getState();
      expect(config.storeName).toBe('My Computer Shop');
    });

    it('should handle empty store name', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, storeName: 'Test Store' },
      });

      render(<StoreBrandingForm />);

      const nameInput = screen.getByPlaceholderText('Your Store Name');
      await user.clear(nameInput);

      const { config } = useConfigStore.getState();
      expect(config.storeName).toBe('');
    });
  });

  describe('logo upload', () => {
    it('should show upload button when no logo', () => {
      render(<StoreBrandingForm />);
      expect(screen.getByText('Upload Logo')).toBeInTheDocument();
    });

    it('should show logo preview and remove button when logo exists', () => {
      useConfigStore.setState({
        config: { ...defaultConfig, storeLogo: 'data:image/png;base64,testlogo' },
      });

      render(<StoreBrandingForm />);

      expect(screen.getByAltText('Store logo')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
      expect(screen.queryByText('Upload Logo')).not.toBeInTheDocument();
    });

    it('should remove logo when remove button clicked', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, storeLogo: 'data:image/png;base64,testlogo' },
      });

      render(<StoreBrandingForm />);

      const removeButton = screen.getByText('Remove');
      await user.click(removeButton);

      const { config } = useConfigStore.getState();
      expect(config.storeLogo).toBeNull();
    });

    it('should have hidden file input for logo upload', () => {
      render(<StoreBrandingForm />);

      // Verify file input exists and is hidden
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();
      expect(fileInput).toHaveClass('hidden');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('store profiles', () => {
    it('should not show profiles section when no profiles exist', () => {
      render(<StoreBrandingForm />);
      expect(screen.queryByText('Saved Store Profiles')).not.toBeInTheDocument();
    });

    it('should show profiles section when profiles exist', () => {
      useBrandIconsStore.setState({
        profiles: [
          { id: '1', name: 'Tech Store', logo: null, defaultTheme: 'gaming' },
        ],
        activeProfileId: null,
        brandIcons: [],
      });

      render(<StoreBrandingForm />);

      expect(screen.getByText('Saved Store Profiles')).toBeInTheDocument();
      expect(screen.getByText('Tech Store')).toBeInTheDocument();
    });

    it('should show alert when trying to save profile without store name', async () => {
      const user = userEvent.setup();
      render(<StoreBrandingForm />);

      const saveButton = screen.getByTitle('Save as store profile');
      await user.click(saveButton);

      expect(alertMock).toHaveBeenCalledWith('Please enter a store name first');
    });

    it('should save profile when store name is provided', async () => {
      const user = userEvent.setup();
      useConfigStore.setState({
        config: { ...defaultConfig, storeName: 'My Store' },
      });

      render(<StoreBrandingForm />);

      const saveButton = screen.getByTitle('Save as store profile');
      await user.click(saveButton);

      const { profiles } = useBrandIconsStore.getState();
      expect(profiles.length).toBe(1);
      expect(profiles[0].name).toBe('My Store');
    });

    it('should load profile when profile button clicked', async () => {
      const user = userEvent.setup();
      useBrandIconsStore.setState({
        profiles: [
          { id: '1', name: 'Gaming Store', logo: 'data:image/png;base64,logo', defaultTheme: 'gaming' },
        ],
        activeProfileId: null,
        brandIcons: [],
      });

      render(<StoreBrandingForm />);

      const profileButton = screen.getByText('Gaming Store');
      await user.click(profileButton);

      const { config } = useConfigStore.getState();
      expect(config.storeName).toBe('Gaming Store');
      expect(config.storeLogo).toBe('data:image/png;base64,logo');
      expect(config.colorTheme).toBe('gaming');
    });

    it('should highlight active profile', () => {
      useBrandIconsStore.setState({
        profiles: [
          { id: '1', name: 'Active Store', logo: null, defaultTheme: 'gaming' },
        ],
        activeProfileId: '1',
        brandIcons: [],
      });

      render(<StoreBrandingForm />);

      // The profile button is inside a div with border styling
      const profileButton = screen.getByText('Active Store');
      const profileContainer = profileButton.closest('div[class*="border"]');
      expect(profileContainer).toHaveClass('border-blue-500');
    });

    it('should delete profile when delete button clicked', async () => {
      const user = userEvent.setup();
      useBrandIconsStore.setState({
        profiles: [
          { id: '1', name: 'Delete Me', logo: null, defaultTheme: 'gaming' },
        ],
        activeProfileId: null,
        brandIcons: [],
      });

      render(<StoreBrandingForm />);

      // Find delete button (the X icon button)
      const profileDiv = screen.getByText('Delete Me').closest('div');
      const deleteButton = profileDiv?.querySelector('button:last-child');
      expect(deleteButton).toBeTruthy();

      await user.click(deleteButton!);

      const { profiles } = useBrandIconsStore.getState();
      expect(profiles.length).toBe(0);
    });
  });

  describe('legacy profiles', () => {
    it('should load legacy profiles from localStorage', () => {
      const legacyProfiles = [
        { id: 'legacy1', name: 'Legacy Store', logo: null, defaultTheme: 'minimal' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(legacyProfiles));

      render(<StoreBrandingForm />);

      expect(screen.getByText('Saved Store Profiles')).toBeInTheDocument();
      expect(screen.getByText('Legacy Store')).toBeInTheDocument();
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      // Should not throw
      render(<StoreBrandingForm />);
      expect(screen.queryByText('Saved Store Profiles')).not.toBeInTheDocument();
    });
  });

  describe('history integration', () => {
    it('should add to history when store name changes', async () => {
      const user = userEvent.setup();
      render(<StoreBrandingForm />);

      const nameInput = screen.getByPlaceholderText('Your Store Name');
      await user.type(nameInput, 'A');

      const { canUndo } = useConfigStore.getState();
      expect(canUndo).toBe(true);
    });
  });
});
