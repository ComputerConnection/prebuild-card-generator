export interface ComponentSpec {
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  motherboard: string;
  psu: string;
  case: string;
  cooling: string;
}

export interface ComponentPrices {
  cpu: number;
  gpu: number;
  ram: number;
  storage: number;
  motherboard: number;
  psu: number;
  case: number;
  cooling: number;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';

// Condition type for preowned/new status
export type ConditionType = 'new' | 'preowned' | 'refurbished' | 'open_box' | 'certified_preowned';

export const CONDITION_CONFIG: Record<
  ConditionType,
  { label: string; shortLabel: string; color: string; bgColor: string; description: string }
> = {
  new: {
    label: 'Brand New',
    shortLabel: 'NEW',
    color: '#16a34a',
    bgColor: '#dcfce7',
    description: 'Factory sealed, never opened',
  },
  preowned: {
    label: 'Pre-Owned',
    shortLabel: 'PREOWNED',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    description: 'Previously used, tested working',
  },
  refurbished: {
    label: 'Refurbished',
    shortLabel: 'REFURB',
    color: '#2563eb',
    bgColor: '#dbeafe',
    description: 'Restored to working condition',
  },
  open_box: {
    label: 'Open Box',
    shortLabel: 'OPEN BOX',
    color: '#ca8a04',
    bgColor: '#fef9c3',
    description: 'Opened but unused or like-new',
  },
  certified_preowned: {
    label: 'Certified Pre-Owned',
    shortLabel: 'CPO',
    color: '#0891b2',
    bgColor: '#cffafe',
    description: 'Professionally inspected & certified',
  },
};

export interface SaleInfo {
  enabled: boolean;
  originalPrice: number;
  badgeText: string; // e.g., "SALE", "HOT DEAL", custom text
}

export interface FinancingInfo {
  enabled: boolean;
  months: number;
  apr: number;
}

export interface StoreProfile {
  id: string;
  name: string;
  logo: string | null;
  defaultTheme: ColorTheme;
}

// Visual customization
export type BackgroundPattern = 'solid' | 'gradient' | 'geometric' | 'circuit' | 'dots';
export type CardTemplate = 'default' | 'minimal' | 'tech' | 'elegant';
export type FontFamily = 'helvetica' | 'arial' | 'georgia' | 'courier' | 'impact' | 'verdana';

export const BACKGROUND_PATTERNS: Record<
  BackgroundPattern,
  { name: string; description: string; value: string }
> = {
  solid: { name: 'Solid', description: 'Clean solid background', value: 'solid' },
  gradient: {
    name: 'Gradient',
    description: 'Subtle color gradient',
    value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
  },
  geometric: {
    name: 'Geometric',
    description: 'Modern geometric shapes',
    value:
      'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)',
  },
  circuit: {
    name: 'Circuit',
    description: 'Tech circuit board pattern',
    value:
      'linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
  },
  dots: {
    name: 'Dots',
    description: 'Dotted pattern',
    value: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
  },
};

export const CARD_TEMPLATES: Record<CardTemplate, { name: string; description: string }> = {
  default: { name: 'Default', description: 'Standard layout' },
  minimal: { name: 'Minimal', description: 'Clean, less visual noise' },
  tech: { name: 'Tech', description: 'Bold, techy aesthetic' },
  elegant: { name: 'Elegant', description: 'Premium, refined look' },
};

export const FONT_FAMILIES: Record<FontFamily, { name: string; pdfName: string; value: string }> = {
  helvetica: { name: 'Helvetica', pdfName: 'helvetica', value: 'Helvetica, Arial, sans-serif' },
  arial: { name: 'Arial', pdfName: 'helvetica', value: 'Arial, Helvetica, sans-serif' },
  georgia: { name: 'Georgia', pdfName: 'times', value: 'Georgia, "Times New Roman", serif' },
  courier: { name: 'Courier', pdfName: 'courier', value: '"Courier New", Courier, monospace' },
  impact: { name: 'Impact', pdfName: 'helvetica', value: 'Impact, "Arial Black", sans-serif' },
  verdana: { name: 'Verdana', pdfName: 'helvetica', value: 'Verdana, Geneva, sans-serif' },
};

export interface VisualSettings {
  backgroundPattern: BackgroundPattern;
  cardTemplate: CardTemplate;
  fontFamily: FontFamily;
  showQrCode: boolean;
  qrCodeUrl: string;
  productImage: string | null;
}

export type ColorTheme = 'gaming' | 'workstation' | 'budget' | 'minimal' | 'custom';

export interface ThemeColors {
  primary: string;
  accent: string;
  priceColor: string;
}

export const THEME_PRESETS: Record<Exclude<ColorTheme, 'custom'>, ThemeColors> = {
  gaming: {
    primary: '#dc2626', // Red
    accent: '#1f2937', // Dark gray
    priceColor: '#dc2626',
  },
  workstation: {
    primary: '#2563eb', // Blue
    accent: '#1e3a5f', // Dark blue
    priceColor: '#2563eb',
  },
  budget: {
    primary: '#16a34a', // Green
    accent: '#14532d', // Dark green
    priceColor: '#16a34a',
  },
  minimal: {
    primary: '#374151', // Gray
    accent: '#111827', // Near black
    priceColor: '#059669', // Emerald for price
  },
};

export interface BrandIcon {
  name: string;
  image: string; // base64 data URL
}

export interface PrebuildConfig {
  modelName: string;
  price: number;
  components: ComponentSpec;
  storeName: string;
  storeLogo: string | null;
  // New fields
  sku: string;
  os: string;
  warranty: string;
  wifi: string;
  buildTier: string;
  features: string[];
  description: string;
  // Theme
  colorTheme: ColorTheme;
  customColors: ThemeColors;
  // Component prices (optional breakdown)
  componentPrices: ComponentPrices;
  showComponentPrices: boolean;
  // Inventory
  stockStatus: StockStatus | null;
  stockQuantity: string;
  // Sale/Discount
  saleInfo: SaleInfo;
  // Financing
  financingInfo: FinancingInfo;
  // Visual settings
  visualSettings: VisualSettings;
  // Condition (new/preowned)
  condition: ConditionType | null;
}

// Brand icons are stored separately from presets (shared across all)
export interface BrandIconsConfig {
  icons: BrandIcon[];
}

export interface Preset {
  id: string;
  name: string;
  config: PrebuildConfig;
  createdAt: number;
  folder?: string;
}

export interface PresetFolder {
  id: string;
  name: string;
  color: string;
}

export const DEFAULT_FOLDERS: PresetFolder[] = [
  { id: 'gaming', name: 'Gaming', color: '#dc2626' },
  { id: 'workstation', name: 'Workstation', color: '#2563eb' },
  { id: 'budget', name: 'Budget', color: '#16a34a' },
  { id: 'custom', name: 'Custom', color: '#8b5cf6' },
];

export type CardSize = 'shelf' | 'price' | 'poster';

export interface CardSizeConfig {
  name: string;
  width: number;
  height: number;
  unit: string;
  description: string;
}

export const CARD_SIZES: Record<CardSize, CardSizeConfig> = {
  shelf: {
    name: 'Shelf Tag',
    width: 2,
    height: 3,
    unit: 'in',
    description: 'Compact, key specs only',
  },
  price: {
    name: 'Price Card',
    width: 4,
    height: 6,
    unit: 'in',
    description: 'Medium detail, fits display stands',
  },
  poster: {
    name: 'Poster',
    width: 8.5,
    height: 11,
    unit: 'in',
    description: 'Full specs, prominent display',
  },
};

export type ComponentCategory = keyof ComponentSpec;

export const COMPONENT_LABELS: Record<ComponentCategory, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  storage: 'Storage',
  motherboard: 'Motherboard',
  psu: 'PSU',
  case: 'Case',
  cooling: 'Cooling',
};

