/**
 * HTML Renderer - Renders CardLayout to React elements
 *
 * This renderer takes a declarative CardLayout and produces
 * React/JSX elements for the CardPreview component.
 */

import React from 'react';
import {
  CardLayout,
  LayoutElement,
  HeaderElement,
  TextElement,
  BadgeRowElement,
  ImageElement,
  PriceElement,
  FinancingElement,
  SpecsElement,
  InfoBarElement,
  BarcodeElement,
  QRCodeElement,
  SKUElement,
  FooterAccentElement,
} from './layoutSchema';
import { formatPrice } from '../types';

// ============================================================================
// SCALE CONFIGURATION
// ============================================================================

/**
 * Scale factors for converting layout units to pixels.
 * These are tuned to make the preview match PDF output as closely as possible.
 */
interface ScaleFactors {
  /** Font size multiplier (PDF pt to preview px) */
  font: number;
  /** Inch to pixel multiplier for dimensions */
  inch: number;
}

const DEFAULT_SCALE: ScaleFactors = {
  font: 0.65,  // PDF fonts are in points, preview needs smaller
  inch: 40,    // 1 inch = 40px in preview (roughly)
};

// ============================================================================
// ELEMENT RENDERERS
// ============================================================================

function renderHeader(el: HeaderElement, scale: ScaleFactors): React.ReactNode {
  return (
    <div
      key={el.id}
      className="relative"
      style={{
        backgroundColor: el.style.backgroundColor,
        padding: `${el.style.height * scale.inch * 0.15}px ${scale.inch * 0.1}px`,
      }}
    >
      <p
        className="text-center font-bold truncate"
        style={{
          color: el.style.textColor,
          fontSize: `${el.style.fontSize * scale.font}px`,
        }}
      >
        {el.text}
      </p>
      {el.style.accentHeight && el.style.accentHeight > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${el.style.accentHeight * scale.inch}px`,
            backgroundColor: el.style.accentColor || el.style.backgroundColor,
          }}
        />
      )}
    </div>
  );
}

function renderText(el: TextElement, scale: ScaleFactors): React.ReactNode {
  const style: React.CSSProperties = {
    fontSize: `${el.style.fontSize * scale.font}px`,
    fontWeight: el.style.fontWeight,
    fontStyle: el.style.fontStyle || 'normal',
    color: el.style.color,
    textAlign: el.style.align,
  };

  const className = el.maxLines
    ? `line-clamp-${el.maxLines}`
    : '';

  if (el.strikethrough) {
    return (
      <p key={el.id} className={`line-through ${className}`} style={style}>
        {el.text}
      </p>
    );
  }

  return (
    <p key={el.id} className={className} style={style}>
      {el.text}
    </p>
  );
}

function renderBadgeRow(el: BadgeRowElement, scale: ScaleFactors): React.ReactNode {
  const justifyClass =
    el.align === 'left' ? 'justify-start' :
    el.align === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div
      key={el.id}
      className={`flex flex-wrap ${justifyClass} gap-1 my-0.5`}
    >
      {el.badges.map((badge, i) => (
        <span
          key={i}
          className="font-medium"
          style={{
            backgroundColor: badge.backgroundColor,
            color: badge.textColor,
            fontSize: `${el.style.fontSize * scale.font}px`,
            padding: `${el.style.paddingY * scale.inch}px ${el.style.paddingX * scale.inch}px`,
            borderRadius: `${el.style.borderRadius * scale.inch}px`,
          }}
        >
          {badge.text}
        </span>
      ))}
    </div>
  );
}

function renderImage(el: ImageElement, scale: ScaleFactors): React.ReactNode {
  return (
    <img
      key={el.id}
      src={el.src}
      alt={el.alt}
      className="mx-auto object-contain my-0.5"
      style={{
        maxWidth: `${el.size.width * scale.inch}px`,
        maxHeight: `${el.size.height * scale.inch}px`,
      }}
    />
  );
}

function renderPrice(el: PriceElement, scale: ScaleFactors): React.ReactNode {
  const boxStyle: React.CSSProperties = el.style.showBox
    ? {
        backgroundColor: el.style.boxColor,
        borderRadius: `${(el.style.boxRadius || 0.06) * scale.inch}px`,
        padding: `${scale.inch * 0.05}px ${scale.inch * 0.1}px`,
        margin: '0.25rem 0',
      }
    : {};

  return (
    <div key={el.id} className="text-center" style={boxStyle}>
      {el.showStrikethrough && el.originalPrice && el.originalPrice > 0 && (
        <p
          className="line-through"
          style={{
            fontSize: `${el.style.strikeFontSize * scale.font}px`,
            color: el.style.strikeColor,
          }}
        >
          {formatPrice(el.originalPrice)}
        </p>
      )}
      <p
        className="font-bold"
        style={{
          fontSize: `${el.style.mainFontSize * scale.font}px`,
          color: el.style.priceColor,
        }}
      >
        {formatPrice(el.currentPrice)}
      </p>
    </div>
  );
}

function renderFinancing(el: FinancingElement, scale: ScaleFactors): React.ReactNode {
  let text = `As low as $${el.monthlyAmount}/mo for ${el.months} months`;
  if (el.showApr && el.apr > 0) {
    text += ` @ ${el.apr}% APR`;
  }

  return (
    <p
      key={el.id}
      className="text-center"
      style={{
        fontSize: `${el.style.fontSize * scale.font}px`,
        color: el.style.color,
      }}
    >
      {text}
    </p>
  );
}

function renderSpecs(el: SpecsElement, scale: ScaleFactors): React.ReactNode {
  const containerStyle: React.CSSProperties = {
    backgroundColor: el.style.backgroundColor,
    borderRadius: el.style.borderRadius ? `${el.style.borderRadius * scale.inch}px` : undefined,
    padding: el.style.padding ? `${el.style.padding * scale.inch}px` : undefined,
    position: 'relative',
  };

  const gridClass = el.layout === 'two-column'
    ? 'grid grid-cols-2 gap-x-1 gap-y-0.5'
    : 'space-y-0.5';

  // Split specs for two-column layout
  const leftSpecs = el.layout === 'two-column'
    ? el.specs.slice(0, 4)
    : el.specs;
  const rightSpecs = el.layout === 'two-column'
    ? el.specs.slice(4)
    : [];

  const renderSpecItem = (spec: typeof el.specs[0]) => (
    <div key={spec.key}>
      <p
        className="font-bold leading-tight"
        style={{
          fontSize: `${el.style.labelFontSize * scale.font}px`,
          color: el.style.labelColor,
        }}
      >
        {spec.label.toUpperCase()}
      </p>
      <div className="flex items-center gap-0.5">
        {spec.brandIcon && (
          <img
            src={spec.brandIcon.src}
            alt={spec.brandIcon.name}
            className="flex-shrink-0 object-contain"
            style={{
              width: `${el.style.iconSize * scale.inch}px`,
              height: `${el.style.iconSize * scale.inch}px`,
            }}
          />
        )}
        <p
          className="truncate leading-tight"
          style={{
            fontSize: `${el.style.valueFontSize * scale.font}px`,
            color: el.style.valueColor,
          }}
        >
          {spec.value}
        </p>
      </div>
    </div>
  );

  return (
    <div key={el.id} className="flex-1 relative my-0.5" style={containerStyle}>
      {/* Left accent bar */}
      {el.style.accentWidth && el.style.accentWidth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 rounded-l"
          style={{
            width: `${el.style.accentWidth * scale.inch}px`,
            backgroundColor: el.style.accentColor,
          }}
        />
      )}
      <div
        className={gridClass}
        style={{
          paddingLeft: el.style.accentWidth ? `${el.style.accentWidth * scale.inch + 2}px` : undefined,
        }}
      >
        {el.layout === 'two-column' ? (
          <>
            <div className="space-y-0.5">
              {leftSpecs.map(renderSpecItem)}
            </div>
            <div className="space-y-0.5">
              {rightSpecs.map(renderSpecItem)}
            </div>
          </>
        ) : (
          leftSpecs.map(renderSpecItem)
        )}
      </div>
    </div>
  );
}

function renderInfoBar(el: InfoBarElement, scale: ScaleFactors): React.ReactNode {
  return (
    <div
      key={el.id}
      className="grid text-center my-0.5"
      style={{
        backgroundColor: el.style.backgroundColor,
        borderRadius: `${el.style.borderRadius * scale.inch}px`,
        padding: `${scale.inch * 0.03}px`,
        gridTemplateColumns: `repeat(${el.items.length}, 1fr)`,
      }}
    >
      {el.items.map((item, i) => (
        <div key={i}>
          <p
            className="font-bold leading-tight"
            style={{
              fontSize: `${el.style.labelFontSize * scale.font}px`,
              color: el.style.labelColor,
            }}
          >
            {item.label}
          </p>
          <p
            className="truncate leading-tight"
            style={{
              fontSize: `${el.style.valueFontSize * scale.font}px`,
              color: el.style.valueColor,
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function renderBarcode(el: BarcodeElement, scale: ScaleFactors, barcodeImage?: string): React.ReactNode {
  if (!barcodeImage) return null;
  return (
    <div key={el.id} className="flex justify-center my-0.5">
      <img
        src={barcodeImage}
        alt="Barcode"
        style={{
          height: `${el.size.height * scale.inch}px`,
        }}
      />
    </div>
  );
}

function renderQRCode(el: QRCodeElement, scale: ScaleFactors, qrImage?: string): React.ReactNode {
  if (!qrImage) return null;
  return (
    <img
      key={el.id}
      src={qrImage}
      alt="QR Code"
      className="mx-auto"
      style={{
        width: `${el.size * scale.inch}px`,
        height: `${el.size * scale.inch}px`,
      }}
    />
  );
}

function renderSKU(el: SKUElement, scale: ScaleFactors): React.ReactNode {
  return (
    <p
      key={el.id}
      style={{
        fontSize: `${el.style.fontSize * scale.font}px`,
        color: el.style.color,
        textAlign: el.style.align,
      }}
    >
      SKU: {el.value}
    </p>
  );
}

function renderFooterAccent(el: FooterAccentElement, scale: ScaleFactors): React.ReactNode {
  return (
    <div
      key={el.id}
      className="absolute bottom-0 left-0 right-0"
      style={{
        height: `${el.style.height * scale.inch}px`,
        backgroundColor: el.style.primaryColor,
      }}
    >
      {el.style.accentColor && el.style.accentHeight && (
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: `${el.style.accentHeight * scale.inch}px`,
            backgroundColor: el.style.accentColor,
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// ELEMENT DISPATCHER
// ============================================================================

interface RenderContext {
  qrCodeImage?: string;
  barcodeImage?: string;
  scale: ScaleFactors;
}

function renderElement(el: LayoutElement, ctx: RenderContext): React.ReactNode {
  if (!el.visible) return null;

  const { scale } = ctx;

  switch (el.type) {
    case 'header':
      return renderHeader(el, scale);
    case 'text':
      return renderText(el, scale);
    case 'badge-row':
      return renderBadgeRow(el, scale);
    case 'image':
      return renderImage(el, scale);
    case 'price':
      return renderPrice(el, scale);
    case 'financing':
      return renderFinancing(el, scale);
    case 'specs':
      return renderSpecs(el, scale);
    case 'info-bar':
      return renderInfoBar(el, scale);
    case 'barcode':
      return renderBarcode(el, scale, ctx.barcodeImage);
    case 'qrcode':
      return renderQRCode(el, scale, ctx.qrCodeImage);
    case 'sku':
      return renderSKU(el, scale);
    case 'footer-accent':
      return renderFooterAccent(el, scale);
    case 'badge':
    case 'divider':
    case 'container':
      // Not yet implemented - fallback to null
      return null;
    default:
      return null;
  }
}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

export interface RenderToHtmlOptions {
  qrCodeImage?: string;
  barcodeImage?: string;
  /** Custom scale factors for fine-tuning preview appearance */
  scale?: Partial<ScaleFactors>;
}

/**
 * Render a CardLayout to React elements
 */
export function renderLayoutToHtml(
  layout: CardLayout,
  options: RenderToHtmlOptions = {}
): React.ReactNode {
  // Merge custom scale with defaults
  const scale: ScaleFactors = {
    ...DEFAULT_SCALE,
    ...options.scale,
  };

  const ctx: RenderContext = {
    qrCodeImage: options.qrCodeImage,
    barcodeImage: options.barcodeImage,
    scale,
  };

  // Get background style
  const backgroundStyle: React.CSSProperties =
    layout.background.pattern && layout.background.pattern !== 'solid'
      ? {
          background: layout.background.pattern,
          backgroundSize: '20px 20px',
        }
      : { backgroundColor: layout.background.color };

  return (
    <div
      className="h-full flex flex-col overflow-hidden relative"
      style={{
        ...backgroundStyle,
        fontFamily: layout.fontFamily,
      }}
    >
      <div className="flex-1 flex flex-col">
        {layout.elements.map((el) => renderElement(el, ctx))}
      </div>
    </div>
  );
}

export default renderLayoutToHtml;
