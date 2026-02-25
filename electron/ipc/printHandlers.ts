import { ipcMain, BrowserWindow, shell } from 'electron';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { PrintOptions } from '../types';

export function registerPrintHandlers(): void {
  // ── Get available printers ───────────────────────────────
  ipcMain.handle('print:getPrinters', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return [];

    const printers = await window.webContents.getPrintersAsync();
    return printers.map((p) => ({
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      options: p.options,
    }));
  });

  // ── Get default printer ──────────────────────────────────
  ipcMain.handle('print:getDefaultPrinter', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const printers = await window.webContents.getPrintersAsync();
    // Electron doesn't expose a dedicated isDefault flag;
    // the first printer returned is typically the system default.
    return printers[0]?.name || null;
  });

  // ── Print PDF ────────────────────────────────────────────
  ipcMain.handle(
    'print:printPDF',
    async (_event, pdfBytes: Uint8Array, options?: PrintOptions) => {
      try {
        // Write PDF to temp file
        const tempPath = join(tmpdir(), `prebuild-print-${Date.now()}.pdf`);
        await writeFile(tempPath, Buffer.from(pdfBytes));

        // Create hidden window to load and print the PDF
        const printWindow = new BrowserWindow({
          show: false,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
          },
        });

        await printWindow.loadFile(tempPath);

        await new Promise<void>((resolve, reject) => {
          printWindow.webContents.print(
            {
              silent: options?.silent ?? false,
              printBackground: true,
              deviceName: options?.printerName || '',
              copies: options?.copies ?? 1,
              landscape: options?.landscape ?? false,
            },
            (success, failureReason) => {
              printWindow.close();
              // Clean up temp file
              unlink(tempPath).catch(() => {});

              if (success) {
                resolve();
              } else {
                reject(new Error(failureReason));
              }
            }
          );
        });

        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Print failed',
        };
      }
    }
  );

  // ── Print preview ────────────────────────────────────────
  ipcMain.handle('print:printPreview', async (_event, pdfBytes: Uint8Array) => {
    try {
      // Write PDF to temp file and open in system viewer
      const tempPath = join(tmpdir(), `prebuild-preview-${Date.now()}.pdf`);
      await writeFile(tempPath, Buffer.from(pdfBytes));

      await shell.openPath(tempPath);

      // Schedule temp file cleanup after 60 seconds
      setTimeout(() => {
        unlink(tempPath).catch(() => {});
      }, 60_000);
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to open print preview'
      );
    }
  });
}
