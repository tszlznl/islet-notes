import type { CSSProperties } from 'react';

export type MessageColorTheme = 'light' | 'dark';
export type MessageTextColor = 'auto' | 'black' | 'white';

export interface CssMessageColor {
  type: 'css';
  value: string;
  theme: MessageColorTheme;
  textColor: MessageTextColor;
}

export interface MessageColorPresentation {
  className?: string;
  style?: CSSProperties;
}

export interface MessageBackgroundValue {
  type: 'color' | 'linear-gradient';
  value: string;
}
