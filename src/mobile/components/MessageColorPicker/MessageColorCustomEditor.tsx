import { parseMessageBackground } from '@/base/just-vibes/message-color';
import { styles } from '@/mobile/styles/ui';
import { MessageColorUI } from '@/mobile/test.id';
import { localize } from '@/nls';
import React, { useId } from 'react';

interface MessageColorCustomEditorProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/** 输入时实时预览；失焦后才保存，非法值保留草稿但应用默认背景。 */
export function MessageColorCustomEditor({
  value,
  disabled,
  onChange,
  onBlur,
}: MessageColorCustomEditorProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const parsed = parseMessageBackground(value);

  return (
    <section className={styles.MessageColorPicker.Editor} aria-disabled={disabled}>
      <textarea
        id={inputId}
        className={styles.MessageColorPicker.CustomInput}
        data-test-id={MessageColorUI.customInput}
        value={value}
        disabled={disabled}
        spellCheck={false}
        autoCapitalize='none'
        autoCorrect='off'
        placeholder={localize(
          'messageColor.customCssPlaceholder',
          '#95ec69 or linear-gradient(135deg, #9ec9ff, #b3aef7)',
        )}
        aria-invalid={!parsed}
        aria-describedby={parsed ? undefined : errorId}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {!parsed && (
        <p
          id={errorId}
          className={styles.MessageColorPicker.CustomError}
          data-test-id={MessageColorUI.customError}
          role='alert'
        >
          {localize(
            'messageColor.customCssInvalid',
            'Enter a valid CSS color or a single linear-gradient(). The default is applied.',
          )}
        </p>
      )}
    </section>
  );
}
