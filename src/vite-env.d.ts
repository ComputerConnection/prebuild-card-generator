/// <reference types="vite/client" />

// Re-export the Electron API type augmentation for Window
// This allows the renderer to know about window.electronAPI
import type { ElectronAPI } from '../electron/types';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
