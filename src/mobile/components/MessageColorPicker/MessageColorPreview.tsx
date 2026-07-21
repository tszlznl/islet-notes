import type { KnownMessageColor } from '@/core/diary/type';
import { getMessagePresentation } from '@/base/just-vibes/message-color';
import { cx, styles } from '@/mobile/styles/ui';
import { MessageColorUI } from '@/mobile/test.id';
import { localize } from '@/nls';
import React from 'react';

interface MessageColorPreviewProps {
  background: KnownMessageColor | undefined;
}

/** 编辑页顶部只预览一条本人消息，并复用聊天消息的背景呈现变量。 */
export function MessageColorPreview({ background }: MessageColorPreviewProps) {
  const presentation = getMessagePresentation(background);
  return (
    <section
      className={cx(styles.MessageColorPicker.Preview, presentation?.className)}
      style={presentation?.style}
      data-test-id={MessageColorUI.preview}
    >
      <div className={styles.ChatMessage.RowRight}>
        <div className={styles.TextMessage.Root}>
          {localize('messageColor.previewMessage', 'This is a sent message')}
        </div>
      </div>
    </section>
  );
}
