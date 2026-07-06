import type { DiaryModelData, IdentityRecord } from '@/core/diary/type';
import { IdentityAvatar } from '@/mobile/components/IdentityAvatar';
import { styles } from '@/mobile/styles/ui';
import React from 'react';

interface IdentityItemProps {
  model: DiaryModelData;
  identity: IdentityRecord;
  testId?: string;
  nameTestId?: string;
  onClick?: () => void;
  /** 行尾自定义内容（如已归档页的「取消归档」按钮）。 */
  trailing?: React.ReactNode;
}

/** 身份列表行：只展示头像与昵称。 */
export function IdentityItem({
  model,
  identity,
  testId,
  nameTestId,
  onClick,
  trailing,
}: IdentityItemProps) {
  const content = (
    <>
      <IdentityAvatar
        model={model}
        identity={identity}
        size={48}
        className={styles.IdentityItem.Avatar}
      />
      <span className={styles.IdentityItem.Name} data-test-id={nameTestId}>
        {identity.name}
      </span>
      {trailing}
    </>
  );

  if (!onClick) {
    return (
      <div className={styles.IdentityItem.Root} data-test-id={testId}>
        {content}
      </div>
    );
  }

  return (
    <button
      className={styles.IdentityItem.Root}
      type='button'
      data-test-id={testId}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
