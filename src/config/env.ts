/**
 * Environment configuration with type safety and defaults
 * All environment variables are prefixed with VITE_ for Vite compatibility
 */

interface EnvConfig {
  // Google Sheets
  googleSheetsApiKey: string;

  // Email Service
  emailServiceUrl: string;
  emailFromAddress: string;

  // Application
  appName: string;
  maxHistorySize: number;
  defaultCardSize: 'shelf' | 'price' | 'poster';

  // Storage
  storagePrefix: string;
  storageVersion: number;

  // Feature Flags
  enablePwa: boolean;
  enableAnalytics: boolean;

  // Environment
  isDev: boolean;
  isProd: boolean;
  mode: string;
}

function getEnvString(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] ?? defaultValue;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = import.meta.env[key];
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
}

function getCardSize(
  key: string,
  defaultValue: 'shelf' | 'price' | 'poster'
): 'shelf' | 'price' | 'poster' {
  const value = import.meta.env[key];
  if (value === 'shelf' || value === 'price' || value === 'poster') {
    return value;
  }
  return defaultValue;
}

export const env: EnvConfig = {
  // Google Sheets
  googleSheetsApiKey: getEnvString('VITE_GOOGLE_SHEETS_API_KEY'),

  // Email Service
  emailServiceUrl: getEnvString('VITE_EMAIL_SERVICE_URL'),
  emailFromAddress: getEnvString('VITE_EMAIL_FROM_ADDRESS', 'noreply@example.com'),

  // Application
  appName: getEnvString('VITE_APP_NAME', 'PC Prebuild Spec Card Generator'),
  maxHistorySize: getEnvNumber('VITE_MAX_HISTORY_SIZE', 50),
  defaultCardSize: getCardSize('VITE_DEFAULT_CARD_SIZE', 'price'),

  // Storage
  storagePrefix: getEnvString('VITE_STORAGE_PREFIX', 'prebuild-card-generator'),
  storageVersion: getEnvNumber('VITE_STORAGE_VERSION', 1),

  // Feature Flags
  enablePwa: getEnvBoolean('VITE_ENABLE_PWA', true),
  enableAnalytics: getEnvBoolean('VITE_ENABLE_ANALYTICS', false),

  // Environment
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
};

// Storage keys with prefix
export const storageKeys = {
  config: `${env.storagePrefix}-config`,
  presets: `${env.storagePrefix}-presets`,
  presetFolders: `${env.storagePrefix}-preset-folders`,
  brandIcons: `${env.storagePrefix}-brand-icons`,
  storeProfiles: `${env.storagePrefix}-store-profiles`,
  componentLibrary: `${env.storagePrefix}-component-library`,
  uiState: `${env.storagePrefix}-ui-state`,
} as const;

export default env;
