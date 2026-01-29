import { BrandIcon } from '../types';

// Common brand patterns to detect in component text
export const BRAND_PATTERNS: { brand: string; patterns: RegExp[] }[] = [
  { brand: 'Intel', patterns: [/\bintel\b/i, /\bcore\s*i[3579]\b/i, /\barc\s*a\d/i] },
  { brand: 'AMD', patterns: [/\bamd\b/i, /\bryzen\b/i, /\bradeon\b/i, /\brx\s*\d/i] },
  { brand: 'NVIDIA', patterns: [/\bnvidia\b/i, /\bgeforce\b/i, /\brtx\b/i, /\bgtx\b/i] },
  { brand: 'Corsair', patterns: [/\bcorsair\b/i] },
  { brand: 'G.Skill', patterns: [/\bg\.?skill\b/i, /\btrident\b/i, /\bripjaws\b/i] },
  { brand: 'Kingston', patterns: [/\bkingston\b/i, /\bfury\b/i, /\bhyperx\b/i] },
  { brand: 'Samsung', patterns: [/\bsamsung\b/i] },
  { brand: 'Western Digital', patterns: [/\bwestern\s*digital\b/i, /\bwd\b/i, /\bsn\d{3}\b/i] },
  { brand: 'Seagate', patterns: [/\bseagate\b/i, /\bbarracuda\b/i, /\bfirecuda\b/i] },
  { brand: 'Crucial', patterns: [/\bcrucial\b/i, /\bmx\d{3}\b/i, /\bp\d\s*plus\b/i] },
  { brand: 'ASUS', patterns: [/\basus\b/i, /\brog\b/i, /\btuf\b/i, /\bstrix\b/i] },
  { brand: 'MSI', patterns: [/\bmsi\b/i, /\bmeg\b/i, /\bmpg\b/i, /\bmag\b/i] },
  { brand: 'Gigabyte', patterns: [/\bgigabyte\b/i, /\baorus\b/i] },
  { brand: 'ASRock', patterns: [/\basrock\b/i, /\btaichi\b/i] },
  { brand: 'EVGA', patterns: [/\bevga\b/i] },
  { brand: 'Seasonic', patterns: [/\bseasonic\b/i, /\bfocus\b/i, /\bprime\b/i] },
  { brand: 'be quiet!', patterns: [/\bbe\s*quiet\b/i, /\bdark\s*rock\b/i, /\bpure\s*base\b/i] },
  { brand: 'Noctua', patterns: [/\bnoctua\b/i, /\bnh-\w/i] },
  { brand: 'Cooler Master', patterns: [/\bcooler\s*master\b/i, /\bhyper\s*\d{3}\b/i] },
  { brand: 'NZXT', patterns: [/\bnzxt\b/i, /\bkraken\b/i] },
  { brand: 'Lian Li', patterns: [/\blian\s*li\b/i, /\blancool\b/i, /\bo11\b/i] },
  { brand: 'Fractal Design', patterns: [/\bfractal\b/i, /\bmeshify\b/i, /\btorrent\b/i, /\bnorth\b/i] },
  { brand: 'Phanteks', patterns: [/\bphanteks\b/i, /\beclipse\b/i, /\benthoo\b/i] },
  { brand: 'Thermaltake', patterns: [/\bthermaltake\b/i, /\btoughram\b/i] },
  { brand: 'SilverStone', patterns: [/\bsilverstone\b/i] },
  { brand: 'Arctic', patterns: [/\barctic\b/i, /\bliquid\s*freezer\b/i] },
  { brand: 'EK', patterns: [/\bek\b/i, /\bekwb\b/i] },
  { brand: 'Sabrent', patterns: [/\bsabrent\b/i, /\brocket\b/i] },
  { brand: 'SK hynix', patterns: [/\bsk\s*hynix\b/i, /\bhynix\b/i] },
  { brand: 'Team Group', patterns: [/\bteam\s*group\b/i, /\bt-force\b/i] },
  { brand: 'PNY', patterns: [/\bpny\b/i] },
  { brand: 'Zotac', patterns: [/\bzotac\b/i] },
  { brand: 'Sapphire', patterns: [/\bsapphire\b/i, /\bnitro\b/i, /\bpulse\b/i] },
  { brand: 'PowerColor', patterns: [/\bpowercolor\b/i, /\bred\s*devil\b/i] },
  { brand: 'XFX', patterns: [/\bxfx\b/i] },
];

/**
 * Detect brand from component text
 */
export function detectBrand(text: string): string | null {
  if (!text) return null;

  for (const { brand, patterns } of BRAND_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return brand;
      }
    }
  }

  return null;
}

/**
 * Find brand icon for a component value
 */
export function findBrandIcon(value: string, brandIcons: BrandIcon[]): BrandIcon | null {
  const brand = detectBrand(value);
  if (!brand) return null;

  return brandIcons.find(icon =>
    icon.name.toLowerCase() === brand.toLowerCase()
  ) || null;
}

/**
 * Get list of all known brand names for the UI
 */
export function getAllBrandNames(): string[] {
  return BRAND_PATTERNS.map(b => b.brand).sort();
}
