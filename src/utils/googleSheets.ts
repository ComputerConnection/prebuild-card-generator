import { PrebuildConfig, ComponentCategory } from '../types';
import { defaultConfig, defaultComponentPrices } from '../data/componentOptions';

// Extract Google Sheet ID from various URL formats
export function extractSheetId(url: string): string | null {
  // Handle various Google Sheets URL formats
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Build the public CSV export URL for a Google Sheet
export function buildSheetCsvUrl(sheetId: string, gid: string = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// Parse CSV text into rows
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++;
      } else {
        currentCell += char;
      }
    }
  }

  // Handle last row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Map header names to config fields
const HEADER_MAP: Record<string, string> = {
  'model': 'modelName',
  'modelname': 'modelName',
  'model name': 'modelName',
  'name': 'modelName',
  'price': 'price',
  'sku': 'sku',
  'cpu': 'cpu',
  'processor': 'cpu',
  'gpu': 'gpu',
  'graphics': 'gpu',
  'graphics card': 'gpu',
  'video card': 'gpu',
  'ram': 'ram',
  'memory': 'ram',
  'storage': 'storage',
  'drive': 'storage',
  'ssd': 'storage',
  'motherboard': 'motherboard',
  'mobo': 'motherboard',
  'psu': 'psu',
  'power supply': 'psu',
  'case': 'case',
  'chassis': 'case',
  'cooling': 'cooling',
  'cooler': 'cooling',
  'cpu cooler': 'cooling',
  'os': 'os',
  'operating system': 'os',
  'warranty': 'warranty',
  'wifi': 'wifi',
  'connectivity': 'wifi',
  'network': 'wifi',
  'tier': 'buildTier',
  'build tier': 'buildTier',
  'buildtier': 'buildTier',
  'category': 'buildTier',
  'description': 'description',
  'desc': 'description',
  'condition': 'condition',
  'stock': 'stockStatus',
  'stock status': 'stockStatus',
  'quantity': 'stockQuantity',
  'qty': 'stockQuantity',
};

// Component fields
const COMPONENT_FIELDS = ['cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'case', 'cooling'];

// Parse rows into PrebuildConfig objects
export function parseSheetData(rows: string[][]): Partial<PrebuildConfig>[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const builds: Partial<PrebuildConfig>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some(cell => cell)) continue;

    const build: Partial<PrebuildConfig> = {
      components: { ...defaultConfig.components },
      componentPrices: { ...defaultComponentPrices },
      features: [],
    };

    headers.forEach((header, idx) => {
      const value = row[idx] || '';
      if (!value) return;

      const mappedField = HEADER_MAP[header];
      if (!mappedField) return;

      if (COMPONENT_FIELDS.includes(mappedField)) {
        if (build.components) {
          build.components[mappedField as ComponentCategory] = value;
        }
      } else if (mappedField === 'condition') {
        // Map condition values
        const condMap: Record<string, string> = {
          'new': 'new',
          'brand new': 'new',
          'preowned': 'preowned',
          'pre-owned': 'preowned',
          'used': 'preowned',
          'refurbished': 'refurbished',
          'refurb': 'refurbished',
          'open box': 'open_box',
          'openbox': 'open_box',
          'cpo': 'certified_preowned',
          'certified': 'certified_preowned',
          'certified pre-owned': 'certified_preowned',
        };
        (build as Record<string, unknown>)[mappedField] = condMap[value.toLowerCase()] || '';
      } else if (mappedField === 'stockStatus') {
        const stockMap: Record<string, string> = {
          'in stock': 'in_stock',
          'instock': 'in_stock',
          'available': 'in_stock',
          'low stock': 'low_stock',
          'lowstock': 'low_stock',
          'low': 'low_stock',
          'out of stock': 'out_of_stock',
          'outofstock': 'out_of_stock',
          'oos': 'out_of_stock',
          'sold out': 'out_of_stock',
          'on order': 'on_order',
          'onorder': 'on_order',
          'ordered': 'on_order',
        };
        (build as Record<string, unknown>)[mappedField] = stockMap[value.toLowerCase()] || '';
      } else {
        (build as Record<string, unknown>)[mappedField] = value;
      }
    });

    if (build.modelName || build.price || Object.values(build.components || {}).some(v => v)) {
      builds.push(build);
    }
  }

  return builds;
}

// Fetch and parse a public Google Sheet
export async function importFromGoogleSheet(urlOrId: string): Promise<{
  success: boolean;
  builds?: Partial<PrebuildConfig>[];
  error?: string;
}> {
  try {
    const sheetId = extractSheetId(urlOrId);
    if (!sheetId) {
      return { success: false, error: 'Invalid Google Sheet URL or ID' };
    }

    const csvUrl = buildSheetCsvUrl(sheetId);

    // Use a CORS proxy for public sheets
    // Note: The sheet must be publicly accessible (Share > Anyone with link)
    const response = await fetch(csvUrl);

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return {
          success: false,
          error: 'Cannot access sheet. Make sure it\'s shared as "Anyone with the link can view"'
        };
      }
      return { success: false, error: `Failed to fetch sheet: ${response.statusText}` };
    }

    const text = await response.text();

    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      return {
        success: false,
        error: 'Cannot access sheet. Make sure it\'s shared as "Anyone with the link can view"'
      };
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return { success: false, error: 'Sheet appears to be empty or has no data rows' };
    }

    const builds = parseSheetData(rows);
    if (builds.length === 0) {
      return { success: false, error: 'No valid builds found. Check that column headers match expected names.' };
    }

    return { success: true, builds };
  } catch (err) {
    console.error('Google Sheets import error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  }
}

// Export builds to CSV format for Google Sheets
export function exportToCSV(builds: PrebuildConfig[]): string {
  const headers = [
    'Model Name',
    'Price',
    'SKU',
    'CPU',
    'GPU',
    'RAM',
    'Storage',
    'Motherboard',
    'PSU',
    'Case',
    'Cooling',
    'OS',
    'Warranty',
    'WiFi',
    'Build Tier',
    'Condition',
    'Stock Status',
    'Quantity',
    'Description',
  ];

  const escapeCell = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = builds.map(build => [
    build.modelName || '',
    build.price || '',
    build.sku || '',
    build.components.cpu || '',
    build.components.gpu || '',
    build.components.ram || '',
    build.components.storage || '',
    build.components.motherboard || '',
    build.components.psu || '',
    build.components.case || '',
    build.components.cooling || '',
    build.os || '',
    build.warranty || '',
    build.wifi || '',
    build.buildTier || '',
    build.condition || '',
    build.stockStatus || '',
    build.stockQuantity || '',
    build.description || '',
  ].map(escapeCell).join(','));

  return [headers.join(','), ...rows].join('\n');
}

// Download CSV file
export function downloadCSV(builds: PrebuildConfig[], filename: string = 'prebuilds.csv'): void {
  const csv = exportToCSV(builds);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
