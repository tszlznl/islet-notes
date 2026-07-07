import type { CalendarDayRecord } from '@/core/state/calendar';
import { useService } from '@/hooks/use-service';
import { useAttachmentThumbUrl } from '@/mobile/hooks/useAttachmentThumbUrl';
import { useImagePreview } from '@/mobile/overlay/imagePreview/useImagePreview';
import { useVideoPlayer } from '@/mobile/overlay/videoPlayer/useVideoPlayer';
import { styles } from '@/mobile/styles/ui';
import { Calendar } from '@/mobile/test.id';
import { IFileAssetService } from '@/services/fileAsset/common/fileAssetService';
import { localize } from '@/nls';
import { CircleDotDashed } from 'lucide-react';
import React, { useRef } from 'react';

export function CalendarRecordImage({
  attachment,
  previewAttachments,
}: {
  attachment: NonNullable<CalendarDayRecord['image']>;
  previewAttachments: NonNullable<CalendarDayRecord['image']>[];
}) {
  const fileAssetService = useService(IFileAssetService);
  const url = useAttachmentThumbUrl(attachment, { role: 'thumbnail' });
  const showImagePreview = useImagePreview();
  const showVideoPlayer = useVideoPlayer();
  const originRef = useRef<HTMLButtonElement>(null);
  const livePhoto = attachment.livePhoto;

  return (
    <button
      ref={originRef}
      className={styles.CalendarRecordImage.Button}
      type='button'
      data-test-id={Calendar.recordImageButton}
      onClick={() => {
        showImagePreview({
          attachments: previewAttachments.length ? previewAttachments : [attachment],
          initialAttachmentId: attachment.id,
          originRef,
        });
      }}
    >
      {url ? (
        <img
          className={styles.CalendarRecordImage.Image}
          data-test-id={Calendar.recordImage}
          src={url}
          alt=''
        />
      ) : (
        <span className={styles.CalendarRecordImage.Placeholder} />
      )}
      {livePhoto && (
        <span
          className={styles.CalendarRecordImage.LivePhotoBadge}
          data-test-id={Calendar.recordLivePhotoBadge}
          role='button'
          tabIndex={0}
          aria-label={localize('diary.livePhoto.play', 'Play Live Photo')}
          onClick={(event) => {
            event.stopPropagation();
            showVideoPlayer({
              loadUrl: () => fileAssetService.getLivePhotoVideoUrl(attachment),
            });
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            showVideoPlayer({
              loadUrl: () => fileAssetService.getLivePhotoVideoUrl(attachment),
            });
          }}
        >
          <CircleDotDashed size={16} />
        </span>
      )}
    </button>
  );
}
