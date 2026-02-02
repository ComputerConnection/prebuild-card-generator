/**
 * Development logger utility
 * Logs messages only in development mode to aid debugging without polluting production
 */

import { env } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: unknown;
  timestamp: Date;
}

// Store recent log entries for debugging (circular buffer)
const LOG_BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];

function addToBuffer(entry: LogEntry): void {
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

function formatMessage(context: string, message: string): string {
  return `[${context}] ${message}`;
}

/**
 * Logger that only outputs in development mode
 */
export const logger = {
  debug(context: string, message: string, data?: unknown): void {
    const entry: LogEntry = { level: 'debug', context, message, data, timestamp: new Date() };
    addToBuffer(entry);
    if (env.isDev) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage(context, message), data ?? '');
    }
  },

  info(context: string, message: string, data?: unknown): void {
    const entry: LogEntry = { level: 'info', context, message, data, timestamp: new Date() };
    addToBuffer(entry);
    if (env.isDev) {
      // eslint-disable-next-line no-console
      console.info(formatMessage(context, message), data ?? '');
    }
  },

  warn(context: string, message: string, data?: unknown): void {
    const entry: LogEntry = { level: 'warn', context, message, data, timestamp: new Date() };
    addToBuffer(entry);
    if (env.isDev) {
      console.warn(formatMessage(context, message), data ?? '');
    }
  },

  error(context: string, message: string, error?: unknown): void {
    const entry: LogEntry = {
      level: 'error',
      context,
      message,
      data: error,
      timestamp: new Date(),
    };
    addToBuffer(entry);
    if (env.isDev) {
      console.error(formatMessage(context, message), error ?? '');
    }
  },

  /**
   * Get recent log entries (useful for debugging or displaying to user)
   */
  getRecentLogs(count: number = 20): LogEntry[] {
    return logBuffer.slice(-count);
  },

  /**
   * Get recent errors only
   */
  getRecentErrors(count: number = 10): LogEntry[] {
    return logBuffer.filter((e) => e.level === 'error').slice(-count);
  },

  /**
   * Clear the log buffer
   */
  clearLogs(): void {
    logBuffer.length = 0;
  },
};

/**
 * Result type for operations that can partially fail
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * PDF generation result tracking
 */
export interface PDFGenerationWarnings {
  missingLogo: boolean;
  missingProductImage: boolean;
  qrCodeFailed: boolean;
  barcodeFailed: boolean;
  brandIconsFailed: string[];
}

export function createEmptyWarnings(): PDFGenerationWarnings {
  return {
    missingLogo: false,
    missingProductImage: false,
    qrCodeFailed: false,
    barcodeFailed: false,
    brandIconsFailed: [],
  };
}

export function hasWarnings(warnings: PDFGenerationWarnings): boolean {
  return (
    warnings.missingLogo ||
    warnings.missingProductImage ||
    warnings.qrCodeFailed ||
    warnings.barcodeFailed ||
    warnings.brandIconsFailed.length > 0
  );
}

export function formatWarnings(warnings: PDFGenerationWarnings): string[] {
  const messages: string[] = [];
  if (warnings.missingLogo) messages.push('Store logo failed to load');
  if (warnings.missingProductImage) messages.push('Product image failed to load');
  if (warnings.qrCodeFailed) messages.push('QR code generation failed');
  if (warnings.barcodeFailed) messages.push('Barcode generation failed');
  if (warnings.brandIconsFailed.length > 0) {
    messages.push(`Brand icons failed: ${warnings.brandIconsFailed.join(', ')}`);
  }
  return messages;
}

export default logger;
