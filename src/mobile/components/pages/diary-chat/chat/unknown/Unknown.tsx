import { localize } from '@/nls';
import { DiaryChat } from '@/mobile/test.id';
import { cx, styles } from '@/mobile/styles/ui';
import { FileQuestion } from 'lucide-react';
import React from 'react';

interface UnknownAttachmentMessageProps {
  kind: 'entry' | 'attachment';
  align?: 'left' | 'right';
}

export function UnknownAttachmentMessage({ kind, align }: UnknownAttachmentMessageProps) {
  const isEntry = kind === 'entry';
  return (
    <div
      className={cx(
        styles.UnknownAttachmentMessage.Root,
        align === 'left' && styles.ChatMessage.BubbleTailLeft,
      )}
      data-test-id={isEntry ? DiaryChat.unknownEntryMessage : DiaryChat.unknownAttachmentMessage}
    >
      <span className={styles.UnknownAttachmentMessage.Icon}>
        <FileQuestion size={20} strokeWidth={1.8} />
      </span>
      <span className={styles.UnknownAttachmentMessage.Body}>
        <span className={styles.UnknownAttachmentMessage.Title}>
          {isEntry
            ? localize('diary.unknownEntry', 'Unsupported record')
            : localize('diary.unknownAttachment', 'Unsupported attachment')}
        </span>
        <span className={styles.UnknownAttachmentMessage.Description}>
          {isEntry
            ? localize('diary.unknownEntryUpgrade', 'Update Islet to view this record.')
            : localize('diary.unknownAttachmentUpgrade', 'Update Islet to view this attachment.')}
        </span>
      </span>
    </div>
  );
}
