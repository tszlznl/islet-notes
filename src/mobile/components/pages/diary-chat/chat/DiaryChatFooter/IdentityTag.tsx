import type { DiaryModelData, IdentityRecord } from '@/core/diary/type';
import { IdentityAvatar } from '@/mobile/components/IdentityAvatar';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { X } from 'lucide-react';
import React from 'react';

interface IdentityTagProps {
  model: DiaryModelData;
  identity: IdentityRecord;
  onRemove: () => void;
}

/** 输入框上方的当前身份 tag，点 X 取消选择。 */
export function IdentityTag({ model, identity, onRemove }: IdentityTagProps) {
  return (
    <div className={styles.DiaryChatFooter.IdentityTagRow}>
      <span className={styles.DiaryChatFooter.IdentityTag} data-test-id={DiaryChat.identityTag}>
        <IdentityAvatar
          model={model}
          identity={identity}
          size={20}
          className={styles.DiaryChatFooter.IdentityTagAvatar}
        />
        <span className={styles.DiaryChatFooter.IdentityTagName}>{identity.name}</span>
        <button
          type='button'
          className={styles.DiaryChatFooter.IdentityTagRemove}
          aria-label={localize('identity.tagRemove', 'Clear selected identity')}
          data-test-id={DiaryChat.identityTagRemove}
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      </span>
    </div>
  );
}
