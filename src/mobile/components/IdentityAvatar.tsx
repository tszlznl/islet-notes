import { getIdentityAvatarAttachment } from '@/core/diary/selectors';
import type { DiaryModelData, IdentityRecord } from '@/core/diary/type';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { cx, styles } from '@/mobile/styles/ui';
import React from 'react';

interface IdentityAvatarProps {
  model: DiaryModelData;
  identity: IdentityRecord;
  size: number;
  className?: string;
  testId?: string;
}

/** 身份头像：有图显示缩略图，无图显示昵称首字符占位。 */
export function IdentityAvatar({ model, identity, size, className, testId }: IdentityAvatarProps) {
  const candidate = getIdentityAvatarAttachment(model, identity);
  const attachment = candidate?.type === 'image' ? candidate : undefined;
  const url = useAttachmentThumbUrl(attachment, { role: 'avatar' });
  const style = { width: size, height: size };
  const rootClassName = cx(styles.UserAvatar.Root, className);

  if (url) {
    return (
      <img
        className={cx(rootClassName, styles.UserAvatar.ImageFit)}
        data-test-id={testId}
        src={url}
        alt=''
        style={style}
      />
    );
  }

  const initial = identity.name.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <span
      className={rootClassName}
      data-test-id={testId}
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      aria-hidden='true'
    >
      {initial}
    </span>
  );
}
