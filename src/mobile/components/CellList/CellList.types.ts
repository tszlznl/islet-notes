// @islet-import-scope same-dir

import type { ReactNode } from 'react';

export type CellListItemRight =
  /** 右侧灰色文字(版本号、URL、名字) */
  | { type: 'value'; text: string }
  /** 右侧图片(头像、封面);无 url 时渲染占位图标 */
  | { type: 'image'; url?: string; testId?: string }
  /** 右侧首字符占位块(传字符串,取首字符大写) */
  | { type: 'initial'; text: string; testId?: string };

interface CellItem {
  /** 标准行(默认) */
  type?: 'cell';
  /** 缺省用 label 作为 key */
  key?: string;
  hide?: boolean;
  icon?: ReactNode;
  label: string;
  right?: CellListItemRight;
  testId?: string;
  /** 有则渲染 chevron 与按压态;无则为纯展示行 */
  onClick?: () => void;
  disabled?: boolean;
}

interface OptionItem {
  /** 单选项行:selected 时显示对勾;可点击但不渲染 chevron */
  type: 'option';
  key?: string;
  hide?: boolean;
  label: string;
  selected?: boolean;
  testId?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface ActionItem {
  /** 居中操作行(退出体验模式、关闭同步) */
  type: 'action';
  key?: string;
  hide?: boolean;
  label: string;
  danger?: boolean;
  testId?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface SwitchItem {
  /** 布尔开关行，使用原生 checkbox 语义。 */
  type: 'switch';
  key?: string;
  hide?: boolean;
  label: string;
  checked: boolean;
  testId?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export type CellListItem = CellItem | OptionItem | ActionItem | SwitchItem;
