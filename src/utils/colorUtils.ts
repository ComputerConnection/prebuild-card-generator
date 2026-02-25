/**
 * Color Utilities - Consolidated color conversion and manipulation functions
 *
 * Single source of truth for hex/RGB conversions used across:
 * - pdfHelpers.ts (PDF rendering)
 * - layoutSchema.ts (layout building)
 * - colorContrast.ts (WCAG accessibility)
 */

/** RGB color tuple [red, green, blue] with values 0-255 */
export type RGB = [number, number, number];

/** Hex color string (e.g. "#ff0000") */
export type HexColor = string;

/**
 * Convert hex color string to RGB tuple.
 * Returns [0, 0, 0] for invalid input.
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Convert hex color string to RGB object.
 * Returns null for invalid input.
 * Used by WCAG contrast calculations that need named fields.
 */
export function hexToRgbObject(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Lighten a hex color by a percentage (0-1).
 * Returns RGB tuple.
 */
export function lightenColor(hex: string, percent: number): RGB {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r + (255 - r) * percent),
    Math.round(g + (255 - g) * percent),
    Math.round(b + (255 - b) * percent),
  ];
}

/**
 * Darken a hex color by a percentage (0-1).
 * Returns RGB tuple.
 */
export function darkenColor(hex: string, percent: number): RGB {
  const [r, g, b] = hexToRgb(hex);
  return [
    Math.round(r * (1 - percent)),
    Math.round(g * (1 - percent)),
    Math.round(b * (1 - percent)),
  ];
}

/**
 * Lighten a hex color by a percentage (0-1).
 * Returns hex color string.
 */
export function lightenColorHex(hex: string, percent: number): HexColor {
  const [r, g, b] = lightenColor(hex, percent);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Darken a hex color by a percentage (0-1).
 * Returns hex color string.
 */
export function darkenColorHex(hex: string, percent: number): HexColor {
  const [r, g, b] = darkenColor(hex, percent);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Convert RGB tuple to hex string */
export function rgbToHex(rgb: RGB): HexColor {
  return `#${rgb[0].toString(16).padStart(2, '0')}${rgb[1].toString(16).padStart(2, '0')}${rgb[2].toString(16).padStart(2, '0')}`;
}
