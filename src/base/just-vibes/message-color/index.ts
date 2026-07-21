// 消息气泡 CSS 背景的白名单校验、主题隔离、前景对比色与展示变量。
export { getMessageForeground } from './foreground';
export { getMessagePresentation, resolveMessageColor } from './presentation';
export type {
  CssMessageColor,
  MessageBackgroundValue,
  MessageColorPresentation,
  MessageColorTheme,
  MessageTextColor,
} from './types';
export { parseMessageBackground } from './validation';
export { DEFAULT_MESSAGE_BACKGROUND, getMessageQuickFillValues } from './values';
