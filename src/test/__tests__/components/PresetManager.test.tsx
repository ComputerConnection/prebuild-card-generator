/**
 * Tests for PresetManager component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetManager } from '../../../components/PresetManager';
import { defaultConfig } from '../../../data/componentOptions';
import type { PrebuildConfig, Preset } from '../../../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock confirm
const confirmMock = vi.fn(() => true);
global.confirm = confirmMock;

describe('PresetManager', () => {
  const mockConfig: PrebuildConfig = {
    ...defaultConfig,
    modelName: 'Test PC',
    price: 1499,
  };

  const mockOnLoadPreset = vi.fn();
  const mockOnPrintQueue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    confirmMock.mockReturnValue(true);
  });

  describe('rendering', () => {
    it('should render heading', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText('Presets')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByPlaceholderText('Search presets...')).toBeInTheDocument();
    });

    it('should render save preset button', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText('Save Current as Preset')).toBeInTheDocument();
    });

    it('should show empty state when no presets', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
    });

    it('should render folder filter tabs', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText(/All/)).toBeInTheDocument();
    });
  });

  describe('save preset', () => {
    it('should show save input when save button clicked', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Save Current as Preset'));

      expect(screen.getByPlaceholderText('Preset name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not save preset with empty name', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Save Current as Preset'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should save preset with valid name', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Save Current as Preset'));
      await user.type(screen.getByPlaceholderText('Preset name'), 'My Gaming Build');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(screen.getByText('My Gaming Build')).toBeInTheDocument();
    });

    it('should save preset on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Save Current as Preset'));
      const nameInput = screen.getByPlaceholderText('Preset name');
      await user.type(nameInput, 'Enter Build');
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      expect(screen.getByText('Enter Build')).toBeInTheDocument();
    });

    it('should hide save input on cancel', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Save Current as Preset'));
      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByPlaceholderText('Preset name')).not.toBeInTheDocument();
    });

    it('should save preset to selected folder', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Save Current as Preset'));
      await user.type(screen.getByPlaceholderText('Preset name'), 'Foldered Build');

      const folderSelect = screen.getAllByRole('combobox')[0]; // First dropdown is folder
      await user.selectOptions(folderSelect, 'gaming');

      await user.click(screen.getByRole('button', { name: 'Save' }));

      // The preset should be saved with folder
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].folder).toBe('gaming');
    });
  });

  describe('load preset', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Gaming Build',
          config: { ...mockConfig, modelName: 'Gaming PC', price: 2000 },
          createdAt: Date.now(),
        },
      ];
      localStorageMock.getItem.mockImplementation((key: string) => key === 'prebuild-card-presets' ? JSON.stringify(presets) : null);
    });

    it('should display saved presets', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText('Gaming Build')).toBeInTheDocument();
    });

    it('should call onLoadPreset when preset clicked', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      await user.click(screen.getByText('Gaming Build'));

      expect(mockOnLoadPreset).toHaveBeenCalledWith(
        expect.objectContaining({ modelName: 'Gaming PC', price: 2000 })
      );
    });

    it('should display preset price', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText('$2,000.00')).toBeInTheDocument();
    });
  });

  describe('delete preset', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Delete Me', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) => key === 'prebuild-card-presets' ? JSON.stringify(presets) : null);
    });

    it('should show confirm dialog when delete clicked', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      // Find delete button (trash icon)
      const presetItem = screen.getByText('Delete Me').closest('.group');
      const deleteButton = presetItem?.querySelector('button[title="Delete"]');
      expect(deleteButton).toBeTruthy();

      await user.click(deleteButton!);

      expect(confirmMock).toHaveBeenCalledWith('Delete this preset?');
    });

    it('should delete preset when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const presetItem = screen.getByText('Delete Me').closest('.group');
      const deleteButton = presetItem?.querySelector('button[title="Delete"]');
      await user.click(deleteButton!);

      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
    });

    it('should not delete preset when cancelled', async () => {
      confirmMock.mockReturnValue(false);
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const presetItem = screen.getByText('Delete Me').closest('.group');
      const deleteButton = presetItem?.querySelector('button[title="Delete"]');
      await user.click(deleteButton!);

      expect(screen.getByText('Delete Me')).toBeInTheDocument();
    });
  });

  describe('duplicate preset', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Original', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) => key === 'prebuild-card-presets' ? JSON.stringify(presets) : null);
    });

    it('should duplicate preset', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const presetItem = screen.getByText('Original').closest('.group');
      const duplicateButton = presetItem?.querySelector('button[title="Duplicate"]');
      expect(duplicateButton).toBeTruthy();

      await user.click(duplicateButton!);

      expect(screen.getByText('Original (Copy)')).toBeInTheDocument();
    });
  });

  describe('search', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Gaming Build', config: { ...mockConfig, modelName: 'Gaming PC' }, createdAt: Date.now() },
        { id: '2', name: 'Work Build', config: { ...mockConfig, modelName: 'Workstation' }, createdAt: Date.now() },
        { id: '3', name: 'Budget Build', config: { ...mockConfig, modelName: 'Budget PC' }, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) => key === 'prebuild-card-presets' ? JSON.stringify(presets) : null);
    });

    it('should filter presets by name', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search presets...');
      await user.type(searchInput, 'Gaming');

      expect(screen.getByText('Gaming Build')).toBeInTheDocument();
      expect(screen.queryByText('Work Build')).not.toBeInTheDocument();
      expect(screen.queryByText('Budget Build')).not.toBeInTheDocument();
    });

    it('should filter presets by model name', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search presets...');
      await user.type(searchInput, 'Workstation');

      expect(screen.queryByText('Gaming Build')).not.toBeInTheDocument();
      expect(screen.getByText('Work Build')).toBeInTheDocument();
      expect(screen.queryByText('Budget Build')).not.toBeInTheDocument();
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search presets...');
      await user.type(searchInput, 'xyz');

      expect(screen.getByText('No presets match your search')).toBeInTheDocument();
    });
  });

  describe('folder filtering', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Gaming Preset', config: mockConfig, createdAt: Date.now(), folder: 'gaming' },
        { id: '2', name: 'Work Preset', config: mockConfig, createdAt: Date.now(), folder: 'workstation' },
        { id: '3', name: 'No Folder', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) => key === 'prebuild-card-presets' ? JSON.stringify(presets) : null);
    });

    it('should show all presets when All tab selected', () => {
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      expect(screen.getByText('Gaming Preset')).toBeInTheDocument();
      expect(screen.getByText('Work Preset')).toBeInTheDocument();
      expect(screen.getByText('No Folder')).toBeInTheDocument();
    });

    it('should filter by folder when folder tab clicked', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      // Find the Gaming folder tab by looking for "Gaming (1)" pattern
      const gamingTab = screen.getByText(/Gaming \(1\)/);
      await user.click(gamingTab);

      expect(screen.getByText('Gaming Preset')).toBeInTheDocument();
      expect(screen.queryByText('Work Preset')).not.toBeInTheDocument();
      expect(screen.queryByText('No Folder')).not.toBeInTheDocument();
    });
  });

  describe('move to folder', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Move Me', config: mockConfig, createdAt: Date.now() },
      ];
      // Use mockImplementation to return correct data for each key
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'prebuild-card-presets') {
          return JSON.stringify(presets);
        }
        return null;
      });
    });

    it('should move preset to folder', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      // Use getAllByText since preset name appears in button and may appear elsewhere
      const presetButtons = screen.getAllByText('Move Me');
      const presetItem = presetButtons[0].closest('.group');
      const folderSelect = presetItem?.querySelector('select');
      expect(folderSelect).toBeTruthy();

      await user.selectOptions(folderSelect!, 'gaming');

      // Verify localStorage was updated with folder
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData[0].folder).toBe('gaming');
    });
  });

  describe('print queue', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Print 1', config: mockConfig, createdAt: Date.now() },
        { id: '2', name: 'Print 2', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) => key === 'prebuild-card-presets' ? JSON.stringify(presets) : null);
    });

    it('should show print button when presets selected', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
          onPrintQueue={mockOnPrintQueue}
        />
      );

      // Find and click the checkbox for the first preset
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(screen.getByText('Print 1 selected')).toBeInTheDocument();
    });

    it('should call onPrintQueue with selected presets', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
          onPrintQueue={mockOnPrintQueue}
        />
      );

      // Select both presets
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      await user.click(screen.getByText('Print 2 selected'));

      expect(mockOnPrintQueue).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Print 1' }),
          expect.objectContaining({ name: 'Print 2' }),
        ])
      );
    });

    it('should not show print button when no onPrintQueue prop', async () => {
      const user = userEvent.setup();
      render(
        <PresetManager
          currentConfig={mockConfig}
          onLoadPreset={mockOnLoadPreset}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(screen.queryByText(/Print.*selected/)).not.toBeInTheDocument();
    });
  });
});
