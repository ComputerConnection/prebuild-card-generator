import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { registerStoreHandlers } from './ipc/storeHandlers';
import { registerFileHandlers } from './ipc/fileHandlers';
import { registerPrintHandlers } from './ipc/printHandlers';
import { registerEmailHandlers } from './ipc/emailHandlers';
import { registerUpdateHandlers, initAutoUpdater } from './ipc/updateHandlers';
import { createApplicationMenu } from './menu';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// electron-squirrel-startup is only present when using Squirrel installer.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch {
  // Not using Squirrel installer — no action needed
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'PC Prebuild Spec Card Generator',
    icon: join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
    show: false, // Show when ready to prevent visual flash
  });

  // Show window when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Handle external links — open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    // Development: load from Vite dev server
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: load from built files
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Register all IPC handlers
function registerIpcHandlers(): void {
  registerStoreHandlers();
  registerFileHandlers();
  registerPrintHandlers();
  registerEmailHandlers();
  registerUpdateHandlers();
}

// App lifecycle
app.whenReady().then(() => {
  registerIpcHandlers();
  createApplicationMenu();
  createWindow();

  // Initialize auto-updater after window is created (production only)
  if (app.isPackaged && mainWindow) {
    initAutoUpdater(mainWindow);
  }

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    // Allow navigation to dev server in development
    if (process.env.VITE_DEV_SERVER_URL && url.startsWith(process.env.VITE_DEV_SERVER_URL)) {
      return;
    }
    event.preventDefault();
  });
});
