import { formatEntryTime } from '@/core/diary/selectors';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { localize } from '@/nls';
import { Hourglass, X } from 'lucide-react';
import React from 'react';

interface TimeMachineTagProps {
  timestamp: number;
  onEdit: () => void;
  onRemove: () => void;
}

/** 输入框上方的时光机时间气泡，点时间重新编辑，点 X 取消选择。 */
export function TimeMachineTag({ timestamp, onEdit, onRemove }: TimeMachineTagProps) {
  return (
    <div className={styles.DiaryChatFooter.IdentityTagRow}>
      <span className={styles.DiaryChatFooter.IdentityTag}>
        <button
          type='button'
          className={styles.DiaryChatFooter.IdentityTagEdit}
          aria-label={localize('diary.timeMachine.tagEdit', 'Edit selected time')}
          data-test-id={DiaryChat.timeMachineTag}
          onClick={onEdit}
        >
          <Hourglass size={14} />
          <span className={styles.DiaryChatFooter.IdentityTagName}>
            {formatEntryTime(timestamp)}
          </span>
        </button>
        <button
          type='button'
          className={styles.DiaryChatFooter.IdentityTagRemove}
          aria-label={localize('diary.timeMachine.tagRemove', 'Clear selected time')}
          data-test-id={DiaryChat.timeMachineTagRemove}
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      </span>
    </div>
  );
}
