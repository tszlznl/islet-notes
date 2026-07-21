import { getIdentityById } from '@/core/diary/selectors';
import type { DiaryModelData, ImageAttachmentRecord } from '@/core/diary/type';
import { IdentityAvatar } from '@/mobile/components/IdentityAvatar';
import { UserAvatar } from '@/mobile/components/UserAvatar';
import { DiaryChat } from '@/mobile/test.id';
import { getMessagePresentation, resolveMessageColor } from '@/base/just-vibes/message-color';
import { cx, styles } from '@/mobile/styles/ui';
import React, { type CSSProperties } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { DividerMessage } from './divider/main';
import { MessageBody } from './MessageBody';
import { resolveChatItem, type DiaryChatItem } from './utils';

export interface ChatMessageData {
  items: DiaryChatItem[];
  model: DiaryModelData;
  previewAttachments: ImageAttachmentRecord[];
}

export function ChatMessage({ index, style, data }: ListChildComponentProps<ChatMessageData>) {
  const item = data.items[index];
  const rowStyle: CSSProperties = { ...style, width: '100%' };
  const resolved = resolveChatItem(item, data.model);

  if (resolved.type === 'divider') {
    return <DividerMessage timestamp={resolved.timestamp} style={rowStyle} />;
  }

  // 带身份的消息按身份渲染头像与左右位置（含已归档身份的历史消息）；无身份维持现状。
  const identityId =
    item.kind === 'entry'
      ? item.entry.identityId
      : item.kind === 'upload'
        ? item.task.identityId
        : undefined;
  const identity = identityId ? getIdentityById(data.model, identityId) : undefined;
  const alignLeft = identity?.messagePosition === 'left';
  // 身份消息用身份的消息颜色，本人消息用 profile 的；未知 type 或主题不匹配时兜底默认气泡。
  const messageColor = resolveMessageColor(
    identity ? identity.messageColor : data.model.profile.messageColor,
  );
  const bubble = getMessagePresentation(messageColor);
  if (bubble?.style) {
    Object.assign(rowStyle, bubble.style);
  }
  const avatar = identity ? (
    <IdentityAvatar
      model={data.model}
      identity={identity}
      size={36}
      testId={DiaryChat.identityAvatar}
    />
  ) : (
    <UserAvatar size={36} />
  );

  if (alignLeft) {
    return (
      <div
        className={cx(styles.ChatMessage.RowLeft, bubble?.className)}
        data-test-id={DiaryChat.row}
        style={rowStyle}
      >
        {avatar}
        <MessageBody
          resolved={resolved}
          previewAttachments={data.previewAttachments}
          align='left'
        />
      </div>
    );
  }

  return (
    <div
      className={cx(styles.ChatMessage.RowRight, bubble?.className)}
      data-test-id={DiaryChat.row}
      style={rowStyle}
    >
      <MessageBody resolved={resolved} previewAttachments={data.previewAttachments} />
      {avatar}
    </div>
  );
}
