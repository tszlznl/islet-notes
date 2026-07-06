import { localize } from '@/nls';
import { DiaryChat } from '@/mobile/test.id';
import { styles } from '@/mobile/styles/ui';
import { Camera, Image as ImageIcon, Video } from 'lucide-react';
import React from 'react';

interface AttachmentActionPanelProps {
  videoSupported: boolean;
  onPickFromAlbum: () => void;
  onTakePhoto: () => void;
  onStartRecordVideo: () => void;
}

export function AttachmentActionPanel({
  videoSupported,
  onPickFromAlbum,
  onTakePhoto,
  onStartRecordVideo,
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
    </div>
  );
}
