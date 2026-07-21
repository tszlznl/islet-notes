import { useTriggerEntryHighlight } from '@/base/just-vibes/entry-highlight';
import { getEntryQuote, isFutureEntry } from '@/core/diary/selectors';
import { useService } from '@/hooks/use-service';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import React from 'react';

interface TextMessageQuoteProps {
  /** 引用方（当前气泡）entry id，用于判断被引用消息是否还在同一日记本内可跳转。 */
  entryId: string;
  replyToEntryId: string;
  align?: 'left' | 'right';
}

/** 文字气泡内的引用块；点按定位并点亮被引用消息，原消息不可达时降级为占位文案。 */
export function TextMessageQuote({ entryId, replyToEntryId, align }: TextMessageQuoteProps) {
  const diaryService = useService(IDiaryService);
  const triggerEntryHighlight = useTriggerEntryHighlight();
  const model = diaryService.modelState;
  const quote = getEntryQuote(model, replyToEntryId);
  const entry = model.entryMap.get(entryId);
  const quoted = model.entryMap.get(replyToEntryId);
  const jumpable =
    !!entry &&
    !!quoted &&
    !quoted.deletedAt &&
    quoted.notebookId === entry.notebookId &&
    !isFutureEntry(quoted, Date.now());
  const text = quote
    ? `${quote.senderName}: ${quote.summary}`
    : localize('diary.reply.unavailable', 'Original message unavailable');

  return (
    <button
      type='button'
      className={align === 'left' ? styles.TextMessage.QuoteLeft : styles.TextMessage.Quote}
      data-test-id={DiaryChat.textMessageQuote}
      onClick={(event) => {
        event.stopPropagation();
        if (jumpable) triggerEntryHighlight?.(replyToEntryId);
      }}
    >
      {text}
    </button>
  );
}
