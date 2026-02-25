import { app, Menu, shell, BrowserWindow } from 'electron';

const isMac = process.platform === 'darwin';

export function createApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // ── App menu (macOS only) ────────────────────────────────
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // ── File ─────────────────────────────────────────────────
    {
      label: 'File',
      submenu: [
        {
          label: 'New Card',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendToRenderer('menu:newCard'),
        },
        { type: 'separator' },
        {
          label: 'Import Preset...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendToRenderer('menu:importPreset'),
        },
        {
          label: 'Export Preset...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendToRenderer('menu:exportPreset'),
        },
        { type: 'separator' },
        {
          label: 'Export PDF',
          accelerator: 'CmdOrCtrl+E',
          click: () => sendToRenderer('menu:exportPDF'),
        },
        {
          label: 'Print...',
          accelerator: 'CmdOrCtrl+P',
          click: () => sendToRenderer('menu:print'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // ── Edit ─────────────────────────────────────────────────
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => sendToRenderer('menu:undo'),
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => sendToRenderer('menu:redo'),
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // ── View ─────────────────────────────────────────────────
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(process.env.VITE_DEV_SERVER_URL
          ? [
              { type: 'separator' as const },
              { role: 'reload' as const },
              { role: 'forceReload' as const },
              { role: 'toggleDevTools' as const },
            ]
          : []),
      ],
    },

    // ── Cards ────────────────────────────────────────────────
    {
      label: 'Cards',
      submenu: [
        {
          label: 'Shelf Tag Size',
          click: () => sendToRenderer('menu:cardSize', 'shelf'),
        },
        {
          label: 'Price Card Size',
          click: () => sendToRenderer('menu:cardSize', 'price'),
        },
        {
          label: 'Poster Size',
          click: () => sendToRenderer('menu:cardSize', 'poster'),
        },
        { type: 'separator' },
        {
          label: 'Print Queue',
          accelerator: 'CmdOrCtrl+Q',
          click: () => sendToRenderer('menu:printQueue'),
        },
        {
          label: 'Google Sheets Import',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => sendToRenderer('menu:sheetsImport'),
        },
      ],
    },

    // ── Window ───────────────────────────────────────────────
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac
          ? [{ type: 'separator' as const }, { role: 'front' as const }]
          : [{ role: 'close' as const }]),
      ],
    },

    // ── Help ─────────────────────────────────────────────────
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: () => sendToRenderer('menu:checkUpdates'),
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () =>
            shell.openExternal(
              'https://github.com/ComputerConnection/prebuild-card-generator/issues'
            ),
        },
        {
          label: 'About',
          click: () => sendToRenderer('menu:about'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Send a menu action to the focused renderer window.
 */
function sendToRenderer(channel: string, ...args: unknown[]): void {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send(channel, ...args);
  }
}
