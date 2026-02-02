/**
 * Color Contrast Utilities for WCAG 2.1 Accessibility
 *
 * Implements contrast ratio calculations per WCAG 2.1 guidelines:
 * - Normal text: minimum 4.5:1 contrast ratio (AA)
 * - Large text (18pt+/14pt bold): minimum 3:1 contrast ratio (AA)
 * - Enhanced (AAA): 7:1 for normal text, 4.5:1 for large text
 */

/**
 * Parse a hex color string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * Convert RGB to relative luminance per WCAG 2.1
 * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard for normal text (4.5:1)
 */
export function meetsContrastAA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 4.5;
}

/**
 * Check if contrast meets WCAG AA standard for large text (3:1)
 */
export function meetsContrastAALarge(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 3;
}

/**
 * Check if contrast meets WCAG AAA standard for normal text (7:1)
 */
export function meetsContrastAAA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 7;
}

/**
 * Get a text description of the contrast level
 */
export function getContrastLevel(ratio: number): {
  level: 'fail' | 'aa-large' | 'aa' | 'aaa';
  label: string;
  description: string;
} {
  if (ratio >= 7) {
    return {
      level: 'aaa',
      label: 'AAA',
      description: 'Excellent contrast for all text sizes',
    };
  }
  if (ratio >= 4.5) {
    return {
      level: 'aa',
      label: 'AA',
      description: 'Good contrast for normal text',
    };
  }
  if (ratio >= 3) {
    return {
      level: 'aa-large',
      label: 'AA Large',
      description: 'Acceptable for large text only (18pt+ or 14pt bold)',
    };
  }
  return {
    level: 'fail',
    label: 'Fail',
    description: 'Insufficient contrast - may be hard to read',
  };
}

/**
 * Determine if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.179;
}

/**
 * Get suggested text color (black or white) for a background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}
