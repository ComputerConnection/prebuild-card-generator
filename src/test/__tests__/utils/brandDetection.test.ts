/**
 * Tests for src/utils/brandDetection.ts
 */

import { describe, it, expect } from 'vitest';
import {
  detectBrand,
  findBrandIcon,
  getAllBrandNames,
  BRAND_PATTERNS,
} from '../../../utils/brandDetection';
import type { BrandIcon } from '../../../types';

describe('detectBrand', () => {
  describe('Intel detection', () => {
    it('should detect Intel by name', () => {
      expect(detectBrand('Intel Core i7-12700K')).toBe('Intel');
      expect(detectBrand('INTEL processor')).toBe('Intel');
    });

    it('should detect Intel Core series', () => {
      expect(detectBrand('Core i3-10100')).toBe('Intel');
      expect(detectBrand('Core i5 12600K')).toBe('Intel');
      expect(detectBrand('Core i7')).toBe('Intel');
      expect(detectBrand('Core i9-13900K')).toBe('Intel');
    });

    it('should detect Intel Arc GPUs', () => {
      expect(detectBrand('Arc A770')).toBe('Intel');
      expect(detectBrand('Intel Arc A380')).toBe('Intel');
    });
  });

  describe('AMD detection', () => {
    it('should detect AMD by name', () => {
      expect(detectBrand('AMD Ryzen 5 5600X')).toBe('AMD');
      expect(detectBrand('amd processor')).toBe('AMD');
    });

    it('should detect Ryzen processors', () => {
      expect(detectBrand('Ryzen 7 5800X')).toBe('AMD');
      expect(detectBrand('ryzen 9')).toBe('AMD');
    });

    it('should detect Radeon GPUs', () => {
      expect(detectBrand('Radeon RX 7900 XTX')).toBe('AMD');
      expect(detectBrand('RX 6800 XT')).toBe('AMD');
    });
  });

  describe('NVIDIA detection', () => {
    it('should detect NVIDIA by name', () => {
      expect(detectBrand('NVIDIA GeForce RTX 4090')).toBe('NVIDIA');
      expect(detectBrand('nvidia graphics')).toBe('NVIDIA');
    });

    it('should detect GeForce cards', () => {
      expect(detectBrand('GeForce RTX 3080')).toBe('NVIDIA');
      expect(detectBrand('GeForce GTX 1660 Super')).toBe('NVIDIA');
    });

    it('should detect RTX/GTX series', () => {
      expect(detectBrand('RTX 4070 Ti')).toBe('NVIDIA');
      expect(detectBrand('GTX 1080 Ti')).toBe('NVIDIA');
    });
  });

  describe('Memory brands', () => {
    it('should detect Corsair', () => {
      expect(detectBrand('Corsair Vengeance DDR5')).toBe('Corsair');
    });

    it('should detect G.Skill', () => {
      expect(detectBrand('G.Skill Trident Z5 RGB')).toBe('G.Skill');
      expect(detectBrand('GSkill Ripjaws')).toBe('G.Skill');
    });

    it('should detect Kingston', () => {
      expect(detectBrand('Kingston Fury Beast')).toBe('Kingston');
      expect(detectBrand('HyperX Predator')).toBe('Kingston');
    });
  });

  describe('Storage brands', () => {
    it('should detect Samsung', () => {
      expect(detectBrand('Samsung 990 Pro 2TB')).toBe('Samsung');
    });

    it('should detect Western Digital', () => {
      expect(detectBrand('Western Digital Blue SN580')).toBe('Western Digital');
      expect(detectBrand('WD Black SN850X')).toBe('Western Digital');
    });

    it('should detect Seagate', () => {
      expect(detectBrand('Seagate Barracuda 4TB')).toBe('Seagate');
      expect(detectBrand('FireCuda 530')).toBe('Seagate');
    });

    it('should detect Crucial', () => {
      expect(detectBrand('Crucial P5 Plus 1TB')).toBe('Crucial');
      expect(detectBrand('Crucial MX500')).toBe('Crucial');
    });
  });

  describe('Motherboard brands', () => {
    it('should detect ASUS', () => {
      expect(detectBrand('ASUS ROG Strix Z790')).toBe('ASUS');
      expect(detectBrand('TUF Gaming B550')).toBe('ASUS');
    });

    it('should detect MSI', () => {
      expect(detectBrand('MSI MEG Z690 ACE')).toBe('MSI');
      expect(detectBrand('MPG B550 Gaming Plus')).toBe('MSI');
    });

    it('should detect Gigabyte', () => {
      expect(detectBrand('Gigabyte AORUS Master')).toBe('Gigabyte');
    });

    it('should detect ASRock', () => {
      expect(detectBrand('ASRock B650 Taichi')).toBe('ASRock');
    });
  });

  describe('Cooling brands', () => {
    it('should detect Noctua', () => {
      expect(detectBrand('Noctua NH-D15')).toBe('Noctua');
      expect(detectBrand('NH-U12S')).toBe('Noctua');
    });

    it('should detect be quiet!', () => {
      expect(detectBrand('be quiet! Dark Rock Pro 4')).toBe('be quiet!');
      expect(detectBrand('Pure Base 500DX')).toBe('be quiet!');
    });

    it('should detect Cooler Master', () => {
      expect(detectBrand('Cooler Master Hyper 212')).toBe('Cooler Master');
    });

    it('should detect NZXT', () => {
      expect(detectBrand('NZXT Kraken X63')).toBe('NZXT');
    });
  });

  describe('Case sensitivity', () => {
    it('should match regardless of case', () => {
      expect(detectBrand('INTEL CORE I7')).toBe('Intel');
      expect(detectBrand('intel core i7')).toBe('Intel');
      expect(detectBrand('InTel CoRe I7')).toBe('Intel');
    });
  });

  describe('No match scenarios', () => {
    it('should return null for empty text', () => {
      expect(detectBrand('')).toBeNull();
    });

    it('should return null for unknown brands', () => {
      expect(detectBrand('Generic DDR4 RAM')).toBeNull();
      expect(detectBrand('Some Unknown Brand')).toBeNull();
    });
  });
});

