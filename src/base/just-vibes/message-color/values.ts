import type { MessageColorTheme } from './types';

export const DEFAULT_MESSAGE_BACKGROUND: Record<MessageColorTheme, string> = {
  light: '#95ec69',
  dark: '#3eb575',
};

const OTHER_QUICK_FILL_VALUES = [
  '#a8cff0',
  '#f0c3d0',
  '#c8aee8',
  '#f5ce8e',
  '#ede08a',
  '#cfcfcf',
  '#4c4c4c',
] as const;

/** 第一个快捷色始终是当前主题的具体默认色，其他项是固定单色。 */
export function getMessageQuickFillValues(theme: MessageColorTheme): readonly string[] {
  return [DEFAULT_MESSAGE_BACKGROUND[theme], ...OTHER_QUICK_FILL_VALUES];
}
