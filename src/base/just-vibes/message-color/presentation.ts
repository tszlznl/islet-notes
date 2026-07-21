import type { CSSProperties } from 'react';
import { getMessageForeground } from './foreground';
import type { CssMessageColor, MessageColorPresentation, MessageTextColor } from './types';
import { parseMessageBackground } from './validation';

/** 未知或非法存储值安全返回 undefined；当前只识别 type=css。 */
export function resolveMessageColor(raw: unknown): CssMessageColor | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const { type, value, theme, textColor = 'auto' } = raw as Partial<CssMessageColor>;
  if (type !== 'css' || typeof value !== 'string' || (theme !== 'light' && theme !== 'dark')) {
    return undefined;
  }
  if (!isMessageTextColor(textColor)) return undefined;
  const background = parseMessageBackground(value);
  return background ? { type, value: background.value, theme, textColor } : undefined;
}

/** 生成消息行容器所需变量；CSS 选择器负责只在匹配主题中应用背景。 */
export function getMessagePresentation(
  style: CssMessageColor | undefined,
): MessageColorPresentation | undefined {
  if (!style) return undefined;
  const background = parseMessageBackground(style.value);
  if (!background) return undefined;

  return {
    className: `message-color-theme-${style.theme}`,
    style: {
      '--message-css-background': background.value,
      '--message-css-foreground': resolveTextColor(style.textColor, background.value),
    } as CSSProperties,
  };
}

function isMessageTextColor(value: unknown): value is MessageTextColor {
  return value === 'auto' || value === 'black' || value === 'white';
}

function resolveTextColor(textColor: MessageTextColor, background: string): string {
  if (textColor === 'black') return '#000000';
  if (textColor === 'white') return '#ffffff';
  return getMessageForeground(background) ?? '#ffffff';
}
