import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import { useService } from '@/hooks/use-service';
import { useEntryLongPressActions } from '@/mobile/hooks/useEntryLongPressActions';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import React from 'react';

interface TextMessageProps {
  entryId: string;
  text: string | undefined;
  align?: 'left' | 'right';
}

export function TextMessage({ entryId, text, align }: TextMessageProps) {
  const diaryService = useService(IDiaryService);
  const content = text ?? '';
  const highlighted = useIsEntryHighlighted(entryId);
  const { anchorRef, longPressEvents } = useEntryLongPressActions<HTMLDivElement>(entryId, {
    text: content,
    enabled: !!content,
    editText: {
      title: localize('diary.editTextEntry', 'Edit text'),
      value: content,
      onSave: (nextText) => {
        if (nextText !== content.trim()) {
          diaryService.updateTextEntry(entryId, nextText);
        }
      },
    },
  });

  return (
    <div
      ref={anchorRef}
      className={align === 'left' ? styles.TextMessage.RootLeft : styles.TextMessage.Root}
      data-test-id={DiaryChat.textMessage}
      {...longPressEvents}
    >
      {content}
      <EntryHighlightOverlay active={highlighted} tail />
    </div>
  );
}
