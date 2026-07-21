import { getMessageForeground } from '@/base/just-vibes/message-color';
import { styles } from '@/mobile/styles/ui';
import { Check } from 'lucide-react';
import React from 'react';

interface MessageColorSwatchProps {
  background: string;
  label: string;
  selected: boolean;
  testId: string;
  disabled?: boolean;
  onClick: () => void;
}

/** 圆形色块：可访问名称不能只依赖颜色，选中态同时通过 aria-pressed 暴露。 */
export function MessageColorSwatch({
  background,
  label,
  selected,
  testId,
  disabled,
  onClick,
}: MessageColorSwatchProps) {
  return (
    <button
      type='button'
      className={styles.MessageColorPicker.Swatch}
      style={{ background, color: getMessageForeground(background) }}
      data-test-id={testId}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
    >
      {selected && <Check size={20} strokeWidth={2.2} aria-hidden='true' />}
    </button>
  );
}
