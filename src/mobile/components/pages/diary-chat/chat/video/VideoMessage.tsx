import { EntryHighlightOverlay, useIsEntryHighlighted } from '@/base/just-vibes/entry-highlight';
import type { VideoAttachmentRecord } from '@/core/diary/type';
import { useService } from '@/hooks/use-service';
import { ImageLoadingPlaceholder } from '@/mobile/components/image/ImageLoadingPlaceholder';
import { useAttachmentExportAction } from '@/mobile/hooks/useAttachmentExportAction';
import { useEntryLongPressActions } from '@/mobile/hooks/useEntryLongPressActions';
import { useSuccessToast } from '@/mobile/overlay/successToast/useSuccessToast';
import { useVideoPlayer } from '@/mobile/overlay/videoPlayer/useVideoPlayer';
import { styles } from '@/mobile/styles/ui';
import { DiaryChat } from '@/mobile/test.id';
import { loadImageUrl } from '@/mobile/utils/imageLoad';
import { localize } from '@/nls';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { Play } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getImageMessageStyle } from '../image/main';

interface VideoMessageProps {
  entryId: string;
  attachment: VideoAttachmentRecord;
}

export function VideoMessage({ entryId, attachment }: VideoMessageProps) {
  const fileAssetService = useService(IFileAssetService);
  const showToast = useSuccessToast();
  const showVideoPlayer = useVideoPlayer();
  const exportAction = useAttachmentExportAction(attachment);
  const { anchorRef, longPressEvents } = useEntryLongPressActions<HTMLButtonElement>(entryId, {
    extraActions: exportAction ? [exportAction] : undefined,
  });
  const highlighted = useIsEntryHighlighted(entryId);
  const [thumbUrl, setThumbUrl] = useState<string>();
  const imageStyle = getImageMessageStyle(attachment.width, attachment.height);
  const thumbnailKey = attachment.thumbS3Key ?? attachment.s3Key;

  useEffect(() => {
    let disposed = false;
    setThumbUrl(undefined);
    if (!thumbnailKey) return;
    void loadImageUrl(fileAssetService, thumbnailKey, {
      role: 'thumbnail',
    }).then((url) => {
      if (!disposed && url) setThumbUrl(url);
    });
    return () => {
      disposed = true;
    };
  }, [fileAssetService, thumbnailKey]);

  // 点击视频直接打开播放器弹窗，不走图片预览。
  const openPlayer = () => {
    const s3Key = attachment.s3Key;
    if (!s3Key) {
      showToast({
        message: localize('diary.video.missing', 'Video is missing'),
        icon: 'none',
      });
      return;
    }
    showVideoPlayer({
      loadUrl: () => fileAssetService.getFileUrl(s3Key, { role: 'large' }),
    });
  };

  return (
    <div
      className={styles.ImageMessage.Root}
      data-test-id={DiaryChat.videoMessage}
      style={imageStyle}
    >
      <button
        ref={anchorRef}
        className={styles.AttachmentImage.ImageButton}
        type='button'
        data-test-id={DiaryChat.videoButton}
        onClick={openPlayer}
        {...longPressEvents}
      >
        {thumbUrl ? (
          <img className={styles.AttachmentImage.Image} src={thumbUrl} alt='' style={imageStyle} />
        ) : (
          <ImageLoadingPlaceholder
            className={styles.AttachmentImage.PlaceholderFull}
            style={imageStyle}
          />
        )}
        <span className={styles.VideoMessage.PlayBadge}>
          <span className={styles.VideoMessage.PlayCircle}>
            <Play
              className={styles.VideoMessage.PlayIcon}
              size={16}
              fill='#ffffff'
              color='#ffffff'
            />
          </span>
        </span>
        <EntryHighlightOverlay active={highlighted} />
      </button>
    </div>
  );
}
