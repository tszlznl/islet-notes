import type { DiaryModelData } from '@/core/diary/type';
import { estimateAudioMessageHeight } from './audio/height';
import { estimateDividerHeight } from './divider/main';
import { estimateImageMessageHeight } from './image/main';
import { estimateTextMessageHeight } from './text/main';
import { estimateUnknownMessageHeight } from './unknown/main';
import { estimateUploadMessageHeight } from './upload/main';
import { estimateVideoMessageHeight } from './video/main';
import { resolveChatItem, type DiaryChatItem } from './utils';

export { EntryHighlightProvider } from '@/base/just-vibes/entry-highlight';
export { ChatMessage, type ChatMessageData } from './Message';
export type { DiaryChatItem, ResolvedChatItem } from './utils';

const DEFAULT_ITEM_HEIGHT = 64;

export function estimateDiaryChatItemHeight(
  item: DiaryChatItem | undefined,
  viewportWidth: number,
  model: DiaryModelData,
  isTranscribing?: (entryId: string) => boolean,
) {
  if (!item) return DEFAULT_ITEM_HEIGHT;
  const resolved = resolveChatItem(item, model);
  switch (resolved.type) {
    case 'divider':
      return estimateDividerHeight();
    case 'text':
      return estimateTextMessageHeight(
        resolved.text,
        viewportWidth,
        !!resolved.entry.replyToEntryId,
      );
    case 'image':
      return estimateImageMessageHeight(
        resolved.attachment.width,
        resolved.attachment.height,
        viewportWidth,
      );
    case 'audio':
      return estimateAudioMessageHeight(
        resolved.entry.text,
        viewportWidth,
        isTranscribing?.(resolved.entry.id),
      );
    case 'video':
      return estimateVideoMessageHeight(
        resolved.attachment.width,
        resolved.attachment.height,
        viewportWidth,
      );
    case 'upload':
      return estimateUploadMessageHeight(resolved.task, viewportWidth);
    case 'unknown':
      return estimateUnknownMessageHeight();
  }
}
