import { ComponentCategory, THEME_PRESETS } from '../types';

export const componentOptions: Record<ComponentCategory, string[]> = {
  cpu: [
    'Intel Core i9-14900K',
    'Intel Core i7-14700K',
    'Intel Core i5-14600K',
    'Intel Core i9-13900K',
    'Intel Core i7-13700K',
    'Intel Core i5-13600K',
    'AMD Ryzen 9 7950X3D',
    'AMD Ryzen 9 7950X',
    'AMD Ryzen 7 7800X3D',
    'AMD Ryzen 7 7700X',
    'AMD Ryzen 5 7600X',
    'AMD Ryzen 5 7600',
  ],
  gpu: [
    'NVIDIA RTX 4090',
    'NVIDIA RTX 4080 Super',
    'NVIDIA RTX 4080',
    'NVIDIA RTX 4070 Ti Super',
    'NVIDIA RTX 4070 Ti',
    'NVIDIA RTX 4070 Super',
    'NVIDIA RTX 4070',
    'NVIDIA RTX 4060 Ti',
    'NVIDIA RTX 4060',
    'AMD RX 7900 XTX',
    'AMD RX 7900 XT',
    'AMD RX 7800 XT',
    'AMD RX 7700 XT',
    'AMD RX 7600',
    'Intel Arc A770',
    'Intel Arc A750',
  ],
  ram: [
    '64GB DDR5-6000',
    '64GB DDR5-5600',
    '32GB DDR5-6400',
    '32GB DDR5-6000',
    '32GB DDR5-5600',
    '32GB DDR4-3600',
    '32GB DDR4-3200',
    '16GB DDR5-6000',
    '16GB DDR5-5600',
    '16GB DDR4-3600',
    '16GB DDR4-3200',
  ],
  storage: [
    '2TB NVMe SSD',
    '1TB NVMe SSD',
    '512GB NVMe SSD',
    '2TB NVMe SSD + 2TB HDD',
    '1TB NVMe SSD + 2TB HDD',
    '1TB NVMe SSD + 1TB HDD',
    '512GB NVMe SSD + 1TB HDD',
    '4TB NVMe SSD',
    '2TB SATA SSD',
    '1TB SATA SSD',
  ],
  motherboard: [
    'ASUS ROG Maximus Z790 Hero',
    'ASUS ROG Strix Z790-E',
    'ASUS ROG Strix B760-F',
    'ASUS ROG Strix B650-A',
    'ASUS TUF Gaming B650-Plus',
    'MSI MEG Z790 ACE',
    'MSI MPG Z790 Carbon WiFi',
    'MSI MAG B650 Tomahawk',
    'Gigabyte Z790 Aorus Master',
    'Gigabyte B650 Aorus Elite AX',
    'ASRock X670E Taichi',
    'ASRock B650M Pro RS',
  ],
  psu: [
    '1200W 80+ Platinum',
    '1000W 80+ Platinum',
    '1000W 80+ Gold',
    '850W 80+ Platinum',
    '850W 80+ Gold',
    '750W 80+ Gold',
    '750W 80+ Bronze',
    '650W 80+ Gold',
    '650W 80+ Bronze',
    '550W 80+ Bronze',
  ],
  case: [
    'Lian Li O11 Dynamic EVO',
    'Lian Li Lancool III',
    'Lian Li Lancool II Mesh',
    'NZXT H9 Elite',
    'NZXT H7 Flow',
    'NZXT H5 Flow',
    'Corsair 5000D Airflow',
    'Corsair 4000D Airflow',
    'Fractal Design Torrent',
    'Fractal Design North',
    'Fractal Design Meshify 2',
    'Phanteks Eclipse G360A',
    'be quiet! Pure Base 500DX',
  ],
  cooling: [
    '360mm AIO Liquid Cooler',
    '280mm AIO Liquid Cooler',
    '240mm AIO Liquid Cooler',
    '120mm AIO Liquid Cooler',
    'Custom Loop Liquid Cooling',
    'Dual Tower Air Cooler',
    'Tower Air Cooler',
    'Low Profile Air Cooler',
    'Stock Cooler',
  ],
};

export const osOptions = [
  'Windows 11 Pro',
  'Windows 11 Home',
  'Windows 10 Pro',
  'Windows 10 Home',
  'No OS Included',
  'Linux (Ubuntu)',
  'Free DOS',
];

export const warrantyOptions = [
  '3 Year Parts & Labor',
  '2 Year Parts & Labor',
  '1 Year Parts & Labor',
  '1 Year Parts Only',
  '90 Day Warranty',
  'Lifetime Support',
];

export const wifiOptions = [
  'WiFi 7 + Bluetooth 5.4',
  'WiFi 6E + Bluetooth 5.3',
  'WiFi 6 + Bluetooth 5.2',
  'WiFi 5 + Bluetooth 5.0',
  '2.5Gb Ethernet Only',
  '1Gb Ethernet Only',
  'WiFi 6E + 2.5Gb Ethernet',
];

export const buildTierOptions = [
  'Entry Gaming',
  'Mid-Range Gaming',
  'High-End Gaming',
  'Ultimate Gaming',
  'Content Creator',
  'Professional Workstation',
  'Streaming PC',
  'Budget Build',
  'Compact Build',
  'Silent Build',
];

export const featureOptions = [
  'VR Ready',
  '4K Gaming',
  '1440p Gaming',
  'Ray Tracing',
  'AI Ready',
  'RGB Lighting',
  'Whisper Quiet',
  'Compact Form Factor',
  'Tool-less Design',
  'Cable Management',
  'Tempered Glass',
  'USB-C Front Panel',
  'Thunderbolt 4',
  'PCIe 5.0',
  'DDR5 Memory',
  'NVMe Gen 5',
];

export const defaultComponents = {
  cpu: '',
  gpu: '',
  ram: '',
  storage: '',
  motherboard: '',
  psu: '',
  case: '',
  cooling: '',
};

export const defaultComponentPrices = {
  cpu: 0,
  gpu: 0,
  ram: 0,
  storage: 0,
  motherboard: 0,
  psu: 0,
  case: 0,
  cooling: 0,
};

export const saleBadgeOptions = [
  'SALE',
  'HOT DEAL',
  'CLEARANCE',
  'LIMITED TIME',
  'PRICE DROP',
  'SPECIAL OFFER',
];

export const financingTermOptions = [6, 12, 18, 24, 36, 48, 60];

export const defaultVisualSettings = {
  backgroundPattern: 'solid' as const,
  cardTemplate: 'default' as const,
  fontFamily: 'helvetica' as const,
  showQrCode: false,
  qrCodeUrl: '',
  productImage: null as string | null,
};

export const defaultConfig = {
  modelName: '',
  price: 0,
  components: { ...defaultComponents },
  storeName: '',
  storeLogo: null,
  sku: '',
  os: '',
  warranty: '',
  wifi: '',
  buildTier: '',
  features: [] as string[],
  description: '',
  colorTheme: 'minimal' as const,
  customColors: { ...THEME_PRESETS.minimal },
  // Component prices
  componentPrices: { ...defaultComponentPrices },
  showComponentPrices: false,
  // Inventory
  stockStatus: null,
  stockQuantity: '',
  // Sale info
  saleInfo: {
    enabled: false,
    originalPrice: 0,
    badgeText: 'SALE',
  },
  // Financing
  financingInfo: {
    enabled: false,
    months: 24,
    apr: 0,
  },
  // Visual settings
  visualSettings: { ...defaultVisualSettings },
  // Condition
  condition: null,
};
