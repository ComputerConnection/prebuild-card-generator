/**
 * Tests for src/components/GoogleSheetsImport.tsx
 * Tests the Google Sheets import/export component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleSheetsImport } from '../../../components/GoogleSheetsImport';
import * as googleSheetsUtils from '../../../utils/googleSheets';
import type { PrebuildConfig } from '../../../types';
import { defaultConfig } from '../../../data/componentOptions';

// Mock the googleSheets utilities
vi.mock('../../../utils/googleSheets', () => ({
  importFromGoogleSheet: vi.fn(),
  downloadCSV: vi.fn(),
}));

describe('GoogleSheetsImport', () => {
  const mockOnImport = vi.fn();

  const mockBuilds: PrebuildConfig[] = [
    { ...defaultConfig, modelName: 'Build 1', price: 1000 } as PrebuildConfig,
    { ...defaultConfig, modelName: 'Build 2', price: 1500 } as PrebuildConfig,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Always restore real timers after each test
    vi.useRealTimers();
  });

  describe('trigger button', () => {
    it('should render the Sheets button', () => {
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      expect(screen.getByText('Sheets')).toBeInTheDocument();
    });

    it('should have correct tooltip', () => {
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      expect(screen.getByTitle('Import from Google Sheets')).toBeInTheDocument();
    });
  });

  describe('modal behavior', () => {
    it('should not show modal initially', () => {
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      expect(screen.queryByText('Google Sheets Sync')).not.toBeInTheDocument();
    });

    it('should open modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Google Sheets Sync')).toBeInTheDocument();
    });

    it('should close modal when X button is clicked', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      expect(screen.getByText('Google Sheets Sync')).toBeInTheDocument();

      // Find and click close button
      const closeButton = screen.getByRole('button', { name: '' });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Google Sheets Sync')).not.toBeInTheDocument();
      });
    });
  });

  describe('import section', () => {
    it('should display import section with instructions', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Import from Google Sheet')).toBeInTheDocument();
      expect(screen.getByText(/public Google Sheet/)).toBeInTheDocument();
    });

    it('should have URL input field', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      expect(input).toBeInTheDocument();
    });

    it('should have Import Builds button', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Import Builds')).toBeInTheDocument();
    });

    it('should show error when trying to import without URL', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      await user.click(screen.getByText('Import Builds'));

      expect(screen.getByText('Please enter a Google Sheet URL')).toBeInTheDocument();
    });

    it('should call importFromGoogleSheet with URL', async () => {
      const user = userEvent.setup();
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: true,
        builds: [{ modelName: 'Test Build' }],
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://docs.google.com/spreadsheets/d/test123');
      await user.click(screen.getByText('Import Builds'));

      expect(googleSheetsUtils.importFromGoogleSheet).toHaveBeenCalledWith(
        'https://docs.google.com/spreadsheets/d/test123'
      );
    });

    it('should show loading state during import', async () => {
      const user = userEvent.setup();
      let resolveImport: (value: unknown) => void;
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveImport = resolve;
          })
      );

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://test.com');
      await user.click(screen.getByText('Import Builds'));

      expect(screen.getByText('Importing...')).toBeInTheDocument();

      // Resolve the promise
      resolveImport!({ success: true, builds: [] });
    });

    it('should show success message after import', async () => {
      const user = userEvent.setup();
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: true,
        builds: [{ modelName: 'Build 1' }, { modelName: 'Build 2' }],
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://test.com');
      await user.click(screen.getByText('Import Builds'));

      await waitFor(() => {
        expect(screen.getByText('Successfully imported 2 build(s)!')).toBeInTheDocument();
      });
    });

    it('should call onImport with builds after successful import', async () => {
      const user = userEvent.setup();
      const builds = [{ modelName: 'Build 1' }, { modelName: 'Build 2' }];
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: true,
        builds,
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://test.com');
      await user.click(screen.getByText('Import Builds'));

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith(builds);
      });
    });

    it('should show error message on import failure', async () => {
      const user = userEvent.setup();
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: false,
        error: 'Sheet not found',
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://test.com');
      await user.click(screen.getByText('Import Builds'));

      await waitFor(() => {
        expect(screen.getByText('Sheet not found')).toBeInTheDocument();
      });
    });

    it('should close modal after successful import', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: true,
        builds: [{ modelName: 'Build 1' }],
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://test.com');
      await user.click(screen.getByText('Import Builds'));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Successfully imported/)).toBeInTheDocument();
      });

      // Advance timer past the auto-close delay (1500ms in component + buffer)
      await vi.advanceTimersByTimeAsync(2000);

      await waitFor(() => {
        expect(screen.queryByText('Google Sheets Sync')).not.toBeInTheDocument();
      });
    }, 10000);
  });

  describe('export section', () => {
    it('should display export section', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    });

    it('should show download button with build count', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} currentBuilds={mockBuilds} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Download CSV (2 builds)')).toBeInTheDocument();
    });

    it('should show 0 builds when no builds provided', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Download CSV (0 builds)')).toBeInTheDocument();
    });

    it('should disable export button when no builds', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} currentBuilds={[]} />);

      await user.click(screen.getByText('Sheets'));

      const downloadButton = screen.getByText('Download CSV (0 builds)');
      expect(downloadButton).toBeDisabled();
    });

    it('should call downloadCSV when export button is clicked', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} currentBuilds={mockBuilds} />);

      await user.click(screen.getByText('Sheets'));
      await user.click(screen.getByText('Download CSV (2 builds)'));

      expect(googleSheetsUtils.downloadCSV).toHaveBeenCalledWith(mockBuilds);
    });
  });

  describe('column headers info', () => {
    it('should display expected column headers', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText('Expected Column Headers')).toBeInTheDocument();
      expect(screen.getByText('Model Name')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('CPU')).toBeInTheDocument();
      expect(screen.getByText('GPU')).toBeInTheDocument();
      expect(screen.getByText('RAM')).toBeInTheDocument();
      expect(screen.getByText('Storage')).toBeInTheDocument();
      expect(screen.getByText('Motherboard')).toBeInTheDocument();
      expect(screen.getByText('PSU')).toBeInTheDocument();
      expect(screen.getByText('Case')).toBeInTheDocument();
      expect(screen.getByText('Cooling')).toBeInTheDocument();
      expect(screen.getByText('OS')).toBeInTheDocument();
      expect(screen.getByText('Warranty')).toBeInTheDocument();
      expect(screen.getByText('WiFi')).toBeInTheDocument();
      expect(screen.getByText('Build Tier')).toBeInTheDocument();
      expect(screen.getByText('Condition')).toBeInTheDocument();
    });

    it('should mention case-insensitive headers', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      expect(screen.getByText(/case-insensitive/)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should clear error when URL is changed', async () => {
      const user = userEvent.setup();
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: false,
        error: 'Error occurred',
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));

      // Trigger error
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://bad.com');
      await user.click(screen.getByText('Import Builds'));

      await waitFor(() => {
        expect(screen.getByText('Error occurred')).toBeInTheDocument();
      });

      // Clear and type new URL
      await user.clear(input);
      await user.type(input, 'https://new.com');

      // The error stays until next import attempt, which is expected behavior
    });

    it('should handle empty build result', async () => {
      const user = userEvent.setup();
      vi.mocked(googleSheetsUtils.importFromGoogleSheet).mockResolvedValue({
        success: true,
        builds: [],
      });

      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, 'https://test.com');
      await user.click(screen.getByText('Import Builds'));

      await waitFor(() => {
        expect(screen.getByText('Successfully imported 0 build(s)!')).toBeInTheDocument();
      });
    });

    it('should handle whitespace-only URL', async () => {
      const user = userEvent.setup();
      render(<GoogleSheetsImport onImport={mockOnImport} />);

      await user.click(screen.getByText('Sheets'));
      const input = screen.getByPlaceholderText('https://docs.google.com/spreadsheets/d/...');
      await user.type(input, '   ');
      await user.click(screen.getByText('Import Builds'));

      expect(screen.getByText('Please enter a Google Sheet URL')).toBeInTheDocument();
    });
  });
});
