import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './types';

/**
 * Preload script — runs in a sandboxed renderer context.
 * Exposes a typed, minimal API surface via contextBridge.
 * No direct Node.js access is given to the renderer.
 */

const electronAPI: ElectronAPI = {
  // ── Store ──────────────────────────────────────────────────
  store: {
    get: <T>(key: string) => ipcRenderer.invoke('store:get', key) as Promise<T | null>,
    set: <T>(key: string, value: T) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    has: (key: string) => ipcRenderer.invoke('store:has', key),
    keys: () => ipcRenderer.invoke('store:keys'),
    clear: () => ipcRenderer.invoke('store:clear'),
    getAll: () => ipcRenderer.invoke('store:getAll'),
    importData: (data: Record<string, unknown>) => ipcRenderer.invoke('store:importData', data),
  },

  // ── File System ────────────────────────────────────────────
  file: {
    savePDF: (pdfBytes: Uint8Array, suggestedName?: string) =>
      ipcRenderer.invoke('file:savePDF', pdfBytes, suggestedName),
    saveFile: (content: string, options?) => ipcRenderer.invoke('file:saveFile', content, options),
    openFile: (options?) => ipcRenderer.invoke('file:openFile', options),
    showInFolder: (filePath: string) => ipcRenderer.invoke('file:showInFolder', filePath),
    getDesktopPath: () => ipcRenderer.invoke('file:getDesktopPath'),
  },

  // ── Print ──────────────────────────────────────────────────
  print: {
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
    getDefaultPrinter: () => ipcRenderer.invoke('print:getDefaultPrinter'),
    printPDF: (pdfBytes: Uint8Array, options?) =>
      ipcRenderer.invoke('print:printPDF', pdfBytes, options),
    printPreview: (pdfBytes: Uint8Array) => ipcRenderer.invoke('print:printPreview', pdfBytes),
  },

  // ── Email ──────────────────────────────────────────────────
  email: {
    send: (config, message) => ipcRenderer.invoke('email:send', config, message),
    testConnection: (config) => ipcRenderer.invoke('email:testConnection', config),
    getSavedConfig: () => ipcRenderer.invoke('email:getSavedConfig'),
    saveConfig: (config) => ipcRenderer.invoke('email:saveConfig', config),
  },

  // ── Updates ────────────────────────────────────────────────
  update: {
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    onUpdateStatus: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, status: unknown) =>
        callback(status as Parameters<typeof callback>[0]);
      ipcRenderer.on('update:status', handler);
      // Return unsubscribe function
      return () => ipcRenderer.removeListener('update:status', handler);
    },
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },

  // ── App Info ───────────────────────────────────────────────
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
    isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
    openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
  },

  // ── Menu Events ──────────────────────────────────────────
  menu: {
    onAction: (callback) => {
      const channels = [
        'menu:newCard',
        'menu:importPreset',
        'menu:exportPreset',
        'menu:exportPDF',
        'menu:print',
        'menu:undo',
        'menu:redo',
        'menu:cardSize',
        'menu:printQueue',
        'menu:sheetsImport',
        'menu:checkUpdates',
        'menu:about',
      ];
      const handlers: Array<{
        channel: string;
        handler: (_event: Electron.IpcRendererEvent, ...args: unknown[]) => void;
      }> = [];

      for (const channel of channels) {
        const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
          callback(channel, ...args);
        ipcRenderer.on(channel, handler);
        handlers.push({ channel, handler });
      }

      // Return unsubscribe function
      return () => {
        for (const { channel, handler } of handlers) {
          ipcRenderer.removeListener(channel, handler);
        }
      };
    },
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
