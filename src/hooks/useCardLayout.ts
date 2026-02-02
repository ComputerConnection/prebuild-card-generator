/**
 * useCardLayout - Hook for building card layouts
 *
 * This hook provides a bridge between the component props and the
 * unified layout system.
 */

import { useMemo } from 'react';
import type { PrebuildConfig, CardSize, BrandIcon } from '../types';
import { getThemeColors } from '../types';
import { buildCardLayout } from '../utils/layoutBuilders';
import { CardLayout, LayoutBuilderContext, resetElementIdCounter } from '../utils/layoutSchema';

interface UseCardLayoutOptions {
  config: PrebuildConfig;
  cardSize: CardSize;
  brandIcons: BrandIcon[];
  qrCodeImage?: string;
  barcodeImage?: string;
}

interface UseCardLayoutResult {
  layout: CardLayout;
  context: LayoutBuilderContext;
}

/**
 * Build a card layout from config
 *
 * The layout is memoized and only rebuilds when inputs change.
 */
export function useCardLayout(options: UseCardLayoutOptions): UseCardLayoutResult {
  const { config, cardSize, brandIcons, qrCodeImage, barcodeImage } = options;

  const colors = useMemo(() => getThemeColors(config), [config]);

  const context: LayoutBuilderContext = useMemo(
    () => ({
      config,
      cardSize,
      colors,
      brandIcons,
      asyncData: {
        qrCodeImage,
        barcodeImage,
      },
    }),
    [config, cardSize, colors, brandIcons, qrCodeImage, barcodeImage]
  );

  const layout = useMemo(() => {
    // Reset ID counter for consistent IDs
    resetElementIdCounter();
    return buildCardLayout(context);
  }, [context]);

  return { layout, context };
}

export default useCardLayout;
