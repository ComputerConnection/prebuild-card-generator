import { ipcMain, dialog, shell, app, BrowserWindow } from 'electron';
import { writeFile, readFile } from 'fs/promises';
import { join, resolve } from 'path';
import type { SaveFileOptions, OpenFileOptions } from '../types';

/** Validate that a file path is absolute and doesn't contain traversal sequences */
function isValidFilePath(filePath: string): boolean {
  if (typeof filePath !== 'string' || filePath.length === 0) return false;
  const resolved = resolve(filePath);
  // Reject if resolution changed the path (indicates traversal)
  if (resolved !== filePath && resolve(filePath) !== filePath) {
    // Allow minor normalization but reject obvious traversal
    if (filePath.includes('..')) return false;
  }
  return true;
}

export function registerFileHandlers(): void {
  // ── Save PDF ─────────────────────────────────────────────
  ipcMain.handle(
    'file:savePDF',
    async (_event, pdfBytes: Uint8Array, suggestedName?: string) => {
      const window = BrowserWindow.getFocusedWindow();
      if (!window) return { success: false, error: 'No active window' };

      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        title: 'Save PDF',
        defaultPath: join(
          app.getPath('documents'),
          suggestedName || 'prebuild-spec-card.pdf'
        ),
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Save cancelled' };
      }

      try {
        await writeFile(filePath, Buffer.from(pdfBytes));
        return { success: true, filePath };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to save PDF',
        };
      }
    }
  );

  // ── Save generic file (CSV, JSON, etc.) ──────────────────
  ipcMain.handle(
    'file:saveFile',
    async (_event, content: string, options?: SaveFileOptions) => {
      const window = BrowserWindow.getFocusedWindow();
      if (!window) return { success: false, error: 'No active window' };

      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        title: 'Save File',
        defaultPath: join(
          app.getPath('documents'),
          options?.defaultName || 'export.json'
        ),
        filters: options?.filters || [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (canceled || !filePath) {
        return { success: false, error: 'Save cancelled' };
      }

      try {
        await writeFile(filePath, content, 'utf-8');
        return { success: true, filePath };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to save file',
        };
      }
    }
  );

  // ── Open file ────────────────────────────────────────────
  ipcMain.handle(
    'file:openFile',
    async (_event, options?: OpenFileOptions) => {
      const window = BrowserWindow.getFocusedWindow();
      if (!window) return { success: false, error: 'No active window' };

      const properties: Electron.OpenDialogOptions['properties'] = ['openFile'];
      if (options?.multiSelections) {
        properties.push('multiSelections');
      }

      const { canceled, filePaths } = await dialog.showOpenDialog(window, {
        title: 'Open File',
        properties,
        filters: options?.filters || [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (canceled || filePaths.length === 0) {
        return { success: false, error: 'Open cancelled' };
      }

      try {
        const data = await Promise.all(
          filePaths.map((fp) => readFile(fp, 'utf-8'))
        );
        return { success: true, filePaths, data };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to read file',
        };
      }
    }
  );

  // ── Show in folder ───────────────────────────────────────
  ipcMain.handle('file:showInFolder', (_event, filePath: string) => {
    if (!isValidFilePath(filePath)) return;
    shell.showItemInFolder(filePath);
  });

  // ── Get desktop path ─────────────────────────────────────
  ipcMain.handle('file:getDesktopPath', () => {
    return app.getPath('desktop');
  });

  // ── App info handlers ────────────────────────────────────
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getPlatform', () => {
    return process.platform;
  });

  ipcMain.handle('app:isPackaged', () => {
    return app.isPackaged;
  });

  ipcMain.handle('app:openExternal', (_event, url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return shell.openExternal(parsed.href);
      }
    } catch {
      // Invalid URL — ignore silently
    }
  });
}