export function getThemeColors(config: PrebuildConfig): ThemeColors {
  if (config.colorTheme === 'custom') {
    return config.customColors;
  }
  return THEME_PRESETS[config.colorTheme];
}

// ============================================================================
// PRICE FORMATTING UTILITIES
// ============================================================================

/**
 * Format a number as a price string with $ symbol and commas
 * @param price - The price as a number
 * @param showCents - Whether to show cents (default: true)
 * @returns Formatted price string (e.g., "$1,499.00" or "$1,499")
 */
export function formatPrice(price: number, showCents: boolean = true): string {
  if (price === 0) return showCents ? '$0.00' : '$0';
  if (isNaN(price)) return showCents ? '$0.00' : '$0';

  const formatted = price.toLocaleString('en-US', {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  return `$${formatted}`;
}

/**
 * Parse a price string into a number
 * Handles formats like "$1,499", "1499.99", "$1,499.00", etc.
 * @param priceString - The price string to parse
 * @returns The price as a number, or 0 if invalid
 */
export function parsePrice(priceString: string): number {
  if (!priceString) return 0;
  // Remove $ and commas, then parse
  const cleaned = priceString.replace(/[$,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a price for display in an input field (no $ symbol for easier editing)
 * @param price - The price as a number
 * @returns Formatted string without $ symbol
 */
export function formatPriceForInput(price: number): string {
  if (price === 0) return '';
  if (isNaN(price)) return '';
  return price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// ============================================================================
// CALCULATION UTILITIES
// ============================================================================

/**
 * Calculate monthly payment for financing
 * @param price - The total price as a number
 * @param months - Number of months for financing
 * @param apr - Annual percentage rate
 * @returns Monthly payment formatted as string, or empty string if invalid
 */
export function calculateMonthlyPayment(price: number, months: number, apr: number): string {
  if (price <= 0 || months <= 0) return '';

  if (apr === 0) {
    return (price / months).toFixed(2);
  }

  const monthlyRate = apr / 100 / 12;
  const payment =
    (price * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return payment.toFixed(2);
}

/**
 * Calculate discount percentage between original and sale price
 * @param originalPrice - Original price as a number
 * @param salePrice - Sale price as a number
 * @returns Discount percentage as a whole number
 */
export function calculateDiscountPercent(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice < 0) return 0;
  if (salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Calculate total of all component prices
 * @param prices - ComponentPrices object with numeric values
 * @returns Total price as a number
 */
export function calculateComponentTotal(prices: ComponentPrices): number {
  let total = 0;
  Object.values(prices).forEach((price) => {
    if (typeof price === 'number' && !isNaN(price)) {
      total += price;
    }
  });
  return total;
}

// Stock status labels and colors
export const STOCK_STATUS_CONFIG: Record<
  StockStatus,
  { label: string; color: string; bgColor: string }
> = {
  in_stock: { label: 'In Stock', color: '#16a34a', bgColor: '#dcfce7' },
  low_stock: { label: 'Low Stock', color: '#ca8a04', bgColor: '#fef9c3' },
  out_of_stock: { label: 'Out of Stock', color: '#dc2626', bgColor: '#fee2e2' },
  on_order: { label: 'On Order', color: '#2563eb', bgColor: '#dbeafe' },
};
