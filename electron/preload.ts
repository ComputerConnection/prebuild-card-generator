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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
