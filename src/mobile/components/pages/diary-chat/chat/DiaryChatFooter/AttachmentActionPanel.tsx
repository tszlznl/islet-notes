import { localize } from '@/nls';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { Camera, Hourglass, Image as ImageIcon, Video } from 'lucide-react';
import React from 'react';

interface AttachmentActionPanelProps {
  videoSupported: boolean;
  /** iOS 原生上未开通会员不展示时光机，避免引导到应用外购买。 */
  timeMachineVisible: boolean;
  timeMachineDisabled: boolean;
  onPickFromAlbum: () => void;
  onTakePhoto: () => void;
  onStartRecordVideo: () => void;
  onOpenTimeMachine: () => void;
}

export function AttachmentActionPanel({
  videoSupported,
  timeMachineVisible,
  timeMachineDisabled,
  onPickFromAlbum,
  onTakePhoto,
  onStartRecordVideo,
  onOpenTimeMachine,
}: AttachmentActionPanelProps) {
  return (
    <div className={styles.DiaryChatFooter.PlusPanel} data-test-id={DiaryChat.plusPanel}>
      <button
        className={styles.DiaryChatFooter.PlusAction}
        type='button'
        data-test-id={DiaryChat.album}
        onClick={onPickFromAlbum}
      >
        <span className={styles.DiaryChatFooter.PlusTile}>
          <ImageIcon size={28} strokeWidth={1.3} />
        </span>
        <span className={styles.DiaryChatFooter.PlusLabel}>{localize('diary.album', 'Album')}</span>
      </button>
      <button
        className={styles.DiaryChatFooter.PlusAction}
        type='button'
        data-test-id={DiaryChat.camera}
        onClick={onTakePhoto}
      >
        <span className={styles.DiaryChatFooter.PlusTile}>
          <Camera size={28} strokeWidth={1.3} />
        </span>
        <span className={styles.DiaryChatFooter.PlusLabel}>
          {localize('diary.camera', 'Camera')}
        </span>
      </button>
      {videoSupported && (
        <button
          className={styles.DiaryChatFooter.PlusAction}
          type='button'
          data-test-id={DiaryChat.video}
          onClick={onStartRecordVideo}
        >
          <span className={styles.DiaryChatFooter.PlusTile}>
            <Video size={28} strokeWidth={1.3} />
          </span>
          <span className={styles.DiaryChatFooter.PlusLabel}>
            {localize('diary.recordVideo', 'Record video')}
          </span>
        </button>
      )}
      {timeMachineVisible && (
        <button
          className={styles.DiaryChatFooter.PlusAction}
          type='button'
          data-test-id={DiaryChat.timeMachine}
          disabled={timeMachineDisabled}
          onClick={onOpenTimeMachine}
        >
          <span className={styles.DiaryChatFooter.PlusTile}>
            <Hourglass size={28} strokeWidth={1.3} />
          </span>
          <span className={styles.DiaryChatFooter.PlusLabel}>
            {localize('diary.timeMachine', 'Time machine')}
          </span>
        </button>
      )}
    </div>
  );
}
