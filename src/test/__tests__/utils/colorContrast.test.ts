/**
 * Tests for color contrast utilities
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAALarge,
  meetsContrastAAA,
  getContrastLevel,
  isLightColor,
  getAccessibleTextColor,
  formatContrastRatio,
} from '../../../utils/colorContrast';

describe('hexToRgb', () => {
  it('should parse hex colors with hash', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('should parse hex colors without hash', () => {
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('should return null for invalid hex colors', () => {
    expect(hexToRgb('invalid')).toBeNull();
    expect(hexToRgb('#fff')).toBeNull(); // 3-digit hex not supported
    expect(hexToRgb('')).toBeNull();
  });
});

describe('getLuminance', () => {
  it('should return correct luminance for black', () => {
    expect(getLuminance(0, 0, 0)).toBe(0);
  });

  it('should return correct luminance for white', () => {
    expect(getLuminance(255, 255, 255)).toBe(1);
  });

  it('should return luminance between 0 and 1', () => {
    const luminance = getLuminance(128, 128, 128);
    expect(luminance).toBeGreaterThan(0);
    expect(luminance).toBeLessThan(1);
  });
});

describe('getContrastRatio', () => {
  it('should return 21:1 for black on white', () => {
    const ratio = getContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 1:1 for same colors', () => {
    const ratio = getContrastRatio('#ff0000', '#ff0000');
    expect(ratio).toBe(1);
  });

  it('should return consistent ratio regardless of order', () => {
    const ratio1 = getContrastRatio('#000000', '#ffffff');
    const ratio2 = getContrastRatio('#ffffff', '#000000');
    expect(ratio1).toBe(ratio2);
  });

  it('should handle invalid colors', () => {
    const ratio = getContrastRatio('invalid', '#ffffff');
    expect(ratio).toBe(1);
  });
});

describe('meetsContrastAA', () => {
  it('should pass for black on white', () => {
    expect(meetsContrastAA('#000000', '#ffffff')).toBe(true);
  });

  it('should fail for light gray on white', () => {
    expect(meetsContrastAA('#cccccc', '#ffffff')).toBe(false);
  });

  it('should pass for dark text on light background', () => {
    expect(meetsContrastAA('#333333', '#ffffff')).toBe(true);
  });
});

describe('meetsContrastAALarge', () => {
  it('should have lower threshold than AA', () => {
    // A color that passes AA Large but not AA
    const mediumGray = '#767676';
    expect(meetsContrastAALarge(mediumGray, '#ffffff')).toBe(true);
  });
});

describe('meetsContrastAAA', () => {
  it('should pass for black on white', () => {
    expect(meetsContrastAAA('#000000', '#ffffff')).toBe(true);
  });

  it('should fail for colors that only meet AA', () => {
    // Gray that meets AA (4.5:1) but not AAA (7:1)
    // #757575 has ~4.6:1 contrast with white
    const mediumGray = '#757575';
    expect(meetsContrastAA(mediumGray, '#ffffff')).toBe(true);
    expect(meetsContrastAAA(mediumGray, '#ffffff')).toBe(false);
  });
});

describe('getContrastLevel', () => {
  it('should return AAA for high contrast', () => {
    const result = getContrastLevel(21);
    expect(result.level).toBe('aaa');
    expect(result.label).toBe('AAA');
  });

  it('should return AA for medium-high contrast', () => {
    const result = getContrastLevel(5);
    expect(result.level).toBe('aa');
    expect(result.label).toBe('AA');
  });

  it('should return AA Large for medium contrast', () => {
    const result = getContrastLevel(3.5);
    expect(result.level).toBe('aa-large');
    expect(result.label).toBe('AA Large');
  });

  it('should return fail for low contrast', () => {
    const result = getContrastLevel(2);
    expect(result.level).toBe('fail');
    expect(result.label).toBe('Fail');
  });
});

describe('isLightColor', () => {
  it('should return true for white', () => {
    expect(isLightColor('#ffffff')).toBe(true);
  });

  it('should return false for black', () => {
    expect(isLightColor('#000000')).toBe(false);
  });

  it('should return true for yellow', () => {
    expect(isLightColor('#ffff00')).toBe(true);
  });

  it('should return false for dark blue', () => {
    expect(isLightColor('#000080')).toBe(false);
  });
});

describe('getAccessibleTextColor', () => {
  it('should return black for white background', () => {
    expect(getAccessibleTextColor('#ffffff')).toBe('#000000');
  });

  it('should return white for black background', () => {
    expect(getAccessibleTextColor('#000000')).toBe('#ffffff');
  });

  it('should return black for yellow background', () => {
    expect(getAccessibleTextColor('#ffff00')).toBe('#000000');
  });

  it('should return white for dark blue background', () => {
    expect(getAccessibleTextColor('#000080')).toBe('#ffffff');
  });
});

describe('formatContrastRatio', () => {
  it('should format ratio with 2 decimal places', () => {
    expect(formatContrastRatio(4.5)).toBe('4.50:1');
    expect(formatContrastRatio(21)).toBe('21.00:1');
    expect(formatContrastRatio(3.14159)).toBe('3.14:1');
  });
});
