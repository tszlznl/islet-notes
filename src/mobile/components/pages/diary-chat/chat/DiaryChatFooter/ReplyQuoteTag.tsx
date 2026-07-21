import { getEntryQuote } from '@/core/diary/selectors';
import type { DiaryModelData } from '@/core/diary/type';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { X } from 'lucide-react';
import React from 'react';

interface ReplyQuoteTagProps {
  model: DiaryModelData;
  replyToEntryId: string;
  onRemove: () => void;
}

/** 输入框上方的引用预览 tag，点 X 取消引用。 */
export function ReplyQuoteTag({ model, replyToEntryId, onRemove }: ReplyQuoteTagProps) {
  const quote = getEntryQuote(model, replyToEntryId);
  const text = quote
    ? `${quote.senderName}: ${quote.summary}`
    : localize('diary.reply.unavailable', 'Original message unavailable');
  return (
    <div className={styles.DiaryChatFooter.IdentityTagRow}>
      <span className={styles.DiaryChatFooter.IdentityTag} data-test-id={DiaryChat.replyTag}>
        <span className={styles.DiaryChatFooter.IdentityTagName}>{text}</span>
        <button
          type='button'
          className={styles.DiaryChatFooter.IdentityTagRemove}
          aria-label={localize('diary.reply.tagRemove', 'Clear quote')}
          data-test-id={DiaryChat.replyTagRemove}
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      </span>
    </div>
  );
}
