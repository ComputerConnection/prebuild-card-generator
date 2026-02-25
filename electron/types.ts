/**
 * Shared type definitions for Electron IPC communication.
 * Used by both main process and renderer (via preload).
 */

// ============================================================================
// Store IPC
// ============================================================================

export interface StoreAPI {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  getAll: () => Promise<Record<string, unknown>>;
  importData: (data: Record<string, unknown>) => Promise<void>;
}

// ============================================================================
// File IPC
// ============================================================================

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface SaveFileOptions {
  defaultName?: string;
  filters?: FileFilter[];
}

export interface OpenFileOptions {
  filters?: FileFilter[];
  multiSelections?: boolean;
}

export interface SaveFileResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface OpenFileResult {
  success: boolean;
  filePaths?: string[];
  data?: string[];
  error?: string;
}

export interface FileAPI {
  savePDF: (pdfBytes: Uint8Array, suggestedName?: string) => Promise<SaveFileResult>;
  saveFile: (content: string, options?: SaveFileOptions) => Promise<SaveFileResult>;
  openFile: (options?: OpenFileOptions) => Promise<OpenFileResult>;
  showInFolder: (filePath: string) => Promise<void>;
  getDesktopPath: () => Promise<string>;
}

// ============================================================================
// Print IPC
// ============================================================================

export interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  status: number;
}

export interface PrintOptions {
  printerName?: string;
  copies?: number;
  silent?: boolean;
  landscape?: boolean;
  paperSize?: 'A4' | 'Letter' | 'Legal';
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

export interface PrintAPI {
  getPrinters: () => Promise<PrinterInfo[]>;
  getDefaultPrinter: () => Promise<string | null>;
  printPDF: (pdfBytes: Uint8Array, options?: PrintOptions) => Promise<PrintResult>;
  printPreview: (pdfBytes: Uint8Array) => Promise<void>;
}

// ============================================================================
// Email IPC
// ============================================================================

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    contentType: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAPI {
  send: (config: SmtpConfig, message: EmailMessage) => Promise<EmailResult>;
  testConnection: (config: SmtpConfig) => Promise<EmailResult>;
  getSavedConfig: () => Promise<SmtpConfig | null>;
  saveConfig: (config: SmtpConfig) => Promise<void>;
}

// ============================================================================
// Update IPC
// ============================================================================

export interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

export type UpdateStatus =
  | { type: 'checking' }
  | { type: 'available'; info: UpdateInfo }
  | { type: 'not-available' }
  | { type: 'downloading'; progress: UpdateProgress }
  | { type: 'downloaded'; info: UpdateInfo }
  | { type: 'error'; error: string };

export interface UpdateAPI {
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void;
  getVersion: () => Promise<string>;
}

// ============================================================================
// App IPC
// ============================================================================

export interface AppAPI {
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  isPackaged: () => Promise<boolean>;
  openExternal: (url: string) => Promise<void>;
}

// ============================================================================
// Combined API exposed to renderer
// ============================================================================

export interface ElectronAPI {
  store: StoreAPI;
  file: FileAPI;
  print: PrintAPI;
  email: EmailAPI;
  update: UpdateAPI;
  app: AppAPI;
}

// Augment the Window interface for TypeScript
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