describe('findBrandIcon', () => {
  const mockIcons: BrandIcon[] = [
    { name: 'Intel', image: 'data:image/png;base64,intel' },
    { name: 'AMD', image: 'data:image/png;base64,amd' },
    { name: 'NVIDIA', image: 'data:image/png;base64,nvidia' },
  ];

  it('should find icon for detected brand', () => {
    const result = findBrandIcon('Intel Core i7-12700K', mockIcons);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Intel');
  });

  it('should return null when brand not in icons', () => {
    const result = findBrandIcon('Corsair Vengeance', mockIcons);
    expect(result).toBeNull();
  });

  it('should return null when no brand detected', () => {
    const result = findBrandIcon('Generic RAM', mockIcons);
    expect(result).toBeNull();
  });

  it('should match case-insensitively', () => {
    const iconsLowercase: BrandIcon[] = [{ name: 'intel', image: 'data:image/png;base64,intel' }];
    const result = findBrandIcon('Intel Core i7', iconsLowercase);
    expect(result).not.toBeNull();
  });

  it('should handle empty icon list', () => {
    const result = findBrandIcon('Intel Core i7', []);
    expect(result).toBeNull();
  });
});

describe('getAllBrandNames', () => {
  it('should return all brand names', () => {
    const names = getAllBrandNames();
    expect(names.length).toBe(BRAND_PATTERNS.length);
  });

  it('should return sorted names', () => {
    const names = getAllBrandNames();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it('should include major brands', () => {
    const names = getAllBrandNames();
    expect(names).toContain('Intel');
    expect(names).toContain('AMD');
    expect(names).toContain('NVIDIA');
    expect(names).toContain('Corsair');
    expect(names).toContain('Samsung');
  });
});
