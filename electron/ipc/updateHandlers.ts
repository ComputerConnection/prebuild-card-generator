import { ipcMain, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';

let mainWindowRef: BrowserWindow | null = null;

/**
 * Initialize the auto-updater with a reference to the main window.
 * Only call this in production (app.isPackaged).
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow;

  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Forward update events to renderer
  autoUpdater.on('checking-for-update', () => {
    sendStatus({ type: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendStatus({
      type: 'available',
      info: {
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
        releaseDate: info.releaseDate,
      },
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendStatus({ type: 'not-available' });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendStatus({
      type: 'downloading',
      progress: {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        total: progress.total,
        transferred: progress.transferred,
      },
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendStatus({
      type: 'downloaded',
      info: {
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
        releaseDate: info.releaseDate,
      },
    });
  });

  autoUpdater.on('error', (err) => {
    sendStatus({
      type: 'error',
      error: err.message,
    });
  });

  // Check for updates 5 seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

function sendStatus(status: unknown): void {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('update:status', status);
  }
}

export function registerUpdateHandlers(): void {
  ipcMain.handle('update:check', async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.handle('update:download', async () => {
    await autoUpdater.downloadUpdate();
  });

  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}
