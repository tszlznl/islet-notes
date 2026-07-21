import type { ImageAttachmentRecord } from '@/core/diary/type';
import React from 'react';
import { AudioMessage } from './audio/AudioMessage';
import { ImageMessage } from './image/main';
import { TextMessage } from './text/main';
import { UnknownAttachmentMessage } from './unknown/main';
import { UploadMessage } from './upload/main';
import { VideoMessage } from './video/main';
import type { ResolvedChatItem } from './utils';

export interface MessageBodyProps {
  resolved: Exclude<ResolvedChatItem, { type: 'divider' }>;
  previewAttachments: ImageAttachmentRecord[];
  /** 气泡小尾巴方向，默认右侧；左侧身份消息传 'left'。 */
  align?: 'left' | 'right';
}

export function MessageBody({ resolved, previewAttachments, align }: MessageBodyProps) {
  switch (resolved.type) {
    case 'text':
      return (
        <TextMessage
          entryId={resolved.entry.id}
          text={resolved.text}
          replyToEntryId={resolved.entry.replyToEntryId}
          align={align}
        />
      );
    case 'image':
      return (
        <ImageMessage
          entryId={resolved.entry.id}
          attachment={resolved.attachment}
          previewAttachments={previewAttachments}
        />
      );
    case 'audio':
      return (
        <AudioMessage
          entryId={resolved.entry.id}
          attachment={resolved.attachment}
          transcript={resolved.entry.text}
          align={align}
        />
      );
    case 'video':
      return <VideoMessage entryId={resolved.entry.id} attachment={resolved.attachment} />;
    case 'upload':
      return <UploadMessage task={resolved.task} align={align} />;
    case 'unknown':
      return <UnknownAttachmentMessage kind={resolved.kind} align={align} />;
  }
}
