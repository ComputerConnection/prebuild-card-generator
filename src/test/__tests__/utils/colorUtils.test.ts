/**
 * Tests for src/utils/colorUtils.ts
 *
 * Covers the consolidated color conversion and manipulation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  hexToRgbObject,
  lightenColor,
  darkenColor,
  lightenColorHex,
  darkenColorHex,
  rgbToHex,
} from '../../../utils/colorUtils';

// ============================================================================
// hexToRgb (tuple format)
// ============================================================================

describe('hexToRgb', () => {
  it('should convert #ff0000 to [255, 0, 0]', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('should convert #00ff00 to [0, 255, 0]', () => {
    expect(hexToRgb('#00ff00')).toEqual([0, 255, 0]);
  });

  it('should convert #0000ff to [0, 0, 255]', () => {
    expect(hexToRgb('#0000ff')).toEqual([0, 0, 255]);
  });

  it('should handle without hash prefix', () => {
    expect(hexToRgb('ff0000')).toEqual([255, 0, 0]);
  });

  it('should return [0,0,0] for invalid input', () => {
    expect(hexToRgb('invalid')).toEqual([0, 0, 0]);
    expect(hexToRgb('')).toEqual([0, 0, 0]);
  });

  it('should handle black and white', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
  });

  it('should be case-insensitive', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#aaBBcc')).toEqual([170, 187, 204]);
  });
});

// ============================================================================
// hexToRgbObject (object format)
// ============================================================================

describe('hexToRgbObject', () => {
  it('should convert to {r, g, b} object', () => {
    expect(hexToRgbObject('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('should return null for invalid input', () => {
    expect(hexToRgbObject('invalid')).toBeNull();
    expect(hexToRgbObject('')).toBeNull();
  });

  it('should handle without hash prefix', () => {
    expect(hexToRgbObject('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
  });
});

// ============================================================================
// lightenColor (returns RGB tuple)
// ============================================================================

describe('lightenColor', () => {
  it('should lighten black by 50% to gray', () => {
    expect(lightenColor('#000000', 0.5)).toEqual([128, 128, 128]);
  });

  it('should lighten black by 100% to white', () => {
    expect(lightenColor('#000000', 1)).toEqual([255, 255, 255]);
  });

  it('should not change with 0%', () => {
    expect(lightenColor('#ff0000', 0)).toEqual([255, 0, 0]);
  });

  it('should lighten a color partially', () => {
    const result = lightenColor('#800000', 0.5);
    expect(result[0]).toBeGreaterThan(128); // Red gets lighter
    expect(result[1]).toBe(128); // Green goes up
    expect(result[2]).toBe(128); // Blue goes up
  });
});

// ============================================================================
// darkenColor (returns RGB tuple)
// ============================================================================

describe('darkenColor', () => {
  it('should darken white by 50% to gray', () => {
    expect(darkenColor('#ffffff', 0.5)).toEqual([128, 128, 128]);
  });

  it('should darken to black at 100%', () => {
    expect(darkenColor('#ffffff', 1)).toEqual([0, 0, 0]);
  });

  it('should not change with 0%', () => {
    expect(darkenColor('#ff0000', 0)).toEqual([255, 0, 0]);
  });
});

// ============================================================================
// lightenColorHex / darkenColorHex (return hex strings)
// ============================================================================

describe('lightenColorHex', () => {
  it('should return hex string', () => {
    const result = lightenColorHex('#000000', 0.5);
    expect(result).toBe('#808080');
  });

  it('should lighten to white', () => {
    expect(lightenColorHex('#000000', 1)).toBe('#ffffff');
  });
});

describe('darkenColorHex', () => {
  it('should return hex string', () => {
    const result = darkenColorHex('#ffffff', 0.5);
    expect(result).toBe('#808080');
  });

  it('should darken to black', () => {
    expect(darkenColorHex('#ffffff', 1)).toBe('#000000');
  });
});

// ============================================================================
// rgbToHex
// ============================================================================

describe('rgbToHex', () => {
  it('should convert RGB tuple to hex', () => {
    expect(rgbToHex([255, 0, 0])).toBe('#ff0000');
    expect(rgbToHex([0, 255, 0])).toBe('#00ff00');
    expect(rgbToHex([0, 0, 255])).toBe('#0000ff');
  });

  it('should pad single-digit values', () => {
    expect(rgbToHex([0, 0, 0])).toBe('#000000');
    expect(rgbToHex([1, 2, 3])).toBe('#010203');
  });

  it('should handle white', () => {
    expect(rgbToHex([255, 255, 255])).toBe('#ffffff');
  });
});

// ============================================================================
// Round-trip consistency
// ============================================================================

describe('round-trip conversions', () => {
  it('hexToRgb → rgbToHex should return original', () => {
    const hex = '#abcdef';
    expect(rgbToHex(hexToRgb(hex))).toBe(hex);
  });

  it('lightenColor → rgbToHex should match lightenColorHex', () => {
    const hex = '#336699';
    const percent = 0.3;
    expect(rgbToHex(lightenColor(hex, percent))).toBe(lightenColorHex(hex, percent));
  });

  it('darkenColor → rgbToHex should match darkenColorHex', () => {
    const hex = '#cc9966';
    const percent = 0.4;
    expect(rgbToHex(darkenColor(hex, percent))).toBe(darkenColorHex(hex, percent));
  });
});
