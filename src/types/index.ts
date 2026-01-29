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

export type ColorTheme = 'gaming' | 'workstation' | 'budget' | 'minimal' | 'custom';

export interface ThemeColors {
  primary: string;
  accent: string;
  priceColor: string;
}

export const THEME_PRESETS: Record<Exclude<ColorTheme, 'custom'>, ThemeColors> = {
  gaming: {
    primary: '#dc2626',    // Red
    accent: '#1f2937',     // Dark gray
    priceColor: '#dc2626',
  },
  workstation: {
    primary: '#2563eb',    // Blue
    accent: '#1e3a5f',     // Dark blue
    priceColor: '#2563eb',
  },
  budget: {
    primary: '#16a34a',    // Green
    accent: '#14532d',     // Dark green
    priceColor: '#16a34a',
  },
  minimal: {
    primary: '#374151',    // Gray
    accent: '#111827',     // Near black
    priceColor: '#059669', // Emerald for price
  },
};

export interface PrebuildConfig {
  modelName: string;
  price: string;
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
}

export interface Preset {
  id: string;
  name: string;
  config: PrebuildConfig;
  createdAt: number;
}

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
    description: 'Compact, key specs only'
  },
  price: {
    name: 'Price Card',
    width: 4,
    height: 6,
    unit: 'in',
    description: 'Medium detail, fits display stands'
  },
  poster: {
    name: 'Poster',
    width: 8.5,
    height: 11,
    unit: 'in',
    description: 'Full specs, prominent display'
  }
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
  cooling: 'Cooling'
};

export function getThemeColors(config: PrebuildConfig): ThemeColors {
  if (config.colorTheme === 'custom') {
    return config.customColors;
  }
  return THEME_PRESETS[config.colorTheme];
}
