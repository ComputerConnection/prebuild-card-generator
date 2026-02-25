/**
 * Tests for PresetManager component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetManager } from '../../../components/PresetManager';
import { defaultConfig } from '../../../data/componentOptions';
import { formatPrice } from '../../../types';
import type { PrebuildConfig, Preset } from '../../../types';

// Mock localStorage — store is module-level so beforeEach can reset implementations
let mockStore: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStore[key];
  }),
  clear: vi.fn(() => {
    mockStore = {};
  }),
};
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
    mockStore = {};
    // Restore default implementations (quota tests override setItem to throw)
    localStorageMock.getItem.mockImplementation((key: string) => mockStore[key] || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      mockStore[key] = value;
    });
    localStorageMock.removeItem.mockImplementation((key: string) => {
      delete mockStore[key];
    });
    localStorageMock.clear.mockImplementation(() => {
      mockStore = {};
    });
    confirmMock.mockReturnValue(true);
  });

  describe('rendering', () => {
    it('should render heading', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Presets')).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByPlaceholderText('Search presets...')).toBeInTheDocument();
    });

    it('should render save preset button', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Save Current as Preset')).toBeInTheDocument();
    });

    it('should show empty state when no presets', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
    });

    it('should render folder filter tabs', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText(/All/)).toBeInTheDocument();
    });
  });

  describe('save preset', () => {
    it('should show save input when save button clicked', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));

      expect(screen.getByPlaceholderText('Preset name')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should not save preset with empty name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));

      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toBeDisabled();
    });

    it('should save preset with valid name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));
      await user.type(screen.getByPlaceholderText('Preset name'), 'My Gaming Build');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(screen.getByText('My Gaming Build')).toBeInTheDocument();
    });

    it('should save preset on Enter key', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));
      const nameInput = screen.getByPlaceholderText('Preset name');
      await user.type(nameInput, 'Enter Build');
      fireEvent.keyDown(nameInput, { key: 'Enter' });

      expect(screen.getByText('Enter Build')).toBeInTheDocument();
    });

    it('should hide save input on cancel', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));
      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByPlaceholderText('Preset name')).not.toBeInTheDocument();
    });

    it('should save preset to selected folder', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

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
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
    });

    it('should display saved presets', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Gaming Build')).toBeInTheDocument();
    });

    it('should call onLoadPreset when preset clicked', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Gaming Build'));

      expect(mockOnLoadPreset).toHaveBeenCalledWith(
        expect.objectContaining({ modelName: 'Gaming PC', price: 2000 })
      );
    });

    it('should display preset price', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const expectedPrice = formatPrice(2000);
      expect(screen.getByText(expectedPrice)).toBeInTheDocument();
    });
  });

  describe('delete preset', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Delete Me', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
    });

    it('should show confirm dialog when delete clicked', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Find delete button (trash icon)
      const presetItem = screen.getByText('Delete Me').closest('.group');
      const deleteButton = presetItem?.querySelector('button[title="Delete"]');
      expect(deleteButton).toBeTruthy();

      await user.click(deleteButton!);

      expect(confirmMock).toHaveBeenCalledWith('Delete this preset?');
    });

    it('should delete preset when confirmed', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const presetItem = screen.getByText('Delete Me').closest('.group');
      const deleteButton = presetItem?.querySelector('button[title="Delete"]');
      await user.click(deleteButton!);

      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument();
      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
    });

    it('should not delete preset when cancelled', async () => {
      confirmMock.mockReturnValue(false);
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

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
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
    });

    it('should duplicate preset', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

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
        {
          id: '1',
          name: 'Gaming Build',
          config: { ...mockConfig, modelName: 'Gaming PC' },
          createdAt: Date.now(),
        },
        {
          id: '2',
          name: 'Work Build',
          config: { ...mockConfig, modelName: 'Workstation' },
          createdAt: Date.now(),
        },
        {
          id: '3',
          name: 'Budget Build',
          config: { ...mockConfig, modelName: 'Budget PC' },
          createdAt: Date.now(),
        },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
    });

    it('should filter presets by name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const searchInput = screen.getByPlaceholderText('Search presets...');
      await user.type(searchInput, 'Gaming');

      expect(screen.getByText('Gaming Build')).toBeInTheDocument();
      expect(screen.queryByText('Work Build')).not.toBeInTheDocument();
      expect(screen.queryByText('Budget Build')).not.toBeInTheDocument();
    });

    it('should filter presets by model name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const searchInput = screen.getByPlaceholderText('Search presets...');
      await user.type(searchInput, 'Workstation');

      expect(screen.queryByText('Gaming Build')).not.toBeInTheDocument();
      expect(screen.getByText('Work Build')).toBeInTheDocument();
      expect(screen.queryByText('Budget Build')).not.toBeInTheDocument();
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const searchInput = screen.getByPlaceholderText('Search presets...');
      await user.type(searchInput, 'xyz');

      expect(screen.getByText('No presets match your search')).toBeInTheDocument();
    });
  });

  describe('folder filtering', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Gaming Preset',
          config: mockConfig,
          createdAt: Date.now(),
          folder: 'gaming',
        },
        {
          id: '2',
          name: 'Work Preset',
          config: mockConfig,
          createdAt: Date.now(),
          folder: 'workstation',
        },
        { id: '3', name: 'No Folder', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
    });

    it('should show all presets when All tab selected', () => {
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Gaming Preset')).toBeInTheDocument();
      expect(screen.getByText('Work Preset')).toBeInTheDocument();
      expect(screen.getByText('No Folder')).toBeInTheDocument();
    });

    it('should filter by folder when folder tab clicked', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

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
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

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
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
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
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      expect(screen.queryByText(/Print.*selected/)).not.toBeInTheDocument();
    });
  });

  describe('localStorage quota exceeded', () => {
    it('should gracefully handle quota exceeded error when saving preset', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));
      await user.type(screen.getByPlaceholderText('Preset name'), 'Overflow Build');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      // setItem was called (the component attempted to persist)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prebuild-card-presets',
        expect.any(String)
      );
      // The error was caught and logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save presets (storage quota may be exceeded)'
      );
      // The component still renders without crashing; the preset appears in-memory
      expect(screen.getByText('Overflow Build')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should gracefully handle quota exceeded error when duplicating preset', async () => {
      const presets: Preset[] = [
        { id: '1', name: 'Dup Target', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Make setItem throw on the next call (the duplicate save)
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const presetItem = screen.getByText('Dup Target').closest('.group');
      const duplicateButton = presetItem?.querySelector('button[title="Duplicate"]');
      expect(duplicateButton).toBeTruthy();
      await user.click(duplicateButton!);

      // The error was caught and logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save presets (storage quota may be exceeded)'
      );
      // The duplicate still appears in the in-memory state
      expect(screen.getByText('Dup Target (Copy)')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should gracefully handle quota exceeded error when deleting preset', async () => {
      const presets: Preset[] = [
        { id: '1', name: 'Quota Delete', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Make setItem throw when saving the updated (post-delete) list
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const presetItem = screen.getByText('Quota Delete').closest('.group');
      const deleteButton = presetItem?.querySelector('button[title="Delete"]');
      await user.click(deleteButton!);

      // The error was caught and logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save presets (storage quota may be exceeded)'
      );
      // The preset was removed from in-memory state even though persistence failed
      expect(screen.queryByText('Quota Delete')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should gracefully handle quota exceeded error when moving to folder', async () => {
      const presets: Preset[] = [
        { id: '1', name: 'Move Quota', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Set up quota error before the move action
      localStorageMock.setItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const presetButtons = screen.getAllByText('Move Quota');
      const presetItem = presetButtons[0].closest('.group');
      const folderSelect = presetItem?.querySelector('select');
      expect(folderSelect).toBeTruthy();

      await user.selectOptions(folderSelect!, 'gaming');

      // The error was caught and logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save presets (storage quota may be exceeded)'
      );
      // The component still renders without crashing
      expect(screen.getByText('Presets')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('name collision', () => {
    beforeEach(() => {
      const presets: Preset[] = [
        { id: '1', name: 'Existing Build', config: mockConfig, createdAt: Date.now() },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );
    });

    it('should allow saving a preset with a duplicate name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Verify existing preset is shown
      expect(screen.getByText('Existing Build')).toBeInTheDocument();

      // Save another preset with the exact same name
      await user.click(screen.getByText('Save Current as Preset'));
      await user.type(screen.getByPlaceholderText('Preset name'), 'Existing Build');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Both presets with the same name should now be present
      const matches = screen.getAllByText('Existing Build');
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('should save both presets with unique ids despite same name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      await user.click(screen.getByText('Save Current as Preset'));
      await user.type(screen.getByPlaceholderText('Preset name'), 'Existing Build');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      // Verify the saved data contains two presets with different ids
      const savedData: Preset[] = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      const ids = savedData.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(savedData.filter((p) => p.name === 'Existing Build').length).toBe(2);
    });

    it('should duplicate a preset and produce a "(Copy)" suffix name', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const presetItem = screen.getByText('Existing Build').closest('.group');
      const duplicateButton = presetItem?.querySelector('button[title="Duplicate"]');
      await user.click(duplicateButton!);

      expect(screen.getByText('Existing Build (Copy)')).toBeInTheDocument();
    });

    it('should duplicate an already-duplicated preset', async () => {
      const user = userEvent.setup();
      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Duplicate first
      const presetItem = screen.getByText('Existing Build').closest('.group');
      const duplicateButton = presetItem?.querySelector('button[title="Duplicate"]');
      await user.click(duplicateButton!);

      // Now duplicate the copy
      const copyItem = screen.getByText('Existing Build (Copy)').closest('.group');
      const duplicateCopyButton = copyItem?.querySelector('button[title="Duplicate"]');
      await user.click(duplicateCopyButton!);

      expect(screen.getByText('Existing Build (Copy) (Copy)')).toBeInTheDocument();
    });
  });

  describe('corrupted data', () => {
    it('should handle invalid JSON in presets localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'prebuild-card-presets') return '{not valid json!!!';
        return null;
      });

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Should still render the component without crashing
      expect(screen.getByText('Presets')).toBeInTheDocument();
      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load presets');

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in folders localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'prebuild-card-presets') return '[]';
        if (key === 'prebuild-card-preset-folders') return '<<corrupted>>';
        return null;
      });

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Should still render the component with default folders
      expect(screen.getByText('Presets')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load folders');

      consoleSpy.mockRestore();
    });

    it('should handle null returned from localStorage for presets', () => {
      localStorageMock.getItem.mockImplementation(() => null);

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Presets')).toBeInTheDocument();
      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
    });

    it('should handle empty string from localStorage for presets', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'prebuild-card-presets') return '';
        return null;
      });

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      // Empty string is falsy so it should show empty state
      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle presets with missing fields gracefully', () => {
      // Presets with minimal/missing optional fields should still render
      const corruptedPresets = [
        {
          id: '1',
          name: 'Partial Preset',
          config: { ...mockConfig, price: 0 },
          createdAt: Date.now(),
          // folder is missing - that's fine, it's optional
        },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(corruptedPresets) : null
      );

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Partial Preset')).toBeInTheDocument();
    });

    it('should handle preset with zero price without showing price label', () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Free Build',
          config: { ...mockConfig, price: 0 },
          createdAt: Date.now(),
        },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Free Build')).toBeInTheDocument();
      // Price of 0 should not display a price span (component checks price > 0)
      expect(screen.queryByText(formatPrice(0))).not.toBeInTheDocument();
    });

    it('should handle both presets and folders corrupted simultaneously', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'prebuild-card-presets') return '{{bad';
        if (key === 'prebuild-card-preset-folders') return '{{bad';
        return null;
      });

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      expect(screen.getByText('Presets')).toBeInTheDocument();
      expect(screen.getByText('No saved presets yet')).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load presets');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to load folders');

      consoleSpy.mockRestore();
    });
  });

  describe('dynamic price formatting', () => {
    it('should display formatted price using formatPrice for various values', () => {
      const testPrices = [999, 1499.99, 2500, 49.5];

      testPrices.forEach((price) => {
        const presets: Preset[] = [
          {
            id: '1',
            name: `Build-${price}`,
            config: { ...mockConfig, price },
            createdAt: Date.now(),
          },
        ];
        localStorageMock.getItem.mockImplementation((key: string) =>
          key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
        );

        const { unmount } = render(
          <PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />
        );

        const expectedFormatted = formatPrice(price);
        expect(screen.getByText(expectedFormatted)).toBeInTheDocument();

        unmount();
        localStorageMock.getItem.mockReset();
      });
    });

    it('should show price in preset title attribute using formatPrice', () => {
      const price = 1750;
      const presets: Preset[] = [
        {
          id: '1',
          name: 'Titled Build',
          config: { ...mockConfig, price },
          createdAt: Date.now(),
        },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const expectedFormatted = formatPrice(price);
      const button = screen.getByTitle(`Titled Build - ${expectedFormatted}`);
      expect(button).toBeInTheDocument();
    });

    it('should show "No price" in title attribute when price is 0', () => {
      const presets: Preset[] = [
        {
          id: '1',
          name: 'No Price Build',
          config: { ...mockConfig, price: 0 },
          createdAt: Date.now(),
        },
      ];
      localStorageMock.getItem.mockImplementation((key: string) =>
        key === 'prebuild-card-presets' ? JSON.stringify(presets) : null
      );

      render(<PresetManager currentConfig={mockConfig} onLoadPreset={mockOnLoadPreset} />);

      const button = screen.getByTitle('No Price Build - No price');
      expect(button).toBeInTheDocument();
    });
  });
});
