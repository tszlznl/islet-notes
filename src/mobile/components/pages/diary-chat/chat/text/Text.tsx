import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import { parseMessageLinks } from '@/base/just-vibes/message-links';
import { useService } from '@/hooks/use-service';
import { usePreference } from '@/mobile/hooks/usePreference';
import { useEntryLongPressActions } from '@/mobile/hooks/useEntryLongPressActions';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { localize } from '@/nls';
import { IDiaryService } from '@/services/diary/common/diaryService';
import { IHostService } from '@/services/native/common/hostService';
import { MessageLinkDetectionPreference } from '@/services/preferences/common/appPreferences';
import React, { useMemo } from 'react';
import { TextMessageQuote } from './TextMessageQuote';

interface TextMessageProps {
  entryId: string;
  text: string | undefined;
  replyToEntryId?: string;
  align?: 'left' | 'right';
}

export function TextMessage({ entryId, text, replyToEntryId, align }: TextMessageProps) {
  const diaryService = useService(IDiaryService);
  const hostService = useService(IHostService);
  const [messageLinkDetection] = usePreference(MessageLinkDetectionPreference);
  const content = text ?? '';
  const contentSegments = useMemo(
    () =>
      messageLinkDetection
        ? parseMessageLinks(content)
        : [{ type: 'text' as const, text: content }],
    [content, messageLinkDetection],
  );
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
      {replyToEntryId && (
        <TextMessageQuote entryId={entryId} replyToEntryId={replyToEntryId} align={align} />
      )}
      {contentSegments.map((segment, index) =>
        segment.type === 'link' ? (
          <a
            key={index}
            className={styles.TextMessage.Link}
            href={segment.href}
            target='_blank'
            rel='noopener noreferrer'
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void hostService.openExternalUrl(segment.href);
            }}
          >
            {segment.text}
          </a>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        ),
      )}
      <EntryHighlightOverlay active={highlighted} tail />
    </div>
  );
}
