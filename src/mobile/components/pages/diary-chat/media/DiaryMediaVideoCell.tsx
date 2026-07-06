import type { VideoAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useVideoPlayer } from '@/mobile/overlay/videoPlayer/useVideoPlayer';
import { styles } from '@/mobile/styles/ui';
import { DiaryMedia } from '@/mobile/test.id';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { Play } from 'lucide-react';
import React from 'react';

interface DiaryMediaVideoCellProps {
  attachment: VideoAttachmentRecord;
}

export function DiaryMediaVideoCell({ attachment }: DiaryMediaVideoCellProps) {
  const fileAssetService = useService(IFileAssetService);
  const showToast = useSuccessToast();
  const showVideoPlayer = useVideoPlayer();
  const thumbnailUrl = useAttachmentThumbUrl(attachment, { role: 'thumbnail' });

  const openPlayer = () => {
    const s3Key = attachment.s3Key;
    if (!s3Key) {
      showToast({ message: localize('diary.video.missing', 'Video is missing'), icon: 'none' });
      return;
    }
    showVideoPlayer({ loadUrl: () => fileAssetService.getFileUrl(s3Key, { role: 'large' }) });
  };

  return (
    <button
      type='button'
      className={styles.DiaryMediaPage.Cell}
      data-test-id={DiaryMedia.videoButton}
      onClick={openPlayer}
    >
      {thumbnailUrl ? (
        <img
          className={styles.DiaryMediaPage.Image}
          data-test-id={DiaryMedia.videoThumbnail}
          src={thumbnailUrl}
          alt=''
        />
      ) : (
        <span
          className={styles.DiaryMediaPage.Placeholder}
          data-test-id={DiaryMedia.videoThumbnail}
          aria-hidden='true'
        />
      )}
      <span className={styles.DiaryMediaPage.VideoPlayBadge} aria-hidden='true'>
        <Play
          size={15}
          fill='#ffffff'
          color='#ffffff'
          className={styles.DiaryMediaPage.VideoPlayIcon}
        />
      </span>
    </button>
  );
}
