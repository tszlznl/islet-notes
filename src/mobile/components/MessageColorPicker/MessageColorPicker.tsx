import { getResolvedTheme, type ResolvedTheme } from '@/base/browser/initializeTheme';
import type { MessageColor, KnownMessageColor } from '@/core/diary/type';
import {
  DEFAULT_MESSAGE_BACKGROUND,
  getMessageQuickFillValues,
  type MessageTextColor,
  parseMessageBackground,
  resolveMessageColor,
} from '@/base/just-vibes/message-color';
import { CellListGroup } from '@/mobile/components/CellList';
import { styles } from '@/mobile/styles/ui';
import { MessageColorUI } from '@/mobile/test.id';
import { localize } from '@/nls';
import React, { useEffect, useRef, useState } from 'react';
import { MessageColorCustomEditor } from './MessageColorCustomEditor';
import { MessageColorPreview } from './MessageColorPreview';
import { MessageColorSwatch } from './MessageColorSwatch';

interface MessageColorPickerProps {
  value: MessageColor | undefined;
  /** 会员才能选择非默认样式；非会员点击非默认项时回调（通常跳转购买页）。 */
  vipEnabled: boolean;
  /** 会员状态加载中时禁用非默认项，避免把会员误跳到购买页。 */
  vipLoading?: boolean;
  onVipRequired: () => void;
  /** 当前只写入 type=css；undefined 仅用于兼容未设置的历史数据。 */
  onChange: (style: KnownMessageColor | undefined) => void;
}

export function MessageColorPicker({
  value,
  vipEnabled,
  vipLoading,
  onVipRequired,
  onChange,
}: MessageColorPickerProps) {
  const theme = useCurrentTheme();
  const quickFillValues = getMessageQuickFillValues(theme);
  const [current, setCurrent] = useState<KnownMessageColor | undefined>(() =>
    resolveMessageColorForTheme(value, theme),
  );
  const [selectedTextColor, setSelectedTextColor] = useState<MessageTextColor>(
    () => resolveMessageColorForTheme(value, theme)?.textColor ?? 'auto',
  );
  const [draft, setDraft] = useState(() => current?.value ?? DEFAULT_MESSAGE_BACKGROUND[theme]);
  const valueRef = useRef(value);
  const expectedExternalValueKeyRef = useRef<string | undefined>(undefined);
  valueRef.current = value;
  const externalValueKey = getMessageColorStateKey(value, theme);

  // 云同步或其他页面更新值时刷新；key 避免无关模型更新重置非法但尚在编辑的草稿。
  useEffect(() => {
    const expectedKey = expectedExternalValueKeyRef.current;
    expectedExternalValueKeyRef.current = undefined;
    if (expectedKey === externalValueKey) return;
    const next = resolveMessageColorForTheme(valueRef.current, theme);
    setCurrent(next);
    setSelectedTextColor(next?.textColor ?? 'auto');
    setDraft(next?.value ?? DEFAULT_MESSAGE_BACKGROUND[theme]);
  }, [externalValueKey, theme]);

  const requireVip = (): boolean => {
    if (vipEnabled) return false;
    if (!vipLoading) onVipRequired();
    return true;
  };

  const buildStyle = (value: string): KnownMessageColor | undefined => {
    const parsed = parseMessageBackground(value);
    if (!parsed) return undefined;
    return {
      type: 'css',
      value: parsed.value,
      theme,
      textColor: selectedTextColor,
    };
  };

  const emitChange = (style: KnownMessageColor | undefined) => {
    expectedExternalValueKeyRef.current = getMessageColorStateKey(style, theme);
    onChange(style);
  };

  const applyBackground = (value: string) => {
    if (requireVip()) return;
    const style = buildStyle(value);
    if (!style) return;
    setDraft(style.value);
    setCurrent(style);
    emitChange(style);
  };

  const previewBackground = (value: string) => {
    setDraft(value);
    setCurrent(buildStyle(value));
  };

  const saveBackground = (value: string) => {
    const style = buildStyle(value);
    setCurrent(style);
    emitChange(style);
  };

  const applyTextColor = (nextTextColor: MessageTextColor) => {
    if (requireVip()) return;
    const style: KnownMessageColor = {
      type: 'css',
      value: current?.value ?? DEFAULT_MESSAGE_BACKGROUND[theme],
      theme,
      textColor: nextTextColor,
    };
    setDraft(style.value);
    setCurrent(style);
    setSelectedTextColor(nextTextColor);
    emitChange(style);
  };

  return (
    <div className={styles.Cell.GroupStack}>
      <MessageColorPreview background={current} />
      <div>
        <h2 className={styles.CellList.GroupTitle}>
          {localize('messageColor.quickFill', 'Quick fill')}
        </h2>
        <section className={styles.MessageColorPicker.QuickFillSection}>
          <div className={styles.MessageColorPicker.SwatchGrid}>
            {quickFillValues.map((background, index) => (
              <MessageColorSwatch
                key={background}
                background={background}
                label={getQuickFillLabel(index)}
                selected={
                  (current?.value ?? DEFAULT_MESSAGE_BACKGROUND[theme]).toLowerCase() === background
                }
                testId={`${MessageColorUI.swatchPrefix}${index}`}
                disabled={vipLoading}
                onClick={() => applyBackground(background)}
              />
            ))}
          </div>
        </section>
      </div>
      <div>
        <h2 className={styles.CellList.GroupTitle}>
          {localize('messageColor.cssLabel', 'CSS background')}
        </h2>
        <MessageColorCustomEditor
          value={draft}
          disabled={!vipEnabled || !!vipLoading}
          onChange={previewBackground}
          onBlur={() => saveBackground(draft)}
        />
        <p className={styles.MessageColorPicker.CombinedHint}>{getThemeHint(theme)}</p>
      </div>
      <CellListGroup
        className={styles.MessageColorPicker.TextColorGroup}
        title={localize('messageColor.textColor', 'Text color')}
        items={(['auto', 'black', 'white'] as const).map((textColor) => ({
          type: 'option' as const,
          key: textColor,
          label: getTextColorLabel(textColor),
          selected: selectedTextColor === textColor,
          testId: `${MessageColorUI.textColorPrefix}${textColor}`,
          disabled: !!vipLoading,
          onClick: () => applyTextColor(textColor),
        }))}
      />
    </div>
  );
}

