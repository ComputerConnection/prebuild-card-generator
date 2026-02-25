/**
 * Layout Schema - Declarative layout description for cards
 *
 * This module defines a layout schema that can be rendered to both
 * HTML (CardPreview) and PDF (pdfGenerator). Changes to layout
 * structure only need to happen in one place.
 */

import type { PrebuildConfig, CardSize, BrandIcon, ThemeColors, ComponentCategory } from '../types';
import { lightenColorHex, darkenColorHex, type HexColor } from './colorUtils';

// Re-export color types and utilities from the canonical source
export type { RGB, HexColor } from './colorUtils';
export { hexToRgb } from './colorUtils';

/** Position within the card (relative units 0-1 or absolute) */
export interface Position {
  x: number;
  y: number;
}

/** Size specification */
export interface Size {
  width: number;
  height: number;
}

/** Text alignment */
export type TextAlign = 'left' | 'center' | 'right';

/** Font weight */
export type FontWeight = 'normal' | 'bold';

/** Font style */
export type FontStyle = 'normal' | 'italic';

// ============================================================================
// STYLE TYPES
// ============================================================================

/** Text styling */
export interface TextStyle {
  fontSize: number;
  fontWeight: FontWeight;
  fontStyle?: FontStyle;
  color: HexColor;
  align: TextAlign;
  lineHeight?: number;
}

/** Box/container styling */
export interface BoxStyle {
  backgroundColor?: HexColor;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: HexColor;
  padding?: number | { x: number; y: number };
}

/** Badge styling */
export interface BadgeStyle {
  backgroundColor: HexColor;
  textColor: HexColor;
  fontSize: number;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
}

// ============================================================================
// LAYOUT ELEMENT TYPES
// ============================================================================

/** Base element with common properties */
interface BaseElement {
  id: string;
  visible: boolean;
}

/** Header bar element */
export interface HeaderElement extends BaseElement {
  type: 'header';
  text: string;
  style: {
    height: number;
    backgroundColor: HexColor;
    textColor: HexColor;
    fontSize: number;
    accentHeight?: number;
    accentColor?: HexColor;
  };
}

/** Text element */
export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  style: TextStyle;
  maxLines?: number;
  strikethrough?: boolean;
}

/** Badge element */
export interface BadgeElement extends BaseElement {
  type: 'badge';
  text: string;
  style: BadgeStyle;
}

/** Badge row - horizontal row of badges */
export interface BadgeRowElement extends BaseElement {
  type: 'badge-row';
  badges: Array<{
    text: string;
    backgroundColor: HexColor;
    textColor: HexColor;
  }>;
  style: {
    fontSize: number;
    paddingX: number;
    paddingY: number;
    borderRadius: number;
    spacing: number;
  };
  align: TextAlign;
}

/** Image element */
export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  size: Size;
  objectFit: 'contain' | 'cover' | 'fill';
}

/** Price section element */
export interface PriceElement extends BaseElement {
  type: 'price';
  currentPrice: number;
  originalPrice?: number;
  showStrikethrough: boolean;
  style: {
    mainFontSize: number;
    strikeFontSize: number;
    priceColor: HexColor;
    strikeColor: HexColor;
    showBox: boolean;
    boxColor?: HexColor;
    boxRadius?: number;
    boxHeight?: number;
  };
}

/** Financing info element */
export interface FinancingElement extends BaseElement {
  type: 'financing';
  monthlyAmount: string;
  months: number;
  apr: number;
  showApr: boolean;
  style: TextStyle;
}

/** Single spec item */
export interface SpecItem {
  key: ComponentCategory;
  label: string;
  value: string;
  brandIcon?: {
    src: string;
    name: string;
  };
}

/** Specs section element */
export interface SpecsElement extends BaseElement {
  type: 'specs';
  specs: SpecItem[];
  layout: 'single-column' | 'two-column';
  style: {
    labelFontSize: number;
    valueFontSize: number;
    labelColor: HexColor;
    valueColor: HexColor;
    iconSize: number;
    lineHeight: number;
    backgroundColor?: HexColor;
    accentWidth?: number;
    accentColor?: HexColor;
    borderRadius?: number;
    padding?: number;
  };
}

/** Info bar item */
export interface InfoItem {
  label: string;
  value: string;
}

/** Info bar element (OS, Warranty, etc.) */
export interface InfoBarElement extends BaseElement {
  type: 'info-bar';
  items: InfoItem[];
  style: {
    height: number;
    backgroundColor: HexColor;
    labelFontSize: number;
    valueFontSize: number;
    labelColor: HexColor;
    valueColor: HexColor;
    borderRadius: number;
  };
}

/** Barcode element */
export interface BarcodeElement extends BaseElement {
  type: 'barcode';
  value: string;
  size: Size;
}

/** QR code element */
export interface QRCodeElement extends BaseElement {
  type: 'qrcode';
  url: string;
  size: number;
}

/** SKU text element */
export interface SKUElement extends BaseElement {
  type: 'sku';
  value: string;
  style: TextStyle;
}

/** Divider/separator element */
export interface DividerElement extends BaseElement {
  type: 'divider';
  style: {
    color: HexColor;
    thickness: number;
  };
}

/** Footer accent bar */
export interface FooterAccentElement extends BaseElement {
  type: 'footer-accent';
  style: {
    height: number;
    primaryColor: HexColor;
    accentColor?: HexColor;
    accentHeight?: number;
  };
}

/** Union of all element types */
export type LayoutElement =
  | HeaderElement
  | TextElement
  | BadgeElement
  | BadgeRowElement
  | ImageElement
  | PriceElement
  | FinancingElement
  | SpecsElement
  | InfoBarElement
  | BarcodeElement
  | QRCodeElement
  | SKUElement
  | DividerElement
  | FooterAccentElement;

// ============================================================================
// CARD LAYOUT
// ============================================================================

/** Complete card layout */
export interface CardLayout {
  /** Card size identifier */
  cardSize: CardSize;
  /** Card dimensions in inches */
  dimensions: Size;
  /** Theme colors used */
  colors: ThemeColors;
  /** Background style */
  background: {
    color: HexColor;
    pattern?: string;
  };
  /** Font family */
  fontFamily: string;
  /** Ordered list of elements */
  elements: LayoutElement[];
}

// ============================================================================
// BUILDER CONTEXT
// ============================================================================

/** Context passed to layout builders */
export interface LayoutBuilderContext {
  config: PrebuildConfig;
  cardSize: CardSize;
  colors: ThemeColors;
  brandIcons: BrandIcon[];
  /** Async data like QR codes and barcodes */
  asyncData?: {
    qrCodeImage?: string;
    barcodeImage?: string;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Element ID generator factory */
export class ElementIdGenerator {
  private counter = 0;

  generate(prefix: string): string {
    return `${prefix}-${++this.counter}`;
  }

  reset(): void {
    this.counter = 0;
  }
}

/** Default generator instance */
const defaultGenerator = new ElementIdGenerator();

/** Generate a unique element ID */
export function generateElementId(prefix: string): string {
  return defaultGenerator.generate(prefix);
}

/** Reset ID counter (useful for testing) */
export function resetElementIdCounter(): void {
  defaultGenerator.reset();
}

/** Lighten a hex color by a percentage, returns hex string */
export function lightenColor(hex: string, percent: number): string {
  return lightenColorHex(hex, percent);
}

/** Darken a hex color by a percentage, returns hex string */
export function darkenColor(hex: string, percent: number): string {
  return darkenColorHex(hex, percent);
}
