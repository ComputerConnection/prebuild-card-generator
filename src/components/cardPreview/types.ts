import type React from 'react';
import {
  PrebuildConfig,
  ComponentCategory,
  BrandIcon,
  ThemeColors,
} from '../../types';

export interface CardLayoutProps {
  config: PrebuildConfig;
  colors: ThemeColors;
  brandIcons: BrandIcon[];
  qrCodeImage: string;
  barcodeImage: string;
  fontStyle: React.CSSProperties;
  backgroundStyle: React.CSSProperties;
  baseId: string;
  renderSpecWithIcon: (
    key: ComponentCategory,
    value: string,
    iconSize?: number,
    fontSize?: string
  ) => React.ReactNode;
}