/** 以已应用到 DOM 的主题为准；系统主题在页面停留期间变化时同步更新。 */
function useCurrentTheme(): ResolvedTheme {
  const [theme, setTheme] = useState(readCurrentTheme);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setTheme(readCurrentTheme()));
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function readCurrentTheme(): ResolvedTheme {
  const applied = document.documentElement.dataset.theme;
  return applied === 'light' || applied === 'dark' ? applied : getResolvedTheme();
}

function resolveMessageColorForTheme(
  style: MessageColor | undefined,
  theme: ResolvedTheme,
): KnownMessageColor | undefined {
  const resolved = resolveMessageColor(style);
  return resolved?.theme === theme ? resolved : undefined;
}

function getMessageColorStateKey(style: MessageColor | undefined, theme: ResolvedTheme): string {
  const resolved = resolveMessageColorForTheme(style, theme);
  return resolved
    ? `${resolved.theme}:${resolved.value}:${resolved.textColor}`
    : `default:${theme}`;
}

function getQuickFillLabel(index: number): string {
  switch (index) {
    case 0:
      return localize('messageColor.quickFillGreen', 'Green');
    case 1:
      return localize('messageColor.quickFillSky', 'Sky blue');
    case 2:
      return localize('messageColor.quickFillPink', 'Pink');
    case 3:
      return localize('messageColor.quickFillPurple', 'Purple');
    case 4:
      return localize('messageColor.quickFillApricot', 'Apricot');
    case 5:
      return localize('messageColor.quickFillLemon', 'Lemon');
    case 6:
      return localize('messageColor.quickFillGray', 'Gray');
    default:
      return localize('messageColor.quickFillGraphite', 'Graphite');
  }
}

function getTextColorLabel(value: MessageTextColor): string {
  switch (value) {
    case 'auto':
      return localize('messageColor.textColorAuto', 'Auto');
    case 'black':
      return localize('messageColor.textColorBlack', 'Black');
    case 'white':
      return localize('messageColor.textColorWhite', 'White');
  }
}

function getThemeHint(theme: ResolvedTheme): string {
  return theme === 'dark'
    ? localize(
        'messageColor.darkThemeHint',
        'Only applies to the current dark theme; supports CSS colors and gradients',
      )
    : localize(
        'messageColor.lightThemeHint',
        'Only applies to the current light theme; supports CSS colors and gradients',
      );
}
